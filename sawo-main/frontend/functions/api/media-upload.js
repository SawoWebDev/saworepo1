// functions/api/media-upload.js
// Cloudflare Pages Function — lets the admin CMS write directly to the
// `sawo-media` R2 bucket (via the same MEDIA_BUCKET binding functions/media
// uses to serve reads) instead of Supabase Storage. This is what repoints
// new CMS uploads at R2 now that all existing media has been migrated
// there — see docs/go-live/R2-MIGRATION-PLAN.md §8.
//
// R2 credentials never touch the browser: the client (mediaUpload.js)
// POSTs/DELETEs raw bytes to this endpoint, which holds the binding.
//
// Auth: this app has no signed/server-verifiable session (see the "known
// remaining limitation" note in Administrator/Local/scripts/setup-users-
// security.sql — login_user's "token" is just the user's id, not a JWT).
// This endpoint matches that same existing security posture rather than
// inventing a stronger one in isolation: it looks up the given user id in
// `users` server-side (service-role key, never exposed to the client) and
// requires role admin/superadmin, mirroring the products.upload_images /
// sauna_rooms.upload_images capability gate the CMS UI already enforces.
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const EXTENSION_CONTENT_TYPES = {
  webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", pdf: "application/pdf",
};

const SLUG_RE = /^[a-z0-9-]{1,120}$/;
const ROLE_RE = /^[a-z0-9-]{1,60}$/;
const ENTITY_PREFIXES = new Set(["products", "sauna-rooms"]);

async function requireUploader(env, userId) {
  if (!userId) return null;
  const supabaseAdmin = getSupabaseAdmin(env);
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.from("users").select("id, role").eq("id", userId).single();
  if (error || !data) return null;
  if (data.role !== "admin" && data.role !== "superadmin") return null;
  return data;
}

async function hash8(buf) {
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 8);
}

function buildKey({ entityPrefix, slug, role, ext, h }) {
  return `${entityPrefix}/${slug}/${role}-${h}.${ext}`;
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const entityPrefix = url.searchParams.get("entityPrefix");
  const slug = url.searchParams.get("slug");
  const role = url.searchParams.get("role");
  const ext = (url.searchParams.get("ext") || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const userId = url.searchParams.get("userId");

  if (!ENTITY_PREFIXES.has(entityPrefix)) return Response.json({ error: "Invalid entityPrefix" }, { status: 400 });
  if (!slug || !SLUG_RE.test(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });
  if (!role || !ROLE_RE.test(role)) return Response.json({ error: "Invalid role" }, { status: 400 });
  if (!ext) return Response.json({ error: "Missing ext" }, { status: 400 });

  const uploader = await requireUploader(env, userId);
  if (!uploader) return Response.json({ error: "Not authorized" }, { status: 403 });

  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0) return Response.json({ error: "Empty upload" }, { status: 400 });
  // 25MB ceiling — generous for a WebP image or a brochure PDF, cheap
  // insurance against an accidental/abusive giant upload.
  if (buf.byteLength > 25 * 1024 * 1024) return Response.json({ error: "File too large (25MB max)" }, { status: 413 });

  const h = await hash8(buf);
  const key = buildKey({ entityPrefix, slug, role, ext, h });
  const contentType = EXTENSION_CONTENT_TYPES[ext] || request.headers.get("content-type") || "application/octet-stream";

  await env.MEDIA_BUCKET.put(key, buf, { httpMetadata: { contentType } });

  const base = new URL(request.url);
  const publicUrl = `${base.protocol}//${base.host}/media/${key}`;
  return Response.json({ url: publicUrl, key });
}

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const userId = url.searchParams.get("userId");

  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });
  const uploader = await requireUploader(env, userId);
  if (!uploader) return Response.json({ error: "Not authorized" }, { status: 403 });

  await env.MEDIA_BUCKET.delete(key);
  return Response.json({ ok: true });
}
