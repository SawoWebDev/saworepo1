#!/usr/bin/env node
// seo-serp-check.js
// Phase 3 of the SEO Keyword Intelligence module — checks real SERP
// position for each active row in `seo_tracked_keywords` against the
// configured SerpProvider, storing results as source_type = 'tracked_serp'.
//
// QUOTA: the user's SerpApi plan allows 200 searches/month; this script
// enforces a stricter 130/month cap (SERPAPI_MONTHLY_LIMIT) via
// seo_serp_usage as a safety margin. Once exhausted for the current month,
// remaining keywords are deferred to the next scheduled run rather than
// failing the whole batch — matches the spec's graceful-degradation
// requirement.
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getSerpProvider } from "./seo-keyword-intelligence/serpProvider.js";
import { getRemainingQuota, recordSearchUsed } from "./seo-keyword-intelligence/serpQuota.js";
import { recordCheckRun } from "./seo-keyword-intelligence/ciCheckRuns.js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Per-run budget on top of the monthly cap, so one run doesn't spend the
// whole month's quota against a single week's tracked list. Defaults to a
// weekly-cadence-friendly slice of the monthly limit.
const PER_RUN_LIMIT = parseInt(process.env.SERPAPI_PER_RUN_LIMIT || "26", 10);

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    await recordCheckRun("SEO: SERP Check", "failure", "Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY");
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let provider;
  try {
    provider = getSerpProvider();
  } catch (err) {
    console.error(`❌ ${err.message}`);
    await recordCheckRun("SEO: SERP Check", "failure", err.message);
    process.exitCode = 1;
    return;
  }

  const { data: tracked, error } = await supabase.from("seo_tracked_keywords").select("*").eq("is_active", true);
  if (error) {
    console.error("❌ Failed to load seo_tracked_keywords:", error.message);
    await recordCheckRun("SEO: SERP Check", "failure", error.message);
    process.exitCode = 1;
    return;
  }

  if (!tracked.length) {
    console.log("No active tracked keywords configured — nothing to check.");
    await recordCheckRun("SEO: SERP Check", "success", "0 tracked keywords configured");
    return;
  }

  const quota = await getRemainingQuota(supabase);
  const budget = Math.min(quota.remaining, PER_RUN_LIMIT);
  console.log(`Quota: ${quota.used}/${quota.limit} used this month. This run's budget: ${budget}.`);

  if (budget <= 0) {
    const msg = `Monthly SerpApi quota exhausted (${quota.used}/${quota.limit}) — all ${tracked.length} keyword(s) deferred to next run.`;
    console.log(`⏸ ${msg}`);
    await recordCheckRun("SEO: SERP Check", "success", msg); // not a failure — graceful degradation, per spec
    return;
  }

  const toCheck = tracked.slice(0, budget);
  const deferred = tracked.length - toCheck.length;

  let checked = 0;
  let failed = 0;
  const rows = [];

  for (const { keyword, target_domain } of toCheck) {
    try {
      const result = await provider.checkPosition(keyword, target_domain);
      rows.push({
        domain: target_domain,
        keyword,
        source_type: "tracked_serp",
        position: result.position,
        url: result.url,
        checked_at: result.checkedAt,
      });
      checked += 1;
      console.log(`  ✓ "${keyword}" vs ${target_domain}: position ${result.position ?? "not found"}`);
    } catch (err) {
      failed += 1;
      console.warn(`  ⚠ "${keyword}" vs ${target_domain} failed: ${err.message}`);
    }
  }

  if (rows.length) {
    const { error: insertError } = await supabase.from("seo_keywords").insert(rows);
    if (insertError) {
      console.error("❌ Failed to store results:", insertError.message);
      await recordCheckRun("SEO: SERP Check", "failure", insertError.message);
      process.exitCode = 1;
      return;
    }
  }

  // Only count successful provider calls against quota — a failed request
  // (network error, 5xx) shouldn't burn budget that produced nothing.
  if (checked > 0) await recordSearchUsed(supabase, quota.yearMonth, checked);

  const message = `${checked} checked, ${failed} failed, ${deferred} deferred (quota budget)`;
  console.log(`✅ ${message}`);
  await recordCheckRun("SEO: SERP Check", failed > 0 && checked === 0 ? "failure" : "success", message);
}

main();
