-- ============================================================
-- SAWO: Product Translation Freshness — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Adds field-level staleness tracking to product_translations, so the
-- Translation CMS can tell WHICH fields of a translation still match the
-- current English source and which don't — not just "this row exists."
--
-- source_field_hashes is a flat map { field_path: hash }, e.g.
--   { "name": "a1b2c3d4", "description": "9f8e7d6c",
--     "features[0]": "...", "variations[0].name": "..." }
-- keyed by the exact same path-label strings product-i18n.js's
-- buildPacket()/tmLookup already use. A path's presence as a key means
-- "this field was shown to whoever last applied a translation for this
-- row" — true whether they filled in a translation or deliberately left
-- it null (chose to keep the English value). Comparing the stored hash to
-- hash(current English value) at that same path is what lets the CMS
-- distinguish:
--   - no key at all            -> MISSING (never reviewed)
--   - key, hash matches        -> CURRENT (reviewed, still valid,
--                                 regardless of whether the field itself
--                                 is filled or null)
--   - key, hash differs        -> NEEDS_UPDATE (English changed since)
--
-- Hash function: FNV-1a 32-bit over normalize(text) (see
-- Administrator/Local/scripts/product-i18n-fields.js) — not
-- cryptographic, doesn't need to be; only needs to be deterministic.
--
-- Nullable, no default: existing rows get source_field_hashes = NULL,
-- meaning "pre-freshness-tracking row" — handled by
-- backfill-source-hashes.js, never treated as "everything stale."
-- ============================================================

ALTER TABLE product_translations
  ADD COLUMN IF NOT EXISTS source_field_hashes JSONB;

COMMENT ON COLUMN product_translations.source_field_hashes IS
  'Flat map of field-path -> hash(english value) at last apply time. NULL = pre-freshness-tracking row, needs backfill-source-hashes.js. See product-i18n-fields.js for the hash/path scheme.';

-- ============================================================
-- ROLLBACK
-- ============================================================
-- ALTER TABLE product_translations DROP COLUMN IF EXISTS source_field_hashes;
