-- ============================================================
-- SAWO: Real Supabase-Auth Migration — closes the "known remaining
-- limitation" documented in setup-users-security.sql.
-- Already applied to production (2026-07-31). This file is the durable
-- record of that migration.
--
-- PROBLEM THIS FIXES: setup-users-security.sql's RPCs (set_user_password,
-- set_user_password_by_username, set_user_password_by_email) had no
-- caller-authorization check — anyone holding the public anon key could
-- call set_user_password_by_username() for ANY username and take over that
-- account, and the `users` table's INSERT/UPDATE/DELETE policies were
-- permissive (USING (true)) with no real session distinguishing "logged-in
-- admin" from "public visitor" at the Postgres level.
--
-- WHAT THIS DOES:
--   1. Links each `users` row to a real auth.users account (auth_user_id).
--   2. Adds is_superadmin(), which checks the CALLER'S live auth.uid()
--      against `users.role` — not a client-supplied value, not a cached JWT
--      claim, so promoting/demoting a user takes effect on their very next
--      request with no re-login required.
--   3. Adds authorization checks inside the password RPCs: a user may
--      always change their OWN password; only a superadmin may change
--      someone else's.
--   4. Tightens `users` INSERT/UPDATE/DELETE policies to require
--      is_superadmin() (or, for UPDATE, the row being your own).
--   5. apiLogin() (src/Administrator/supabase.js) now tries real
--      supabase.auth.signInWithPassword() first; if that fails (account not
--      yet migrated — no real Auth password set), it falls through to the
--      legacy login_user() RPC unchanged. This lets accounts migrate one at
--      a time via password-reset email with zero downtime.
--
-- ROLLOUT STATE AS OF 2026-07-31 (see docs/cms/CMS-DOCUMENTATION.md
-- "Security" section for the live-updated version of this table):
--   Arniel  (superadmin) — auth_user_id linked, no real password set yet
--   Rafael  (superadmin) — auth_user_id linked, no real password set yet
--   Edgar   (superadmin) — auth_user_id linked, reset email sent, not yet set
--   Junnil  (viewer)     — auth_user_id linked, reset email sent, not yet set
-- None have completed signInWithPassword yet in production — all 4 are
-- still authenticating via the legacy fallback path, which is expected and
-- fine (the RLS tightening in step 4 only blocks WRITE actions on the
-- `users` table itself for sessions that haven't completed real-Auth login;
-- it does not block login, and does not affect any other table). A
-- superadmin on the legacy path will see Users.jsx create/edit/delete fail
-- with a permission-denied error until they complete a password reset —
-- this is intended friction, not a bug, and should be communicated to
-- whoever hits it first.
-- ============================================================

-- 1. Link table: which auth.users account backs each CMS user row.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON users(auth_user_id);

-- Backfill by email match (safe/idempotent — only fills rows still NULL).
UPDATE users u SET auth_user_id = au.id
FROM auth.users au
WHERE u.email = au.email AND u.auth_user_id IS NULL;

-- 2. Real-session authorization check, callable from RLS policies and RPCs.
-- SECURITY DEFINER so it can read `users` regardless of the caller's own
-- row-level grants — it only ever returns a boolean, never row data.
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'superadmin'
  );
$$;
GRANT EXECUTE ON FUNCTION is_superadmin() TO anon, authenticated;

-- 3. Authorization checks inside the password RPCs (superseding the
-- versions defined in setup-users-security.sql — same signatures, this is
-- the "make caller prove who they are" follow-up).
CREATE OR REPLACE FUNCTION set_user_password(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT (
    is_superadmin()
    OR EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND auth_user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized to change this password';
  END IF;
  UPDATE users SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')) WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_password_by_email(p_email text, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT (
    is_superadmin()
    OR EXISTS (SELECT 1 FROM users WHERE email = p_email AND auth_user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized to change this password';
  END IF;
  UPDATE users SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')) WHERE email = p_email;
END;
$$;

-- Username variant has no "is this my own row" shortcut available to an
-- unauthenticated/legacy caller (usernames aren't tied to auth.uid() for
-- accounts still on the legacy path) — restricted to superadmin only.
-- Used by Users.jsx's admin-initiated password changes.
CREATE OR REPLACE FUNCTION set_user_password_by_username(p_username text, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only a superadmin (with a real, current-generation session) can set another user''s password';
  END IF;
  UPDATE users SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')) WHERE username = p_username;
END;
$$;

-- 4. Tighten `users` write policies. SELECT stays permissive (already
-- limited to safe columns only via setup-users-security.sql's column
-- grants) — only writes are gated here.
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated
  USING (is_superadmin() OR auth_user_id = auth.uid())
  WITH CHECK (is_superadmin() OR auth_user_id = auth.uid());

DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete" ON users FOR DELETE TO authenticated USING (is_superadmin());

-- ============================================================
-- VERIFICATION (run against the REAL anon key over REST — a service-role
-- connection bypasses RLS entirely and will falsely show these passing
-- either way. Also note: PostgREST returns 204 on an UPDATE/DELETE that
-- matches 0 rows due to RLS — always re-SELECT to confirm nothing changed,
-- a 204 alone does NOT prove the write was blocked.)
-- ============================================================
-- No session (anon key only) — INSERT should be 401 "row-level security policy":
--   curl -X POST "$URL/rest/v1/users" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--     -H "Content-Type: application/json" -d '{"username":"x","email":"x@x.com","role":"superadmin"}'
--
-- No session, UPDATE/DELETE — 204 returned either way; re-SELECT the row after
-- to confirm it did NOT change (that's the real signal, not the status code).
--
-- Authenticated as a real superadmin (JWT from supabase.auth.signInWithPassword)
-- — INSERT/UPDATE/DELETE on `users` should all succeed; set_user_password_by_username
-- should succeed for any target username. Authenticated as a non-superadmin —
-- both should fail (blocked write / RAISE EXCEPTION from the RPC).
--
-- Tested 2026-07-31 with a throwaway auth.users + public.users test account
-- (created and fully deleted within the same session, never exposed outside
-- this migration) — all of the above confirmed exactly as expected.
--
-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP POLICY IF EXISTS "users_insert" ON users;
-- CREATE POLICY "users_insert" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
-- DROP POLICY IF EXISTS "users_update" ON users;
-- CREATE POLICY "users_update" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "users_delete" ON users;
-- CREATE POLICY "users_delete" ON users FOR DELETE TO anon, authenticated USING (true);
-- Note: rolling back re-opens the exact hole this migration closed. Only do
-- this if real-Auth login is broken for everyone and you need emergency
-- write access restored while you fix it — not as a routine action.
