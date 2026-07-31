-- ============================================================
-- SAWO: Enable RLS on Content Tables — Supabase Setup
-- Already applied to production (2026-07-30). This file is the durable
-- record of that migration.
--
-- Covers: products, categories, tags, sauna_rooms, app_settings, page_seo.
-- (users is handled separately — see setup-users-security.sql, which is a
-- genuinely different category of fix, not just an RLS toggle.)
--
-- WHY: these 6 tables previously had RLS disabled entirely, which Supabase's
-- security advisor flags as a critical finding — technically it means "fully
-- open," though in practice they already behaved this way via default grants
-- (see below), so this migration is about closing the linter finding and
-- creating an explicit, auditable policy set, not changing actual behavior.
--
-- IMPORTANT — READ BEFORE ASSUMING THIS "SECURES" THESE TABLES: it does not
-- add any new restriction. All 6 tables are read/written directly by the
-- admin CMS using the SAME public anon key as the public site — there is no
-- real Supabase-Auth session distinguishing "logged-in admin" at the
-- Postgres level (see setup-users-security.sql's limitation note, and
-- docs/cms/CMS-DOCUMENTATION.md's Security section for the full picture).
-- The policies below are permissive (USING (true) / WITH CHECK (true)) —
-- functionally identical to today's un-RLS'd behavior. If/when real
-- Supabase-Auth login lands, THESE are the policies that should be tightened
-- next (require `authenticated`, and ideally a role check joined against
-- `users.role` via the signed-in user's auth_user_id).
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_select" ON tags;
CREATE POLICY "tags_select" ON tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tags_insert" ON tags;
CREATE POLICY "tags_insert" ON tags FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tags_update" ON tags;
CREATE POLICY "tags_update" ON tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "tags_delete" ON tags;
CREATE POLICY "tags_delete" ON tags FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE sauna_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sauna_rooms_select" ON sauna_rooms;
CREATE POLICY "sauna_rooms_select" ON sauna_rooms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sauna_rooms_insert" ON sauna_rooms;
CREATE POLICY "sauna_rooms_insert" ON sauna_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "sauna_rooms_update" ON sauna_rooms;
CREATE POLICY "sauna_rooms_update" ON sauna_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sauna_rooms_delete" ON sauna_rooms;
CREATE POLICY "sauna_rooms_delete" ON sauna_rooms FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
CREATE POLICY "app_settings_select" ON app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "app_settings_insert" ON app_settings;
CREATE POLICY "app_settings_insert" ON app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "app_settings_update" ON app_settings;
CREATE POLICY "app_settings_update" ON app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "app_settings_delete" ON app_settings;
CREATE POLICY "app_settings_delete" ON app_settings FOR DELETE TO anon, authenticated USING (true);

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
-- ALTER TABLE products    DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories  DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tags        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sauna_rooms DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE page_seo    DISABLE ROW LEVEL SECURITY;
