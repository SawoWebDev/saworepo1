-- ============================================================
-- SAWO: Translation Memory — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- One row per (locale, exact source string) -> its translation. This
-- catalog's product copy is heavily boilerplated within and across
-- products in the same category — spec-table column headers ("Steam
-- Generator Model", "kW", "Weight (kg)"...), feature bullets ("Auto
-- drain", "Steam head included"...), and included-item titles repeat
-- near-verbatim across dozens of products. Translating the same phrase
-- from scratch every time is pure waste; this table makes it a lookup
-- after the first time.
--
-- Populated automatically by product-i18n.js's `apply` command — every
-- (english, translated) pair from an applied packet gets upserted here,
-- and every future `extract` checks this table first, pre-filling any
-- exact match into the new packet so only genuinely new text needs
-- translating. See README-i18n.md's "Product content" section.
--
-- Exact-match only (case/whitespace-normalized) — no fuzzy matching.
-- Good enough for this catalog's literal phrase reuse; a similarity-based
-- lookup would be a bigger, separate piece of infrastructure (pgvector
-- embeddings or similar) and isn't needed yet.
--
-- Applied to production (2026-08-19).
-- ============================================================

CREATE TABLE IF NOT EXISTS translation_memory (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale                TEXT NOT NULL,
  source_text           TEXT NOT NULL,        -- normalized (trimmed, whitespace-collapsed) English
  translated_text       TEXT NOT NULL,
  first_seen_product_id UUID REFERENCES products(id) ON DELETE SET NULL,  -- traceability only, not a foreign-key requirement for the memory to be useful
  hit_count             INTEGER NOT NULL DEFAULT 0,  -- how many times a later extract reused this entry
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (locale, source_text)
);

CREATE INDEX IF NOT EXISTS translation_memory_locale_idx ON translation_memory (locale);

ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;

-- Same permissive shape as product_translations/page_seo.
DROP POLICY IF EXISTS "translation_memory_select" ON translation_memory;
CREATE POLICY "translation_memory_select" ON translation_memory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "translation_memory_insert" ON translation_memory;
CREATE POLICY "translation_memory_insert" ON translation_memory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "translation_memory_update" ON translation_memory;
CREATE POLICY "translation_memory_update" ON translation_memory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "translation_memory_delete" ON translation_memory;
CREATE POLICY "translation_memory_delete" ON translation_memory FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS translation_memory;
