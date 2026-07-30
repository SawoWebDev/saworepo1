-- ============================================================
-- SAWO: Scheduled Publishing — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Adds publish_at to products/sauna_rooms. There is no server cron — a
-- draft with a past/present publish_at becomes visible the moment a visitor
-- loads the page (see local-storage/visibility.js's isPubliclyVisible()).
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;

ALTER TABLE sauna_rooms
  ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- ALTER TABLE products    DROP COLUMN IF EXISTS publish_at;
-- ALTER TABLE sauna_rooms DROP COLUMN IF EXISTS publish_at;
