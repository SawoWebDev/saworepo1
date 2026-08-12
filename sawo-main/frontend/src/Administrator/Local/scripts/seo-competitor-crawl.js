#!/usr/bin/env node
// seo-competitor-crawl.js
// Phase 2 of the SEO Keyword Intelligence module — crawls each active
// competitor domain in `seo_competitors`, extracts prominent keyword
// phrases from their content via RAKE, and stores them as a distinct,
// clearly-labeled data type: source_type = 'content_extraction'.
//
// THIS IS NOT RANKING DATA. It's inferred content themes from what a
// competitor's own pages talk about — never conflate with own_gsc or
// tracked_serp positions (see setup-seo-keyword-intelligence.sql header
// and the admin UI's explicit "topics they emphasize" labeling).
//
// Runs as a GitHub Actions Node job, not a Cloudflare Pages Function — a
// bounded BFS of up to MAX_PAGES pages needs more time/CPU than Workers'
// per-request limits allow, matching how this repo already runs
// Lighthouse/sitemap generation in Actions rather than at the edge.
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import { extractKeywords } from "./seo-keyword-intelligence/rake.js";
import { extractPageContent, discoverInternalLinks } from "./seo-keyword-intelligence/contentExtraction.js";
import { fetchRobotsRules, isDisallowed, discoverUrlsFromSitemaps, CRAWLER_USER_AGENT } from "./seo-keyword-intelligence/robotsAndSitemap.js";
import { recordCheckRun } from "./seo-keyword-intelligence/ciCheckRuns.js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_PAGES = parseInt(process.env.SEO_CRAWL_MAX_PAGES || "200", 10);
const POLITENESS_DELAY_MS = parseInt(process.env.SEO_CRAWL_DELAY_MS || "1500", 10);
const TOP_KEYWORDS_PER_DOMAIN = 100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { "User-Agent": CRAWLER_USER_AGENT }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error(`Not HTML (${contentType})`);
  return res.text();
}

async function discoverUrls(origin, robots) {
  if (robots.sitemaps.length) {
    const fromSitemap = await discoverUrlsFromSitemaps(robots.sitemaps, MAX_PAGES);
    if (fromSitemap.length) return { urls: fromSitemap, viaSitemap: true };
  }
  // Fall back to the conventional /sitemap.xml location even if robots.txt didn't mention one.
  const fallback = await discoverUrlsFromSitemaps([new URL("/sitemap.xml", origin).toString()], MAX_PAGES);
  if (fallback.length) return { urls: fallback, viaSitemap: true };
  return { urls: [origin], viaSitemap: false }; // BFS starting point only
}

async function crawlDomain(domain) {
  const origin = `https://${domain}`;
  const robots = await fetchRobotsRules(origin);
  const { urls: seedUrls, viaSitemap } = await discoverUrls(origin, robots);

  const visited = new Set();
  const queue = [...seedUrls];
  const pages = [];
  const skipped = [];

  while (queue.length && visited.size < MAX_PAGES) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      continue;
    }
    if (isDisallowed(pathname, robots.disallow)) {
      skipped.push(url);
      continue;
    }

    try {
      const html = await fetchPage(url);
      const content = extractPageContent(html);
      pages.push({ url, ...content });

      // Only BFS-discover further links when we didn't already have a full
      // sitemap list (sitemap discovery already gives us the page set).
      if (!viaSitemap) {
        for (const link of discoverInternalLinks(html, url)) {
          if (!visited.has(link) && queue.length + visited.size < MAX_PAGES * 2) queue.push(link);
        }
      }
    } catch (err) {
      console.warn(`  ⚠ ${url}: ${err.message}`);
    }

    await sleep(POLITENESS_DELAY_MS);
  }

  console.log(`  Skipped ${skipped.length} disallowed path(s).`);
  return pages;
}

/** RAKE per page, then aggregate+dedupe scores across every page for the domain. */
function aggregateDomainKeywords(pages) {
  const byPhrase = new Map(); // phrase -> { score, bestUrl, bestScore }

  for (const page of pages) {
    const keywords = extractKeywords({
      title: page.title,
      headings: page.headings,
      metaDescription: page.metaDescription,
      body: page.body,
    });

    for (const { phrase, score } of keywords) {
      const existing = byPhrase.get(phrase);
      if (!existing) {
        byPhrase.set(phrase, { totalScore: score, bestUrl: page.url, bestScore: score });
      } else {
        existing.totalScore += score;
        if (score > existing.bestScore) {
          existing.bestScore = score;
          existing.bestUrl = page.url;
        }
      }
    }
  }

  return Array.from(byPhrase.entries())
    .map(([phrase, { totalScore, bestUrl }]) => ({ phrase, score: totalScore, url: bestUrl }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_KEYWORDS_PER_DOMAIN);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    await recordCheckRun("SEO: Competitor Crawl", "failure", "Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY");
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: competitors, error } = await supabase.from("seo_competitors").select("*").eq("is_active", true);
  if (error) {
    console.error("❌ Failed to load seo_competitors:", error.message);
    await recordCheckRun("SEO: Competitor Crawl", "failure", error.message);
    process.exitCode = 1;
    return;
  }

  if (!competitors.length) {
    console.log("No active competitors configured — nothing to crawl.");
    await recordCheckRun("SEO: Competitor Crawl", "success", "0 competitors configured");
    return;
  }

  let totalKeywords = 0;
  const failures = [];

  for (const competitor of competitors) {
    console.log(`\n🔎 Crawling ${competitor.domain}...`);
    try {
      const pages = await crawlDomain(competitor.domain);
      console.log(`  Fetched ${pages.length} page(s).`);
      const keywords = aggregateDomainKeywords(pages);

      // Re-crawling a domain UPDATES rather than duplicates its keyword set
      // (spec Phase 2 acceptance criteria) — delete-then-insert per domain
      // rather than trying to upsert-match on shifting page attribution.
      const { error: deleteError } = await supabase
        .from("seo_keywords")
        .delete()
        .eq("domain", competitor.domain)
        .eq("source_type", "content_extraction");
      if (deleteError) throw deleteError;

      if (keywords.length) {
        const now = new Date().toISOString();
        const { error: insertError } = await supabase.from("seo_keywords").insert(
          keywords.map((k) => ({
            domain: competitor.domain,
            keyword: k.phrase,
            source_type: "content_extraction",
            url: k.url,
            content_score: k.score,
            checked_at: now,
          }))
        );
        if (insertError) throw insertError;
      }

      await supabase.from("seo_competitors").update({ last_crawled_at: new Date().toISOString() }).eq("id", competitor.id);
      totalKeywords += keywords.length;
      console.log(`  ✅ Stored ${keywords.length} keyword(s) for ${competitor.domain}.`);
    } catch (err) {
      console.error(`  ❌ ${competitor.domain} failed: ${err.message}`);
      failures.push(`${competitor.domain}: ${err.message}`);
    }
  }

  const status = failures.length === competitors.length ? "failure" : failures.length ? "success" : "success";
  const message = `${competitors.length - failures.length}/${competitors.length} domains crawled, ${totalKeywords} keywords stored` + (failures.length ? `; failures: ${failures.join("; ")}` : "");
  await recordCheckRun("SEO: Competitor Crawl", status, message);
  if (failures.length === competitors.length) process.exitCode = 1;
}

main();
