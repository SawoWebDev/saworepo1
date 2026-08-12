#!/usr/bin/env node
// seo-semrush-import.js
// Imports a Semrush data snapshot (seo-keyword-intelligence/semrush-snapshot-*.json)
// into `seo_keywords` as source_type = 'semrush_snapshot', and seeds
// `seo_competitors` with the REAL, relevance-verified competitor domains
// Semrush found — so the free/ongoing seo-competitor-crawl.js pipeline
// keeps benefiting from this data even after the Semrush subscription
// expires (~2026-08-28 — 16 days from the 2026-08-12 pull).
//
// WHY A JSON FILE INSTEAD OF LIVE API CALLS: the user's Semrush API key is
// a "semrtkn-pat-..." PAT, which is for Semrush's newer v3 API — it was
// tested against the classic api.semrush.com endpoint (the one this
// script would otherwise call directly) and rejected with
// "ERROR 120 :: WRONG KEY - ID PAIR". The data below was instead pulled
// through the already-authenticated Semrush MCP connector in the same
// session this script was written in. Re-running/expanding this snapshot
// before the subscription lapses requires another interactive session
// with Semrush MCP access — this script only handles the IMPORT half.
//
// Run: node seo-semrush-import.js [path-to-snapshot.json]
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { recordCheckRun } from "./seo-keyword-intelligence/ciCheckRuns.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const snapshotPath = process.argv[2] || path.join(__dirname, "seo-keyword-intelligence", "semrush-snapshot-2026-08-12.json");

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(snapshotPath)) {
    console.error(`❌ Snapshot file not found: ${snapshotPath}`);
    process.exitCode = 1;
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const checkedAt = new Date(`${snapshot.snapshotDate}T00:00:00Z`).toISOString();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1) Seed seo_competitors with the real, relevance-verified list —
  // upsert so re-running this script doesn't duplicate or clobber
  // last_crawled_at for domains the free crawler has already visited.
  const competitorDomains = snapshot.seedCompetitorsIntoSeoCompetitors || [];
  if (competitorDomains.length) {
    const { data: existing } = await supabase.from("seo_competitors").select("domain").in("domain", competitorDomains);
    const existingSet = new Set((existing || []).map((r) => r.domain));
    const toInsert = competitorDomains.filter((d) => !existingSet.has(d)).map((d) => ({ domain: d, is_active: true, created_by: "semrush-import" }));
    if (toInsert.length) {
      const { error } = await supabase.from("seo_competitors").insert(toInsert);
      if (error) throw error;
    }
    console.log(`✅ Seeded seo_competitors: ${toInsert.length} new, ${existingSet.size} already present.`);
  }

  // 2) Build the seo_keywords rows for every domain touched by this snapshot.
  const touchedDomains = new Set(["sawo.com", ...Object.keys(snapshot.competitorKeywords || {})]);
  for (const row of snapshot.keywordGap?.rows || []) {
    for (const domain of Object.keys(row.positions || {})) touchedDomains.add(domain);
  }

  const rows = [];

  for (const k of snapshot.ownKeywords || []) {
    if (k.position == null) continue; // "not ranking" rows are informational only, not a real position
    rows.push({
      domain: "sawo.com",
      keyword: k.keyword,
      source_type: "semrush_snapshot",
      position: k.position,
      url: k.url,
      search_volume: k.search_volume ?? null,
      checked_at: checkedAt,
    });
  }

  for (const [domain, keywords] of Object.entries(snapshot.competitorKeywords || {})) {
    for (const k of keywords) {
      rows.push({
        domain,
        keyword: k.keyword,
        source_type: "semrush_snapshot",
        position: k.position,
        url: k.url,
        search_volume: k.search_volume ?? null,
        checked_at: checkedAt,
      });
    }
  }

  for (const gapRow of snapshot.keywordGap?.rows || []) {
    for (const [domain, position] of Object.entries(gapRow.positions || {})) {
      if (!position) continue; // 0 = not ranking, nothing to store
      rows.push({
        domain,
        keyword: gapRow.keyword,
        source_type: "semrush_snapshot",
        position,
        url: null,
        search_volume: gapRow.search_volume ?? null,
        keyword_difficulty: gapRow.keyword_difficulty ?? null,
        checked_at: checkedAt,
      });
    }
  }

  // Re-running this script (e.g. after pulling a broader snapshot before
  // day 16) should REPLACE, not duplicate — delete existing semrush_snapshot
  // rows for every domain this snapshot touches first, mirroring
  // seo-competitor-crawl.js's delete-then-insert pattern.
  for (const domain of touchedDomains) {
    const { error } = await supabase.from("seo_keywords").delete().eq("domain", domain).eq("source_type", "semrush_snapshot");
    if (error) throw error;
  }

  if (rows.length) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const { error } = await supabase.from("seo_keywords").insert(rows.slice(i, i + BATCH_SIZE));
      if (error) throw error;
    }
  }

  console.log(`✅ Imported ${rows.length} semrush_snapshot rows across ${touchedDomains.size} domain(s), dated ${snapshot.snapshotDate}.`);
  await recordCheckRun("SEO: Semrush Snapshot Import", "success", `${rows.length} rows imported (snapshot dated ${snapshot.snapshotDate}, one-time — subscription expires ~2026-08-28)`);
}

main().catch(async (err) => {
  console.error("❌", err.message);
  await recordCheckRun("SEO: Semrush Snapshot Import", "failure", err.message);
  process.exitCode = 1;
});
