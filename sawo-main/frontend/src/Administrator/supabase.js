// src/Administrator/supabase.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ── Login: real Supabase Auth session, with a legacy fallback during migration ──
//
// HISTORY: this used to fetch the FULL `users` row (select("*"), including
// password_hash) over the public anon key and compare it in plaintext in the
// browser — anyone holding the anon key could read any user's password by
// username. That was fixed (2026-07-30) by moving verification into a
// SECURITY DEFINER RPC (login_user) that hashes/compares server-side and
// never returns the hash. That fix closed the READ hole, but the RPC itself
// had no caller-authorization check, so a related WRITE hole remained: the
// set_user_password* RPCs could be called by anyone with the anon key to
// reset any account's password. See docs/cms/CMS-DOCUMENTATION.md Section 7
// for the full history — this is the follow-up that closes that gap too.
//
// THE REAL FIX: login now goes through actual Supabase Auth
// (signInWithPassword), which gives Postgres a genuine, cryptographically
// verified session (auth.uid()) — RLS and the password RPCs now check that
// session via is_superadmin() / "is this your own account" instead of
// trusting anything the client merely asserts.
//
// The migration to real Auth is complete: Supabase Auth is now the only way
// to log in. The legacy login_user RPC is kept solely as a server-side
// proof-of-password for repairing an account whose Auth password has drifted
// out of sync — see apiLogin below. It no longer grants a session by itself.
// Loads the CMS profile backing a signed-in Auth user. Falls back to an
// email match when auth_user_id hasn't been linked yet, and repairs the link
// so the lookup is direct next time.
async function loadProfileForAuthUser(authUserId, email) {
  const COLS = "id, username, full_name, email, role, dark_mode, created_at";

  const { data: byLink } = await supabase
    .from("users").select(COLS).eq("auth_user_id", authUserId).maybeSingle();
  if (byLink) return byLink;

  if (!email) return null;
  const { data: byEmail } = await supabase
    .from("users").select(COLS).eq("email", email).maybeSingle();
  if (!byEmail) return null;

  // Self-heal the missing link. Permitted by the users_update policy
  // (auth_user_id = auth.uid()) once this session exists; if it somehow
  // fails, logging in still works — it just re-heals on the next login.
  await supabase.from("users").update({ auth_user_id: authUserId }).eq("id", byEmail.id);
  return byEmail;
}

/**
 * Logs in against real Supabase Auth.
 *
 * Supabase Auth is the ONLY source of truth for logging in. The legacy
 * `login_user` RPC is no longer a login path — it survives here purely as a
 * server-side proof-of-password used to repair an account whose Auth
 * password has drifted out of sync with `users.password_hash`.
 *
 * That drift is real and used to be permanent: Users.jsx's admin-set
 * password calls set_user_password*, which only rewrites
 * `users.password_hash` — it cannot touch Supabase Auth from the client
 * (that needs the service-role key). The account was then stuck: Auth
 * rejected the new password, the legacy RPC accepted it, and login reported
 * "this account needs to be verified" forever, even though the account was
 * fully verified. Now that case self-heals silently via the
 * migrate-auth-password edge function and the user just logs in.
 */
export async function apiLogin(username, password) {
  const { data: email } = await supabase.rpc("get_email_for_username", { p_username: username });

  // 1. Normal path — real Auth accepts the password.
  if (email) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (!authError && authData?.user) {
      const profile = await loadProfileForAuthUser(authData.user.id, email);
      if (profile) return { user: profile, token: profile.id };

      // Authenticated against Supabase Auth, but there's no CMS account for
      // them at all. Don't leave a half-session lying around.
      await supabase.auth.signOut();
      throw new Error("This login isn't linked to a CMS account. Ask a superadmin to check your user record.");
    }
  }

  // 2. Auth rejected it. Before calling it a bad password, check whether the
  //    CMS-side password matches — if it does, the password is correct and
  //    only Auth is stale.
  const { data: legacyRows, error: legacyError } = await supabase.rpc("login_user", {
    p_username: username,
    p_password: password,
  });
  if (legacyError) throw new Error(legacyError.message);
  if (!legacyRows || legacyRows.length === 0) {
    throw new Error("Incorrect username or password");
  }

  // 3. Password is correct but Auth is out of sync — resync and continue.
  //    The edge function re-verifies the password server-side itself, so
  //    this can't be used to set a password the caller doesn't already know.
  const { error: syncError } = await supabase.functions.invoke("migrate-auth-password", {
    body: { username, current_password: password, new_password: password },
  });
  if (syncError) {
    throw new Error(
      "Your password is correct, but this account's sign-in could not be repaired automatically. " +
      "Use \"Forgot password?\" to finish setting it up."
    );
  }

  const resolvedEmail = email || legacyRows[0].email;
  const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });
  if (retryError || !retryData?.user) {
    throw new Error(
      "Your password is correct, but signing in failed after repairing the account. " +
      "Please try again, or use \"Forgot password?\"."
    );
  }

  const profile = await loadProfileForAuthUser(retryData.user.id, resolvedEmail);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("This login isn't linked to a CMS account. Ask a superadmin to check your user record.");
  }
  return { user: profile, token: profile.id };
}

