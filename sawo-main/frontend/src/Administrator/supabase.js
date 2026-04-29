// src/Administrator/supabase.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export async function apiLogin(username, password) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) throw new Error("User not found");
  if (data.password_hash !== password) throw new Error("Incorrect password");

  return {
    user: data,
    token: data.id,
  };
}

export async function forgotPassword(username) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("username", username)
    .single();

  if (error || !user) throw new Error("No account found with that username");
  if (!user.email) throw new Error("No email address associated with this account");

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    user.email,
    { redirectTo: `${window.location.origin}/admin/reset-password` }
  );

  if (resetError) throw new Error("Failed to send reset email: " + resetError.message);
  return user.email;
}

export async function resetPassword(newPassword) {
  const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
  if (authError) throw new Error(authError.message);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (authUser?.email) {
    const { error: dbError } = await supabase
      .from("users")
      .update({ password_hash: newPassword })
      .eq("email", authUser.email);
    if (dbError) throw new Error("Password updated in Auth but failed to sync to users table");
  }
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
}

export async function logActivity({ action, entity, entity_id, entity_name, username, user_id, meta = null }) {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      action,
      entity,
      entity_id: entity_id ? String(entity_id) : null,
      entity_name,
      username,
      user_id: user_id ? String(user_id) : null,
      meta,
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

// Extract just the filename from a full Supabase public URL.
// Handles transform query params (?width=... etc.) by stripping them first.
// e.g. "https://xxx.supabase.co/storage/v1/object/public/product-images/abc.webp?t=123"
// → "abc.webp"
function fileNameFromUrl(url) {
  if (!url) return null;
  try {
    const clean = url.split("?")[0];
    const match = clean.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
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
