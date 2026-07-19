-- ============================================================
-- SAWO: App Settings — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Backs the "Live Data Source" toggle in the admin CMS, which lets
-- an admin flip the public frontend between reading from the
-- GitHub-synced JSON snapshot ("github"), live Supabase rows
-- ("supabase"), or a single hand-edited JSON file in the images repo
-- ("jsonfile") — all without a redeploy.
--
-- json_source_scope controls which product group "jsonfile" applies
-- to: "all" | "saunarooms" | "heaters" | "accessories". Only
-- "accessories" is implemented today.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

INSERT INTO app_settings (key, value) VALUES
  ('data_source', '"github"'::jsonb),
  ('json_source_scope', '"accessories"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP TABLE IF EXISTS app_settings;
