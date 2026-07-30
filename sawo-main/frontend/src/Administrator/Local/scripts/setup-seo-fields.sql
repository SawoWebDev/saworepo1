-- ============================================================
-- SAWO: Per-Product SEO Fields — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Adds optional per-product SEO overrides. When empty, the frontend
-- keeps using its existing derived title/description/image (see
-- SEO.jsx usage in DispProduct.jsx / DispAccessories.jsx /
-- DispSaunaRoom.jsx) — these columns are pure overrides, never
-- required.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image         TEXT;

ALTER TABLE sauna_rooms
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image         TEXT;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- ALTER TABLE products    DROP COLUMN IF EXISTS meta_title, DROP COLUMN IF EXISTS meta_description, DROP COLUMN IF EXISTS og_image;
-- ALTER TABLE sauna_rooms DROP COLUMN IF EXISTS meta_title, DROP COLUMN IF EXISTS meta_description, DROP COLUMN IF EXISTS og_image;
