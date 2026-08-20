-- ============================================================
-- SAWO: Product Translations — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- One row per (product, locale) — NOT locale-suffixed columns on `products`
-- (name_fi, name_ja, ...), which gets unworkable as more languages are
-- added (see docs/🔴 GO-LIVE/SAWO_Multilingual_Implementation_
-- Specification(1).md §7/§24). A product with no row for a given locale
-- simply has no translation yet — the frontend falls back to the English
-- `products` row for whichever fields are missing (name/short_description/
-- description are translated independently; a row can have just one of the
-- three set and fall back for the rest).
--
-- short_description/description are the same raw HTML the source `products`
-- columns hold (see components that render them with dangerouslySetInnerHTML)
-- — translate the text nodes, keep the markup identical, same rule as any
-- other HTML product content in this codebase.
--
-- Applied to production (2026-08-19) as a pilot: schema + 3 Steam Generator
-- products (STE/STN/STN-S) translated to Finnish, to validate the read/
-- fallback path end-to-end before translating the remaining ~300 products.
-- ============================================================

CREATE TABLE IF NOT EXISTS product_translations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale            TEXT NOT NULL,
  name              TEXT,
  short_description TEXT,
  description       TEXT,
  updated_by        TEXT,
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, locale)
);

CREATE INDEX IF NOT EXISTS product_translations_product_id_idx ON product_translations (product_id);

ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;

-- Matches products/page_seo's current policy shape: RLS enabled but
-- permissive (anon + authenticated) — see setup-page-seo.sql's note on
-- access control migrating toward real Supabase Auth role checks.
DROP POLICY IF EXISTS "product_translations_select" ON product_translations;
CREATE POLICY "product_translations_select" ON product_translations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "product_translations_insert" ON product_translations;
CREATE POLICY "product_translations_insert" ON product_translations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "product_translations_update" ON product_translations;
CREATE POLICY "product_translations_update" ON product_translations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "product_translations_delete" ON product_translations;
CREATE POLICY "product_translations_delete" ON product_translations FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS product_translations;
