-- ============================================================
-- SAWO: SEO Keyword Intelligence — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Backs the SEO Keyword Intelligence CMS module (docs/🟢 SEO/
-- SEO-KEYWORD-INTELLIGENCE-SPEC.md). Three pipelines write into one
-- unified `seo_keywords` table, distinguished by `source_type`:
--   - own_gsc            : real ranking data pulled from Google Search
--                          Console for a domain we control (see
--                          seo-gsc-sync.js). Currently targets sawo.com
--                          (the live WordPress site's existing, already-
--                          verified GSC property) via the GSC_SITE_URL
--                          config — NOT hardcoded, so this keeps working
--                          unchanged once the new site takes over the
--                          domain.
--   - content_extraction : keyword *themes* inferred from crawling a
--                          competitor's own content (see
--                          seo-competitor-crawl.js). This is NOT ranking
--                          data — never conflate the two in the UI.
--   - tracked_serp        : real (but limited) position checks for a small,
--                          manually curated keyword list, via SerpApi (see
--                          seo-serp-check.js).
--
-- All three write tables (seo_keywords, seo_serp_usage) are written only
-- by service-role scripts (local Node scripts / GitHub Actions), never by
-- the browser — so they carry no anon/authenticated write policy at all.
-- seo_tracked_keywords and seo_competitors ARE edited directly from the
-- CMS UI by a logged-in admin, so they get real write policies gated to
-- `authenticated` (not `anon`) — following the fix already recommended in
-- docs/🟡 PROJECT/PENDING-TASKS.md item #1 for the other 6 content tables
-- (block anonymous writes at the DB level; let the app's own
-- Administrator/permissions.js capability system gate which role can do
-- what), rather than the older permissive `USING (true)` pattern used by
-- page_seo/products/etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_keywords (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain            TEXT NOT NULL,          -- e.g. 'sawo.com' or a competitor's domain
  keyword           TEXT NOT NULL,
  source_type       TEXT NOT NULL CHECK (source_type IN ('own_gsc', 'content_extraction', 'tracked_serp')),
  position          NUMERIC,                -- own_gsc: avg position (fractional); tracked_serp: integer or NULL if not found
  url               TEXT,
  impressions       INTEGER,                -- own_gsc only
  clicks            INTEGER,                -- own_gsc only
  content_score     NUMERIC,                -- content_extraction only
  checked_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_keywords_domain_source ON seo_keywords(domain, source_type, keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_domain_checked ON seo_keywords(domain, checked_at);

-- Idempotent upsert target for seo-gsc-sync.js: one row per (domain,
-- keyword, page, date) — re-running a pull for a date range that was
-- already synced updates in place instead of duplicating. `checked_at` is
-- stored at UTC-midnight date granularity for own_gsc rows specifically
-- (country/device dimensions pulled from the API are aggregated away
-- before storage, per the module's own schema, which doesn't track them).
CREATE UNIQUE INDEX IF NOT EXISTS uq_seo_keywords_gsc
  ON seo_keywords (domain, keyword, url, checked_at)
  WHERE source_type = 'own_gsc';

-- One-time-backfill / daily-sync resume cursor for seo-gsc-sync.js, so a
-- 16-month backfill that gets interrupted (Actions job timeout, transient
-- API error) resumes from where it left off instead of restarting.
CREATE TABLE IF NOT EXISTS seo_sync_state (
  sync_name         TEXT PRIMARY KEY,       -- e.g. 'gsc_backfill:sawo.com'
  cursor_date       DATE,
  completed         BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manually curated keywords to track real SERP position for (Phase 4).
-- Deliberately small (tens, not thousands) — see seo-serp-check.js's
-- monthly-quota enforcement, which assumes a low row count here.
CREATE TABLE IF NOT EXISTS seo_tracked_keywords (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword           TEXT NOT NULL,
  target_domain     TEXT NOT NULL,          -- domain we're checking position FOR
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (keyword, target_domain)
);

-- Competitor domains to crawl for content-keyword themes (Phase 3).
CREATE TABLE IF NOT EXISTS seo_competitors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain            TEXT NOT NULL UNIQUE,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at   TIMESTAMPTZ,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Running monthly SerpApi usage counter. The user's SerpApi plan allows
-- 200 searches/month; seo-serp-check.js enforces a stricter 130/month cap
-- (SERPAPI_MONTHLY_LIMIT) using this table as a safety margin against the
-- real plan limit, and refuses to call the provider once exhausted for the
-- current month rather than erroring the whole batch.
CREATE TABLE IF NOT EXISTS seo_serp_usage (
  year_month        TEXT PRIMARY KEY,       -- 'YYYY-MM'
  searches_used     INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_tracked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_serp_usage ENABLE ROW LEVEL SECURITY;

-- seo_keywords: readable by the CMS (anon + authenticated, same as every
-- other dashboard-backing table), writable only by the service-role key
-- (no INSERT/UPDATE/DELETE policy at all — matches ci_check_runs' shape).
DROP POLICY IF EXISTS "seo_keywords_select" ON seo_keywords;
CREATE POLICY "seo_keywords_select" ON seo_keywords FOR SELECT TO anon, authenticated USING (true);

-- seo_sync_state / seo_serp_usage: internal job bookkeeping, not read by
-- the CMS UI directly — service-role only, no policies needed beyond RLS
-- being enabled (default-deny once enabled with zero policies).

-- seo_tracked_keywords: CMS-editable. Reads open (dashboard needs the
-- list); writes require a real logged-in session, not just the anon key.
DROP POLICY IF EXISTS "seo_tracked_keywords_select" ON seo_tracked_keywords;
CREATE POLICY "seo_tracked_keywords_select" ON seo_tracked_keywords FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "seo_tracked_keywords_insert" ON seo_tracked_keywords;
CREATE POLICY "seo_tracked_keywords_insert" ON seo_tracked_keywords FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seo_tracked_keywords_update" ON seo_tracked_keywords;
CREATE POLICY "seo_tracked_keywords_update" ON seo_tracked_keywords FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "seo_tracked_keywords_delete" ON seo_tracked_keywords;
CREATE POLICY "seo_tracked_keywords_delete" ON seo_tracked_keywords FOR DELETE TO authenticated USING (true);

-- seo_competitors: same shape as seo_tracked_keywords.
DROP POLICY IF EXISTS "seo_competitors_select" ON seo_competitors;
CREATE POLICY "seo_competitors_select" ON seo_competitors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "seo_competitors_insert" ON seo_competitors;
CREATE POLICY "seo_competitors_insert" ON seo_competitors FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seo_competitors_update" ON seo_competitors;
CREATE POLICY "seo_competitors_update" ON seo_competitors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "seo_competitors_delete" ON seo_competitors;
CREATE POLICY "seo_competitors_delete" ON seo_competitors FOR DELETE TO authenticated USING (true);

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS seo_keywords;
-- DROP TABLE IF EXISTS seo_sync_state;
-- DROP TABLE IF EXISTS seo_tracked_keywords;
-- DROP TABLE IF EXISTS seo_competitors;
-- DROP TABLE IF EXISTS seo_serp_usage;
