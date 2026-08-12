-- ============================================================
-- SAWO: SEO Keyword Intelligence — Semrush snapshot addendum
-- Run this AFTER setup-seo-keyword-intelligence.sql, in the Supabase SQL Editor.
--
-- Adds a FOURTH, clearly-labeled data type: source_type = 'semrush_snapshot'.
-- This is REAL data (actual competitor organic rankings and a real
-- keyword-gap comparison with search volume + keyword difficulty) sourced
-- from a Semrush subscription that has a hard expiration date (~16 days
-- from 2026-08-12, so ~2026-08-28) — see seo-semrush-snapshot.js. Unlike
-- own_gsc/tracked_serp (continuously refreshed) or content_extraction
-- (re-crawled monthly), this data is a POINT-IN-TIME SNAPSHOT that will
-- stop being refreshable once the subscription lapses — the dashboard
-- must show the snapshot date prominently so it's never mistaken for live
-- data.
-- ============================================================

ALTER TABLE seo_keywords ADD COLUMN IF NOT EXISTS search_volume INTEGER;
ALTER TABLE seo_keywords ADD COLUMN IF NOT EXISTS keyword_difficulty NUMERIC;

ALTER TABLE seo_keywords DROP CONSTRAINT IF EXISTS seo_keywords_source_type_check;
ALTER TABLE seo_keywords ADD CONSTRAINT seo_keywords_source_type_check
  CHECK (source_type IN ('own_gsc', 'content_extraction', 'tracked_serp', 'semrush_snapshot'));

-- Re-crawling/re-snapshotting a domain updates rather than duplicates its
-- semrush_snapshot rows, same as content_extraction — the import script
-- deletes-then-inserts per (domain, keyword-set-purpose), so no additional
-- unique index is needed here.

-- ============================================================
-- ROLLBACK
-- ============================================================
-- ALTER TABLE seo_keywords DROP CONSTRAINT IF EXISTS seo_keywords_source_type_check;
-- ALTER TABLE seo_keywords ADD CONSTRAINT seo_keywords_source_type_check
--   CHECK (source_type IN ('own_gsc', 'content_extraction', 'tracked_serp'));
-- ALTER TABLE seo_keywords DROP COLUMN IF EXISTS search_volume;
-- ALTER TABLE seo_keywords DROP COLUMN IF EXISTS keyword_difficulty;
