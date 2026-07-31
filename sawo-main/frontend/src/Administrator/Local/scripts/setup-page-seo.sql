-- ============================================================
-- SAWO: Static-Page SEO Overrides — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Companion to setup-seo-fields.sql, which added meta_title/meta_description/
-- og_image columns to the `products` and `sauna_rooms` tables for per-product
-- and per-room detail pages. This table covers the OTHER ~42 pages — hub and
-- category pages (Home, /sauna/heaters, /contact, /about, etc.) whose title/
-- description otherwise live hard-coded in JSX (see components/SEO.jsx and
-- each page's own <SEO title="..." description="..." /> call).
--
-- One row per route `path`. Empty/missing columns mean "no override" — the
-- frontend keeps using whatever <SEO> was already passed in code, so this
-- table is purely additive and safe to leave empty.
--
-- Already applied to production (2026-07-30) — this file exists for
-- reproducibility (fresh/staging projects) and as documentation, not as a
-- pending step.
-- ============================================================

-- NOTE ON ACCESS CONTROL: this project's admin login is (as of this file)
-- migrating toward real Supabase Auth (see setup-users-security.sql) — once
-- that lands, tighten these policies to require `authenticated` +
-- role-checked writes, matching whatever pattern is used there. Until then,
-- this intentionally matches every other CMS-writable table: RLS enabled,
-- but permissive (anon + authenticated), since there is no other
-- session-verification layer in place yet.

CREATE TABLE IF NOT EXISTS page_seo (
  path              TEXT PRIMARY KEY,   -- route path, e.g. "/sauna/heaters/tower"
  meta_title        TEXT,
  meta_description  TEXT,
  og_image          TEXT,
  updated_by        TEXT,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE page_seo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_seo_select" ON page_seo;
CREATE POLICY "page_seo_select" ON page_seo FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "page_seo_insert" ON page_seo;
CREATE POLICY "page_seo_insert" ON page_seo FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "page_seo_update" ON page_seo;
CREATE POLICY "page_seo_update" ON page_seo FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "page_seo_delete" ON page_seo;
CREATE POLICY "page_seo_delete" ON page_seo FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS page_seo;
