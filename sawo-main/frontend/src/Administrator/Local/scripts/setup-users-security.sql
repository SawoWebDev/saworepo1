-- ============================================================
-- SAWO: Users Table Security Hardening — Supabase Setup
-- Already applied to production (2026-07-30). This file is the durable
-- record of that migration — reapply on a fresh/staging project, or use as
-- the reference for what's actually live today.
--
-- PROBLEM THIS FIXES: apiLogin() used to fetch the FULL `users` row
-- (including password_hash) over the public anon key and compare it in
-- plaintext in the browser. Passwords were also stored as plaintext despite
-- the column name. Anyone holding the anon key (visible in any browser's
-- devtools/bundle) could read any admin's password by username.
--
-- WHAT THIS DOES:
--   1. Hashes every existing password with bcrypt (they were plaintext).
--   2. Adds SECURITY DEFINER RPC functions so login/password-reset happen
--      server-side — the client never sends or receives a raw password_hash.
--   3. Enables RLS + revokes direct column-level access to password_hash
--      from anon/authenticated entirely — only the RPCs (which run with the
--      function owner's privileges, bypassing the revoke) can touch it.
--
-- KNOWN REMAINING LIMITATION (see docs/cms/CMS-DOCUMENTATION.md "Security"
-- section for the full writeup and the planned real-Auth migration): the
-- set_user_password* RPCs have no caller-authorization check — anyone with
-- the anon key can still call set_user_password_by_username() for ANY
-- username and take over that account. This is NOT worse than before this
-- migration (the same was already possible via a direct UPDATE), but it is
-- NOT fully fixed either. The real fix requires migrating login to real
-- Supabase Auth sessions so RLS can check auth.uid() — a separate, larger
-- migration, intentionally not bundled into this one.
-- ============================================================

-- 1. Enable bcrypt hashing support (Supabase installs pgcrypto into the
--    `extensions` schema, not public)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. One-time: convert any still-plaintext password_hash values to real
--    bcrypt hashes. Idempotent — skips anything already bcrypt-formatted, so
--    safe to rerun.
UPDATE users
SET password_hash = extensions.crypt(password_hash, extensions.gen_salt('bf'))
WHERE password_hash IS NOT NULL
  AND password_hash !~ '^\$2[aby]\$';

-- 3. Safe DEFAULT so INSERT can omit password_hash entirely (needed once its
--    column grant is revoked below) — new users get a random unusable
--    placeholder hash until set_user_password_by_username() assigns a real
--    one right after creation (see Users.jsx).
ALTER TABLE users ALTER COLUMN password_hash
  SET DEFAULT extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'));

-- 4. Login RPC: verifies username+password server-side. Returns only safe
--    fields — never the password hash itself.
CREATE OR REPLACE FUNCTION login_user(p_username text, p_password text)
RETURNS TABLE (id uuid, username text, full_name text, email text, role text, dark_mode boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.full_name, u.email, u.role, u.dark_mode, u.created_at
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = extensions.crypt(p_password, u.password_hash);
END;
$$;
GRANT EXECUTE ON FUNCTION login_user(text, text) TO anon, authenticated;

-- 5. Forgot-password RPC: returns just the email for a username (never the
--    password), used by supabase.js's forgotPassword().
CREATE OR REPLACE FUNCTION get_email_for_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT email FROM users WHERE username = p_username;
$$;
GRANT EXECUTE ON FUNCTION get_email_for_username(text) TO anon, authenticated;

-- 6. Set/reset password RPCs: hash server-side. Used by Users.jsx
--    (create/edit/change-password) and supabase.js's resetPassword().
CREATE OR REPLACE FUNCTION set_user_password(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE users SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')) WHERE id = p_user_id;
$$;
GRANT EXECUTE ON FUNCTION set_user_password(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION set_user_password_by_username(p_username text, p_new_password text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE users SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')) WHERE username = p_username;
$$;
GRANT EXECUTE ON FUNCTION set_user_password_by_username(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION set_user_password_by_email(p_email text, p_new_password text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE users SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')) WHERE email = p_email;
$$;
GRANT EXECUTE ON FUNCTION set_user_password_by_email(text, text) TO anon, authenticated;

-- 7. Enable RLS. Row-level access intentionally unchanged from before this
--    migration (permissive) — see the "known remaining limitation" note
--    above for why, and setup-page-seo.sql / the RLS migration below for
--    the same pattern applied to every other CMS table.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete" ON users FOR DELETE TO anon, authenticated USING (true);

-- 8. The actual hole-closer: no client may ever directly SELECT or write
--    password_hash again, regardless of the row policies above. Only the
--    SECURITY DEFINER RPCs can touch it (they run as the function owner).
--    NOTE: a blanket table-level GRANT (Supabase's default) overrides a
--    column-level REVOKE, so the table-level privilege must be revoked and
--    re-granted at the column level — a bare column REVOKE alone does NOT
--    work (confirmed the hard way — verify with a real anon-key REST call,
--    not just information_schema, if you ever touch this again).
REVOKE SELECT, INSERT, UPDATE ON users FROM anon, authenticated;
GRANT SELECT (id, username, full_name, email, role, dark_mode, created_at) ON users TO anon, authenticated;
GRANT INSERT (id, username, full_name, email, role, dark_mode, created_at) ON users TO anon, authenticated;
GRANT UPDATE (id, username, full_name, email, role, dark_mode, created_at) ON users TO anon, authenticated;

-- ============================================================
-- VERIFICATION (run these against the REAL anon key over REST, not via a
-- service-role SQL console — a service-role connection bypasses RLS/grants
-- entirely and will falsely show these checks passing either way)
-- ============================================================
-- Should be 401 permission denied:
--   curl "$SUPABASE_URL/rest/v1/users?select=password_hash" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
-- Should be 200 with only safe fields:
--   curl "$SUPABASE_URL/rest/v1/users?select=username,role" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
-- Should be 200, empty array on wrong password / unknown user, one row on correct:
--   curl -X POST "$SUPABASE_URL/rest/v1/rpc/login_user" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" -d '{"p_username":"...","p_password":"..."}'

-- ============================================================
-- ROLLBACK (NOT recommended — this would restore the plaintext-readable
-- password hole. Only for emergency revert.)
-- ============================================================
-- GRANT SELECT, INSERT, UPDATE ON users TO anon, authenticated;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- DROP FUNCTION IF EXISTS login_user(text, text);
-- DROP FUNCTION IF EXISTS get_email_for_username(text);
-- DROP FUNCTION IF EXISTS set_user_password(uuid, text);
-- DROP FUNCTION IF EXISTS set_user_password_by_username(text, text);
-- DROP FUNCTION IF EXISTS set_user_password_by_email(text, text);
-- Note: password_hash values remain bcrypt-hashed even after rollback —
-- there is no way back to plaintext, which is correct and should stay that way.
