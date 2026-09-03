-- ============================================================
-- SAWO: Fix "Set New Password" failing for accounts that have never
-- completed a full login yet (new invites, or anyone who only ever used
-- "Forgot password?"). Already applied to production (2026-09-03).
--
-- SYMPTOM: after clicking the Supabase Auth reset-password email link and
-- submitting a new password, the page showed:
--   "Password updated in Auth but failed to sync to users table:
--    Not authorized to change this password"
-- Auth's own password WAS updated (supabase.auth.updateUser succeeded) --
-- only the follow-up sync into public.users.password_hash was rejected.
--
-- ROOT CAUSE: setup-real-auth-migration.sql's set_user_password_by_email()
-- only allows the write when users.auth_user_id already equals auth.uid().
-- That link is normally created by loadProfileForAuthUser()
-- (src/Administrator/supabase.js) during a NORMAL login via apiLogin(). But
-- ResetPassword.jsx never goes through apiLogin -- it only ever has a
-- PASSWORD_RECOVERY session from the emailed link. So any account that
-- hasn't yet completed a real signInWithPassword login has auth_user_id
-- still NULL, and got rejected here even though completing the emailed
-- recovery link is itself proof of owning the account.
--
-- FIX: authorize using the CALLER'S OWN verified email, read straight from
-- auth.users via auth.uid() -- not the client-supplied p_email argument,
-- which is untrusted input over the RPC's public REST endpoint. This is
-- exactly as strong a proof of ownership as the auth_user_id link, just
-- available before that link has been created. The UPDATE also self-heals
-- the link (COALESCE) so later calls take the fast, already-linked path.
--
-- Confirmed against production data: user "Leian" (role admin) had
-- auth_user_id IS NULL -- the exact case this fixes.
-- ============================================================

CREATE OR REPLACE FUNCTION set_user_password_by_email(p_email text, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_own_email text;
BEGIN
  SELECT email INTO v_own_email FROM auth.users WHERE id = auth.uid();

  IF NOT (
    is_superadmin()
    OR EXISTS (SELECT 1 FROM users WHERE email = p_email AND auth_user_id = auth.uid())
    OR (v_own_email IS NOT NULL AND v_own_email = p_email)
  ) THEN
    RAISE EXCEPTION 'Not authorized to change this password';
  END IF;

  UPDATE users
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      auth_user_id = COALESCE(auth_user_id, auth.uid())
  WHERE email = p_email;
END;
$$;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- As a user who just completed a PASSWORD_RECOVERY session and whose
-- users.auth_user_id is still NULL: set_user_password_by_email should now
-- succeed (was: "Not authorized to change this password"), and
-- users.auth_user_id should be populated with auth.uid() afterward.
--
-- A caller cannot pass an arbitrary p_email for someone else's unlinked
-- account -- v_own_email comes from auth.users via their own auth.uid(),
-- not from the p_email argument, so it only ever matches their own account.

-- ============================================================
-- ROLLBACK (NOT recommended -- restores the "new users can't set their
-- first password" bug this migration fixes)
-- ============================================================
-- Re-run the CREATE OR REPLACE FUNCTION block from setup-real-auth-migration.sql
-- (the version without v_own_email).
