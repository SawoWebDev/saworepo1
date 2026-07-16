-- ============================================================
-- SAWO: App Settings — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Backs the "Live Data Source" toggle in the admin CMS, which lets
-- an admin flip the public frontend between reading from the
-- GitHub-synced JSON snapshot ("github") and live Supabase rows
-- ("supabase") without a redeploy.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

INSERT INTO app_settings (key, value) VALUES
  ('data_source', '"github"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS app_settings;
