-- ============================================================
-- SAWO: Revision History (field-level diffs) — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Adds a `changes` jsonb column to activity_logs: { field: { before, after } }
-- for "update" actions, populated by logActivity() at save time (computed
-- client-side in Products.jsx/SaunaRoomsCMS.jsx's diffForms helper — not a
-- DB trigger). Existing rows keep changes = NULL; there is no backfill.
-- ============================================================

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS changes JSONB;

CREATE INDEX IF NOT EXISTS activity_logs_entity_idx
  ON activity_logs (entity, entity_id, created_at DESC);

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP INDEX IF EXISTS activity_logs_entity_idx;
-- ALTER TABLE activity_logs DROP COLUMN IF EXISTS changes;
