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
