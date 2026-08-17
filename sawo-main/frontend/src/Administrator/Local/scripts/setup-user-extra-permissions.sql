-- ============================================================
-- SAWO: Per-User Extra Permissions — Supabase Setup
-- Already applied to production (2026-08-17). This file is the durable
-- record of that migration — reapply on a fresh/staging project, or use as
-- the reference for what's actually live today (same pattern as every other
-- setup-*.sql file in this folder — see setup-users-security.sql).
--
-- Extends the existing role-based CMS permission system (see
-- src/Administrator/permissions.js) WITHOUT replacing it: a user's role
-- still supplies its default capabilities exactly as before. This migration
-- adds one nullable-free array column so an admin can additionally grant a
-- specific user extra capabilities beyond their role's defaults (e.g. an
-- Editor who also gets Analytics), without creating a new role for every
-- such combination. See Users.jsx's Permissions checkbox list and
-- permissions.js's canUser()/getPerms() for how it's read.
--
-- Ran AFTER setup-users-security.sql — it depends on the `users` table, its
-- RLS policies, and its column-level grant pattern already being in place.
-- ============================================================

-- 1. The column itself. Defaults to an empty array (never NULL) so every
--    read site can do `(user.extra_permissions || []).includes(cap)` without
--    a null check.
ALTER TABLE users ADD COLUMN IF NOT EXISTS extra_permissions text[] NOT NULL DEFAULT '{}';

-- 2. setup-users-security.sql revoked the table-level SELECT/INSERT/UPDATE
--    grant and re-granted only a specific column whitelist — a new column is
--    invisible to anon/authenticated until it's added to that whitelist too,
--    same as every other column added since (this is the same gotcha that
--    migration's own comments call out: a blanket table-level GRANT would
--    override the REVOKE, so this must be a column-level GRANT).
GRANT SELECT (extra_permissions) ON users TO anon, authenticated;
GRANT INSERT (extra_permissions) ON users TO anon, authenticated;
GRANT UPDATE (extra_permissions) ON users TO anon, authenticated;

-- 3. login_user's RETURNS TABLE must include the new column so a fresh
--    login (or the legacy-password-repair path in supabase.js's apiLogin)
--    carries extra_permissions into the session, not just role. Postgres
--    won't let CREATE OR REPLACE change a function's return type, so this
--    has to drop and recreate rather than replace in place.
DROP FUNCTION IF EXISTS login_user(text, text);
CREATE FUNCTION login_user(p_username text, p_password text)
RETURNS TABLE (id uuid, username text, full_name text, email text, role text, extra_permissions text[], dark_mode boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.full_name, u.email, u.role, u.extra_permissions, u.dark_mode, u.created_at
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = extensions.crypt(p_password, u.password_hash);
END;
$$;
GRANT EXECUTE ON FUNCTION login_user(text, text) TO anon, authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Should be 200 and include extra_permissions:
--   curl "$SUPABASE_URL/rest/v1/users?select=username,role,extra_permissions" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP FUNCTION IF EXISTS login_user(text, text);
-- CREATE FUNCTION login_user(p_username text, p_password text)
-- RETURNS TABLE (id uuid, username text, full_name text, email text, role text, dark_mode boolean, created_at timestamptz)
-- LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT u.id, u.username, u.full_name, u.email, u.role, u.dark_mode, u.created_at
--   FROM users u
--   WHERE u.username = p_username AND u.password_hash = extensions.crypt(p_password, u.password_hash);
-- END;
-- $$;
-- GRANT EXECUTE ON FUNCTION login_user(text, text) TO anon, authenticated;
-- ALTER TABLE users DROP COLUMN IF EXISTS extra_permissions;
