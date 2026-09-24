// src/Administrator/mediaUpload.js
//
// Client-side counterpart to functions/api/media-upload.js — uploads
// (WebP-converted) files to R2 through that Pages Function instead of
// directly to Supabase Storage, now that all existing media has been
// migrated to R2 (see docs/go-live/R2-MIGRATION-PLAN.md §8). Mirrors
// Products.jsx/SaunaRoomsCMS.jsx's old uploadFileToSupabase contract (takes
// a File, returns the resulting public URL) so call sites need minimal
// changes — swap the function name and pass {entityPrefix, slug, role,
// currentUser} instead of a bucket name.
//
// Also owns the media Trash mechanism (trashMediaUrls/restoreMediaLogRow
// below) — see setup-media-trash.sql for the media_upload_log columns this
// needs and Trash.jsx for the UI. Writes to media_upload_log directly from
// the browser using the same anon-key `supabase` client every other admin
// write already uses: the existing Cloudflare Function (logUpload/
// onRequestDelete in functions/api/media-upload.js) already writes that
// same table with nothing but the anon key, so the RLS policy is already
// permissive enough for this — no new server-side code needed for
// trash/restore, only the final permanent delete still goes through the
// Function (it's the only thing holding the R2 binding).
import { supabase } from "./supabase";

const WEBP_QUALITY = 0.82;
const WEBP_MAX_DIM = 1800;

function convertToWebP(file, maxDim = WEBP_MAX_DIM, quality = WEBP_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error("WebP conversion failed")),
        "image/webp", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

// A product/room needs a slug before it can own any R2 keys — this mirrors
// the slugify() every CMS file already has, kept local here to avoid a
// cross-file import for one line. Falls back to a timestamped placeholder
// only in the edge case of uploading before typing a name at all (Featured
// Image sits above Basic Info in the form, so this is reachable).
function slugify(str) {
  return (str || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function effectiveSlug(form) {
  return form.slug || slugify(form.name) || `untitled-${Date.now()}`;
}

/**
 * @param {File} file
 * @param {{entityPrefix: "products"|"sauna-rooms", slug: string, role: string, currentUser: object}} opts
 * @returns {Promise<string>} the resulting public /media/... URL
 */
export async function uploadFileToR2(file, { entityPrefix, slug, role, currentUser }) {
  if (!slug) throw new Error("Missing slug for upload");
  if (!currentUser?.id) throw new Error("Not logged in");

  let uploadBlob, ext;
  if (file.type.startsWith("image/")) {
    try {
      uploadBlob = await convertToWebP(file);
      ext = "webp";
    } catch (err) {
      console.warn("WebP conversion failed, uploading original:", err);
      uploadBlob = file;
      ext = (file.name.split(".").pop() || "bin").toLowerCase();
    }
  } else {
    uploadBlob = file;
    ext = (file.name.split(".").pop() || "bin").toLowerCase();
  }

  const params = new URLSearchParams({
    entityPrefix, slug, role, ext, userId: currentUser.id,
    // Original browser filename — the server hashes the stored key for
    // caching/dedup (see media-upload.js), so this is the only place the
    // human-readable name survives; the endpoint logs it to
    // media_upload_log so "which upload was this file" stays answerable.
    filename: file.name || "",
  });
  const res = await fetch(`/api/media-upload?${params}`, { method: "POST", body: uploadBlob });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  const { url } = await res.json();
  return url;
}

// Mirrors deleteStorageUrls's contract (fire-and-forget best-effort cleanup
// of replaced/removed files) but for /media/<key> URLs. Non-R2 URLs
// (leftover Supabase/GitHub references from before the migration) are
// silently skipped — nothing to delete on this endpoint for those.
//
// This is now ONLY the real, permanent, unrecoverable delete — the "Delete
// Forever" trash action and the scheduled 30-day purge (setup-media-trash.sql)
// are the only callers. Every everyday remove/replace in the CMS should call
// trashMediaUrls below instead, which does not touch R2 at all.
export async function deleteR2Urls(urls = [], currentUser) {
  if (!currentUser?.id) return;
  const keys = urls
    .map(u => {
      const m = String(u || "").match(/\/media\/(.+)$/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
  await Promise.allSettled(
    keys.map(key => {
      const params = new URLSearchParams({ key, userId: currentUser.id });
      return fetch(`/api/media-upload?${params}`, { method: "DELETE" });
    })
  );
}

// R2 keys are built as `${entityPrefix}/${slug}/${role}-${8-char-hash}.${ext}`
// (see media-upload.js's buildKey) — parseable back into its parts without
// the caller needing to track entityPrefix/slug/role separately alongside
// every url it already has. Non-R2 urls (old Supabase Storage leftovers)
// return null; nothing in this file's trash mechanism applies to those.
function parseR2Key(url) {
  const m = String(url || "").match(/\/media\/(.+)$/);
  if (!m) return null;
  const key = m[1];
  const parts = key.split("/");
  if (parts.length < 3) return null;
  const [entityPrefix, slug, filename] = parts;
  const role = filename.replace(/-[0-9a-f]{8}\.[a-z0-9]+$/i, "");
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return { key, entityPrefix, slug, role, ext };
}

// Soft-remove: marks each url's media_upload_log row as trashed instead of
// deleting the R2 object. Every everyday image remove/replace in
// Products.jsx/SaunaRoomsCMS.jsx should call this, not deleteR2Urls.
//
// Upserts a log row when one doesn't already exist for a key — covers
// images that predate this logging (bulk-migrated products) or that this
// app never explicitly logged before (variant/included-item images had no
// cleanup call at all until this was added), so replacing/removing ANY
// image for the first time makes it trash-trackable/restorable going
// forward, not just newly-uploaded ones.
export async function trashMediaUrls(urls = [], currentUser) {
  if (!currentUser?.id) return;
  const entries = urls
    .map(url => ({ url, parsed: parseR2Key(url) }))
    .filter(e => e.parsed);
  if (!entries.length) return;

  const nowIso = new Date().toISOString();
  await Promise.allSettled(entries.map(async ({ url, parsed: { key, entityPrefix, slug, role, ext } }) => {
    const { data: existing } = await supabase
      .from("media_upload_log").select("id").eq("key", key).maybeSingle();
    if (existing) {
      // restored_at reset to null: if this exact file was trashed, restored,
      // and is now being trashed again, it needs to reappear in the active
      // trash list, not stay hidden behind its previous restore.
      await supabase.from("media_upload_log")
        .update({ trashed_at: nowIso, restored_at: null })
        .eq("id", existing.id);
    } else {
      await supabase.from("media_upload_log").insert({
        key, public_url: url, entity_prefix: entityPrefix, slug, role, ext,
        source: "trash-backfill",
        uploaded_by: currentUser.id, uploaded_by_username: currentUser.username || null,
        trashed_at: nowIso,
      });
    }
  }));
}

// Un-trash by media_upload_log row id. Callers that know the specific
// field/array this image belongs to (thumbnail, og_image, gallery, spec)
// should also write the actual restored url back into the product/room row
// themselves — see Trash.jsx's handleRestoreMedia for the swap logic this
// alone doesn't do. For roles this app can't safely auto-reattach
// (variant/included-item images, whose exact slot may no longer exist),
// this is the entire restore: it just stops the file from being eligible
// for auto-purge, nothing more.
export async function restoreMediaLogRow(id) {
  const { error } = await supabase
    .from("media_upload_log")
    .update({ restored_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