export async function forgotPassword(username) {
  const { data: email, error } = await supabase.rpc("get_email_for_username", {
    p_username: username,
  });

  if (error) throw new Error(error.message);
  if (!email) throw new Error("No account found with that username, or no email is associated with it");

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    email,
    { redirectTo: `${window.location.origin}/admin/reset-password` }
  );

  if (resetError) throw new Error("Failed to send reset email: " + resetError.message);
  return email;
}

export async function resetPassword(newPassword) {
  const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
  if (authError) throw new Error(authError.message);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (authUser?.email) {
    const { error: dbError } = await supabase.rpc("set_user_password_by_email", {
      p_email: authUser.email,
      p_new_password: newPassword,
    });
    if (dbError) throw new Error("Password updated in Auth but failed to sync to users table: " + dbError.message);
  }
}

// True when a write failed because the caller isn't a real, authenticated
// superadmin session (e.g. an expired/stale session, or a role change that
// hasn't been picked up yet). Used to show a helpful "reset your password"
// prompt instead of the raw Postgres error. Should be rare in practice since
// login itself no longer grants a session to an unmigrated account (see
// apiLogin above), but stays as a safety net.
export function isPasswordUpdateRequiredError(message) {
  return typeof message === "string" && message.includes("row-level security policy");
}

export function saveSession(token, user, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("sawo_token", token);
  storage.setItem("sawo_user", JSON.stringify(user));
}

export function getSession() {
  const token =
    localStorage.getItem("sawo_token") || sessionStorage.getItem("sawo_token");
  const userStr =
    localStorage.getItem("sawo_user") || sessionStorage.getItem("sawo_user");
  if (!token || !userStr) return null;
  return { token, user: JSON.parse(userStr) };
}

export function clearSession() {
  localStorage.removeItem("sawo_token");
  localStorage.removeItem("sawo_user");
  sessionStorage.removeItem("sawo_token");
  sessionStorage.removeItem("sawo_user");
  // Also end the real Supabase Auth session for accounts that logged in via
  // the new path (apiLogin's signInWithPassword branch) — fire-and-forget,
  // since clearing the custom tokens above (what the app's own route guards
  // actually check) must stay synchronous and can't wait on a network call.
  // A no-op if the session was only ever the legacy anon-key path.
  supabase.auth.signOut().catch(() => {});
}

export async function logActivity({ action, entity, entity_id, entity_name, username, user_id, meta = null, changes = null }) {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      action,
      entity,
      entity_id: entity_id ? String(entity_id) : null,
      entity_name,
      username,
      user_id: user_id ? String(user_id) : null,
      meta,
      changes,
    });
    if (error) {
      console.warn("[logActivity] Failed to write log:", error.message);
      console.error("Full error:", error);
    }
  } catch (err) {
    console.error("[logActivity] Exception:", err);
  }
}

// ─── Storage Orphan Cleaner ────────────────────────────────────────────────────
//
// Scans storage buckets and deletes any file whose public URL is NOT
// referenced by any product or sauna_room row in the database.
//
// Columns checked per product:
//   thumbnail      → text
//   images         → text[]
//   spec_images    → text[]
//   files          → jsonb[]  (each item has a `.url` string)
//
// Columns checked per sauna_room:
//   thumbnail      → text
//   images         → text[]
//   spec_images    → text[]
//   files          → jsonb[]  (each item has a `.url` string)
//
// Returns a result object:
// {
//   scanned:  { "product-images": N, "product-pdf": N, "sauna-room-images": N },
//   deleted:  { "product-images": [...paths], ... },
//   failed:   { "product-images": [...paths], ... },
//   kept:     { "product-images": N, ... },
//   errors:   string[]   // any non-fatal warnings
// }
//
// NOTE: Deletion requires your bucket DELETE policy to allow the anon role.
// If you see files in `failed`, add a DELETE policy in Supabase:
//   Storage → Buckets → [bucket] → Policies → New Policy → DELETE → true
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_BUCKETS = ["product-images", "product-pdf", "sauna-room-images"];

