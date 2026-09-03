-- ============================================================
-- SAWO: Users "Last Active" column — Supabase Setup
-- Adds a get_users_with_last_active() RPC that surfaces
-- auth.users.last_sign_in_at (already maintained automatically by
-- Supabase Auth on every real signInWithPassword login — see
-- setup-real-auth-migration.sql) alongside the existing users columns.
--
-- No new table, no trigger, no column added to `users` — this is a
-- read-only join against a value Postgres/Supabase Auth already updates in
-- place on every login. Accounts still on the legacy login_user() RPC path
-- (see setup-real-auth-migration.sql) or never linked to an auth.users row
-- simply show a null last_active_at, rendered as "Never" in Users.jsx.
-- ============================================================

CREATE OR REPLACE FUNCTION get_users_with_last_active()
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  email text,
  role text,
  extra_permissions text[],
  created_at timestamptz,
  last_active_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.username, u.full_name, u.email, u.role, u.extra_permissions,
         u.created_at, au.last_sign_in_at
  FROM users u
  LEFT JOIN auth.users au ON au.id = u.auth_user_id;
$$;
GRANT EXECUTE ON FUNCTION get_users_with_last_active() TO anon, authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Should be 200, one row per user, last_active_at populated for anyone
-- who has completed a real-Auth login, null for anyone who hasn't:
--   curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_users_with_last_active" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP FUNCTION IF EXISTS get_users_with_last_active();
