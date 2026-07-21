-- ============================================================
-- SAWO: Language Switcher Settings — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
--
-- Backs the "Language Switcher" toggle in the admin CMS, which lets an
-- admin turn the public site's language switcher on/off and choose which
-- of the built locales (en, fi, de — see
-- frontend-next/src/translation/routing.js) are shown in it. This is a
-- VISIBILITY toggle only: a hidden locale's pages still exist and remain
-- in the sitemap/hreflang. Adding a brand-new locale is still a build-time
-- change in frontend-next, not something this table can do.
--
-- Reuses the same app_settings table as the "Live Data Source" toggle
-- (see setup-app-settings.sql) — run that script first if this table
-- doesn't exist yet.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

INSERT INTO app_settings (key, value) VALUES
  ('language_switcher_enabled', 'true'::jsonb),
  ('enabled_languages', '["en", "fi", "de"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DELETE FROM app_settings WHERE key IN ('language_switcher_enabled', 'enabled_languages');