// Supabase list() max is 1000 per call. We paginate until exhausted.
async function listAllFiles(bucket) {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const allFiles = [];
  const errors = [];

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list("", {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      errors.push(`[${bucket}] list error at offset ${offset}: ${error.message}`);
      break;
    }

    if (!data || data.length === 0) break;

    // Filter out placeholder/folder entries (they have id === null or name ends with /)
    const files = data.filter(f => f.id !== null && !f.name.endsWith("/"));
    allFiles.push(...files);

    if (data.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  return { files: allFiles, errors };
}

// Build the full public URL for a file in a bucket — matches what uploadFileToSupabase returns
function buildPublicUrl(bucket, fileName) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}


// Collect every storage URL referenced by any product or sauna_room row.
// Returns a Set of fully-qualified public URLs (with no query params).
async function collectReferencedUrls() {
  const referenced = new Set();
  const errors = [];

  // ── Collect from products table ─────────────────────────────────────────────
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("thumbnail, images, spec_images, files");

  if (productsError) {
    errors.push(`Failed to fetch products: ${productsError.message}`);
  } else {
    for (const p of products || []) {
      // thumbnail — text
      if (p.thumbnail) referenced.add(p.thumbnail.split("?")[0]);

      // images — text[]
      for (const url of p.images || []) {
        if (url) referenced.add(url.split("?")[0]);
      }

      // spec_images — text[]
      for (const url of p.spec_images || []) {
        if (url) referenced.add(url.split("?")[0]);
      }

      // files — jsonb array, each item: { name, url }
      for (const file of p.files || []) {
        const url = typeof file === "string" ? file : file?.url;
        if (url) referenced.add(url.split("?")[0]);
      }
    }
  }

  // ── Collect from sauna_rooms table ──────────────────────────────────────────
  const { data: saunaRooms, error: saunaError } = await supabase
    .from("sauna_rooms")
    .select("thumbnail, images, spec_images, files");

  if (saunaError) {
    errors.push(`Failed to fetch sauna_rooms: ${saunaError.message}`);
  } else {
    for (const room of saunaRooms || []) {
      // thumbnail — text
      if (room.thumbnail) referenced.add(room.thumbnail.split("?")[0]);

      // images — text[]
      for (const url of room.images || []) {
        if (url) referenced.add(url.split("?")[0]);
      }

      // spec_images — text[]
      for (const url of room.spec_images || []) {
        if (url) referenced.add(url.split("?")[0]);
      }

      // files — jsonb array, each item: { name, url }
      for (const file of room.files || []) {
        const url = typeof file === "string" ? file : file?.url;
        if (url) referenced.add(url.split("?")[0]);
      }
    }
  }

  return { referenced, errors };
}

export async function cleanOrphanedStorageFiles({ dryRun = false } = {}) {
  const result = {
    scanned:  {},
    deleted:  {},
    failed:   {},
    kept:     {},
    dryRun,
    errors:   [],
  };

  // ── Step 1: collect all URLs referenced by existing products ──────────────
  const { referenced, errors: refErrors } = await collectReferencedUrls();
  result.errors.push(...refErrors);

  if (refErrors.length && referenced.size === 0) {
    // Could not read products or sauna_rooms at all — abort to avoid nuking everything
    result.errors.push("Aborting: could not read product or sauna_rooms tables. No files deleted.");
    return result;
  }

  // ── Step 2: scan each bucket and find orphans ─────────────────────────────
  for (const bucket of STORAGE_BUCKETS) {
    result.scanned[bucket] = 0;
    result.deleted[bucket] = [];
    result.failed[bucket]  = [];
    result.kept[bucket]    = 0;

    const { files, errors: listErrors } = await listAllFiles(bucket);
    result.errors.push(...listErrors);
    result.scanned[bucket] = files.length;

    const orphans = [];

    for (const file of files) {
      const publicUrl = buildPublicUrl(bucket, file.name);
      const cleanUrl  = publicUrl.split("?")[0];

      if (referenced.has(cleanUrl)) {
        result.kept[bucket]++;
      } else {
        orphans.push(file.name);
      }
    }

    if (orphans.length === 0) continue;

    if (dryRun) {
      // In dry-run mode, just report what would be deleted
      result.deleted[bucket] = orphans;
      continue;
    }

    // ── Step 3: delete in batches of 100 (Supabase limit per remove() call) ─
    const BATCH = 100;
    for (let i = 0; i < orphans.length; i += BATCH) {
      const batch = orphans.slice(i, i + BATCH);

      const { error: delError } = await supabase.storage
        .from(bucket)
        .remove(batch);

      if (delError) {
        // Whole batch failed — record all as failed
        result.failed[bucket].push(...batch);
        result.errors.push(
          `[${bucket}] Delete batch ${Math.floor(i / BATCH) + 1} failed: ${delError.message}. ` +
          `This usually means your bucket DELETE policy doesn't allow the anon role. ` +
          `Fix: Supabase Dashboard → Storage → ${bucket} → Policies → add DELETE policy allowing anon.`
        );
      } else {
        result.deleted[bucket].push(...batch);
      }
    }
  }

  return result;
}
