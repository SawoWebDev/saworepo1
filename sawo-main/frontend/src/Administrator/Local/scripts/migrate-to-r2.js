#!/usr/bin/env node

/**
 * SAWO — Supabase/GitHub media → Cloudflare R2 migration (clean-slate reorg).
 *
 * Unlike a straight bucket mirror, this is ROW-DRIVEN: for every product and
 * sauna_room, each media field is resolved to its source bytes, uploaded to
 * R2 under a new slug-scoped key (products/<slug>/<role>-<hash8>.<ext>,
 * sauna-rooms/<slug>/<role>-<hash8>.<ext>), and staged as a row update. The
 * hash8 suffix is a content hash (not random) so re-uploading identical
 * bytes always resolves to the same key — this is what collapses the
 * current ~3,125-objects-for-~1,894-files duplication for free, and what
 * keeps `Cache-Control: immutable, max-age=1yr` safe: replacing an image
 * produces a brand-new key, so nothing stale can ever be served from cache.
 *
 * A second pass reconciles the ~77 files that exist ONLY in the GitHub
 * saworepo2 clone (never uploaded to Supabase) — the single highest-
 * consequence failure mode in this migration. Each orphan is matched by
 * basename against every product/room row's field values (live Supabase
 * data first, then the bundled/synced JSON snapshots as a fallback) to
 * recover its owning slug; anything that can't be attributed lands under
 * `_unassigned/<basename>` and is flagged in the manifest for manual review
 * rather than silently dropped.
 *
 * STAGES (see the flags below):
 *   1. --dry-run   Enumerate + resolve + hash everything, write the
 *                  manifest, upload NOTHING. Always run this first.
 *   2. (default)   Upload to R2 (idempotent — HEAD before PUT, skips
 *                  identical existing objects). Still does NOT touch any
 *                  Supabase row — the manifest's `newKey`/`newUrl` per row
 *                  is staged only, for a separate --apply-db pass to be
 *                  built and run later, deliberately not part of this file
 *                  yet (see R2-MIGRATION-PLAN.md "Ordering").
 *
 * Run from this directory:
 *   node migrate-to-r2.js --dry-run
 *   node migrate-to-r2.js --dry-run --only=products
 *   node migrate-to-r2.js                # real upload, all entities
 *   node migrate-to-r2.js --resume        # skip keys already in manifest
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// ── Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const RESUME = args.includes("--resume");
const ONLY = (args.find(a => a.startsWith("--only=")) || "").split("=")[1] || null; // "products" | "sauna_rooms"
const CONCURRENCY = 10;

// ── Env ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
// Eventual public base — the Pages Function binding (R2-MIGRATION-PLAN.md §3)
// doesn't exist yet, so this is only used to populate the manifest's
// informational `newUrl` field, not to serve traffic today.
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
if (!DRY_RUN && (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY)) {
  console.error("❌ Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in .env");
  console.error("   (--dry-run doesn't need these, since it never uploads)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const s3 = DRY_RUN ? null : new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ── Paths ────────────────────────────────────────────────────────────────
// 7 levels up from Administrator/Local/scripts/ to git-sawo/ (verified —
// sync.js's "6 levels" comment is stale/wrong, don't copy it).
const REPO_ROOT = path.join(__dirname, "../../../../../../../");
const SAWOREPO2 = path.join(REPO_ROOT, "saworepo2");
const MANIFEST_PATH = path.join(__dirname, "..", "data", "r2-manifest.jsonl");

const SUPABASE_BUCKETS = ["product-images", "product-pdf", "saunaroom-images", "site-content-images"];

// ── Content-Type map (§4 of the plan — never let R2 infer it) ─────────────
const CONTENT_TYPES = {
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
};
function contentTypeFor(buf, ext) {
  if (CONTENT_TYPES[ext]) return CONTENT_TYPES[ext];
  const head = buf.slice(0, 20).toString("utf8").toLowerCase();
  if (head.includes("<!doctype") || head.includes("<html")) return "text/html";
  return "application/octet-stream";
}

function hash8(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
}

function extOf(nameOrUrl) {
  const clean = nameOrUrl.split("?")[0].split("#")[0];
  const ext = path.extname(clean).toLowerCase();
  return ext || ".bin";
}

// ── Manifest (append-only JSONL, per R2-MIGRATION-PLAN.md §4) ─────────────
let manifestWriteStream = null;
const alreadyInManifest = new Set(); // for --resume
function openManifest() {
  if (RESUME && fs.existsSync(MANIFEST_PATH)) {
    for (const line of fs.readFileSync(MANIFEST_PATH, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { alreadyInManifest.add(JSON.parse(line).key); } catch { /* ignore malformed line */ }
    }
    console.log(`↻ --resume: ${alreadyInManifest.size} keys already in manifest, will skip`);
  }
  manifestWriteStream = fs.createWriteStream(MANIFEST_PATH, { flags: RESUME ? "a" : "w" });
}
function writeManifestLine(entry) {
  manifestWriteStream.write(JSON.stringify(entry) + "\n");
}

// ── Source resolution ───────────────────────────────────────────────────
// A field value is one of: null/empty, a relative GitHub path
// ("images/foo.webp"), an absolute Supabase storage URL, or an absolute
// external URL (e.g. www.sawo.com PDFs) that we must NOT try to re-host.
function classifySource(value) {
  if (!value || typeof value !== "string") return null;
  if (!value.includes("://")) return { type: "github", ref: value };
  if (value.includes(SUPABASE_URL) || value.includes(".supabase.co/storage/")) {
    const m = value.match(/\/object\/public\/([^/]+)\/(.+)$/);
    if (m) return { type: "supabase", bucket: m[1], objectPath: decodeURIComponent(m[2].split("?")[0]) };
  }
  return { type: "external", ref: value }; // leave untouched
}

async function readBytes(source) {
  if (source.type === "github") {
    const localPath = path.join(SAWOREPO2, source.ref);
    if (!fs.existsSync(localPath)) return null;
    return fs.readFileSync(localPath);
  }
  if (source.type === "supabase") {
    const { data, error } = await supabase.storage.from(source.bucket).download(source.objectPath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  return null; // external — never fetched, never re-hosted
}

// ── R2 upload (idempotent) ──────────────────────────────────────────────
const uploadCache = new Map(); // hash8+ext -> key, avoids redundant HEADs within one run
async function uploadToR2(buf, key, contentType) {
  if (!DRY_RUN) {
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      if (head.ContentLength === buf.length) return "skipped-exists";
    } catch { /* not found — proceed to upload */ }
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return "uploaded";
  }
  return "dry-run";
}

// One resolved media reference, ready to upload + record.
async function processRef({ value, entityPrefix, slug, role }) {
  const source = classifySource(value);
  if (!source) return { newValue: value, status: "empty" };
  if (source.type === "external") return { newValue: value, status: "external-passthrough" };

  const buf = await readBytes(source);
  if (!buf) {
    writeManifestLine({
      key: null, role, entityPrefix, slug, sourceType: source.type,
      sourceRef: source.type === "github" ? source.ref : `${source.bucket}/${source.objectPath}`,
      status: "MISSING_SOURCE",
    });
    return { newValue: value, status: "MISSING_SOURCE", source };
  }

  const ext = extOf(source.type === "github" ? source.ref : source.objectPath);
  const h = hash8(buf);
  const key = `${entityPrefix}/${slug}/${role}-${h}${ext}`;
  const ct = contentTypeFor(buf, ext);

  if (alreadyInManifest.has(key)) return { newValue: `${R2_PUBLIC_BASE}${key}`, status: "resumed-skip", key };

  const cacheKey = key;
  let status;
  if (uploadCache.has(cacheKey)) {
    status = "deduped-in-run";
  } else {
    status = await uploadToR2(buf, key, ct);
    uploadCache.set(cacheKey, true);
  }

  writeManifestLine({
    key, role, entityPrefix, slug, sourceType: source.type,
    sourceRef: source.type === "github" ? source.ref : `${source.bucket}/${source.objectPath}`,
    bytes: buf.length, hash8: h, contentType: ct, status,
  });

  return { newValue: `${R2_PUBLIC_BASE}${key}`, status, key };
}

async function processArray(values, entityPrefix, slug, role) {
  if (!Array.isArray(values)) return { newValues: values, results: [] };
  const results = [];
  for (const v of values) results.push(await processRef({ value: v, entityPrefix, slug, role }));
  return { newValues: results.map(r => r.newValue), results };
}

// ── Products ─────────────────────────────────────────────────────────────
async function migrateProducts(stats) {
  const { data: products, error } = await supabase
    .from("products").select("*").eq("is_deleted", false);
  if (error) throw error;
  console.log(`\n📦 ${products.length} products`);

  for (const p of products) {
    const prefix = "products";
    const thumb = await processRef({ value: p.thumbnail, entityPrefix: prefix, slug: p.slug, role: "thumbnail" });
    const images = await processArray(p.images, prefix, p.slug, "gallery");
    const spec = await processArray(p.spec_images, prefix, p.slug, "spec");

    const files = Array.isArray(p.files) ? [] : p.files;
    if (Array.isArray(p.files)) {
      for (const f of p.files) {
        const url = f?.url || f?.path;
        const r = await processRef({ value: url, entityPrefix: prefix, slug: p.slug, role: `manual-${(f?.name || "file").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}` });
        files.push({ ...f, url: r.newValue });
        tally(stats, r.status);
      }
    }

    const variants = Array.isArray(p.variants) ? [] : p.variants;
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        const r = await processRef({ value: v?.image, entityPrefix: prefix, slug: p.slug, role: `variant-${(v?.code || v?.color || "x").toLowerCase().replace(/[^a-z0-9]+/g, "-")}` });
        variants.push({ ...v, image: r.newValue });
        tally(stats, r.status);
      }
    }

    tally(stats, thumb.status);
    images.results.forEach(r => tally(stats, r.status));
    spec.results.forEach(r => tally(stats, r.status));

    stats.rowUpdates.products.push({
      id: p.id, slug: p.slug,
      thumbnail: thumb.newValue, images: images.newValues, spec_images: spec.newValues,
      files, variants,
    });
  }
}

// ── Sauna rooms ──────────────────────────────────────────────────────────
async function migrateRooms(stats) {
  const { data: rooms, error } = await supabase
    .from("sauna_rooms").select("*").eq("is_deleted", false);
  if (error) throw error;
  console.log(`\n🛖 ${rooms.length} sauna rooms`);

  for (const r of rooms) {
    const prefix = "sauna-rooms";
    const thumb = await processRef({ value: r.thumbnail, entityPrefix: prefix, slug: r.slug, role: "thumbnail" });
    const images = await processArray(r.images, prefix, r.slug, "gallery");
    const spec = await processArray(r.spec_images, prefix, r.slug, "spec");

    const files = Array.isArray(r.files) ? [] : r.files;
    if (Array.isArray(r.files)) {
      for (const f of r.files) {
        const url = f?.url || f?.path;
        const rr = await processRef({ value: url, entityPrefix: prefix, slug: r.slug, role: `manual-${(f?.name || "file").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}` });
        files.push({ ...f, url: rr.newValue });
        tally(stats, rr.status);
      }
    }

    const configurations = {};
    if (r.configurations && typeof r.configurations === "object") {
      for (const [configKey, cfg] of Object.entries(r.configurations)) {
        const safeKey = configKey.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const cfgImages = await processArray(cfg?.images, prefix, r.slug, `config-${safeKey}`);
        const panel = await processRef({ value: cfg?.panel_image, entityPrefix: prefix, slug: r.slug, role: `config-${safeKey}-panel` });
        configurations[configKey] = { ...cfg, images: cfgImages.newValues, panel_image: panel.newValue };
        cfgImages.results.forEach(x => tally(stats, x.status));
        tally(stats, panel.status);
      }
    }

    tally(stats, thumb.status);
    images.results.forEach(x => tally(stats, x.status));
    spec.results.forEach(x => tally(stats, x.status));

    stats.rowUpdates.sauna_rooms.push({
      id: r.id, slug: r.slug,
      thumbnail: thumb.newValue, images: images.newValues, spec_images: spec.newValues,
      files, configurations,
    });
  }
}

// ── Orphan reconciliation (§4 "most important check") ─────────────────────
function walkDir(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === ".gitkeep" || entry.name === ".gitignore") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkDir(full, base));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

async function listAllSupabaseObjects() {
  const basenames = new Set();
  for (const bucket of SUPABASE_BUCKETS) {
    const stack = [""];
    while (stack.length) {
      const prefix = stack.pop();
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
      if (error) { console.warn(`⚠ list ${bucket}/${prefix}: ${error.message}`); continue; }
      for (const item of data || []) {
        const full = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) stack.push(full); // folder marker (no id) → recurse
        else basenames.add(path.basename(item.name));
      }
    }
  }
  return basenames;
}

// Flatten every media field across bundled/synced JSON snapshots, so an
// orphan can be attributed to a slug even if the live Supabase row now
// points elsewhere (stale snapshot still names the file).
function collectSlugByBasenameFromSnapshots() {
  const map = new Map(); // basename -> slug
  const candidates = [
    path.join(__dirname, "..", "data", "products.json"),
    path.join(__dirname, "..", "data", "saunaroom-data.json"),
    path.join(SAWOREPO2, "products.json"),
    path.join(SAWOREPO2, "saunaroom-data.json"),
    path.join(SAWOREPO2, "allaccs-data.json"),
  ];
  const visit = (val, slug) => {
    if (!val) return;
    if (typeof val === "string" && !val.includes("://")) {
      map.set(path.basename(val), slug);
    } else if (Array.isArray(val)) {
      val.forEach(v => visit(v, slug));
    } else if (typeof val === "object") {
      Object.values(val).forEach(v => visit(v, slug));
    }
  };
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
      const rows = Array.isArray(json) ? json : Object.values(json).flat();
      for (const row of rows) {
        if (!row || !row.slug) continue;
        ["thumbnail", "images", "spec_images", "files", "variants", "configurations"].forEach(k => visit(row[k], row.slug));
      }
    } catch (err) {
      console.warn(`⚠ failed to parse ${file}: ${err.message}`);
    }
  }
  return map;
}

async function reconcileOrphans(stats) {
  console.log("\n🔎 Reconciling GitHub-only orphans...");
  const githubFiles = [
    ...walkDir(path.join(SAWOREPO2, "images")).map(f => `images/${f}`),
    ...walkDir(path.join(SAWOREPO2, "files")).map(f => `files/${f}`),
    ...walkDir(path.join(SAWOREPO2, "saunaroom-images")).map(f => `saunaroom-images/${f}`),
    ...walkDir(path.join(SAWOREPO2, "sauna-room-images")).map(f => `sauna-room-images/${f}`), // legacy dir
  ];
  const supabaseBasenames = await listAllSupabaseObjects();
  const orphans = githubFiles.filter(f => !supabaseBasenames.has(path.basename(f)));

  console.log(`   ${githubFiles.length} GitHub files, ${orphans.length} not present in any Supabase bucket`);
  const slugByBasename = collectSlugByBasenameFromSnapshots();

  for (const rel of orphans) {
    const basename = path.basename(rel);
    const slug = slugByBasename.get(basename);
    const isRoom = rel.startsWith("saunaroom-images/") || rel.startsWith("sauna-room-images/");
    const prefix = slug ? (isRoom ? "sauna-rooms" : "products") : "_unassigned";
    const finalSlug = slug || "orphans";
    const role = slug ? "orphan" : basename.replace(/\.[^.]+$/, "");
    const r = await processRef({ value: rel, entityPrefix: prefix, slug: finalSlug, role });
    tally(stats, r.status);
    if (!slug) stats.unassignedOrphans.push(rel);
  }
  stats.orphanCount = orphans.length;
}

function tally(stats, status) {
  stats.counts[status] = (stats.counts[status] || 0) + 1;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🚀 R2 migration — ${DRY_RUN ? "DRY RUN (no uploads)" : `LIVE (bucket: ${R2_BUCKET})`}${RESUME ? ", resuming" : ""}`);
  openManifest();

  const stats = { counts: {}, rowUpdates: { products: [], sauna_rooms: [] }, unassignedOrphans: [], orphanCount: 0 };

  if (!ONLY || ONLY === "products") await migrateProducts(stats);
  if (!ONLY || ONLY === "sauna_rooms") await migrateRooms(stats);
  if (!ONLY) await reconcileOrphans(stats);

  manifestWriteStream.end();

  const stagedPath = path.join(__dirname, "..", "data", "r2-staged-row-updates.json");
  fs.writeFileSync(stagedPath, JSON.stringify(stats.rowUpdates, null, 2));

  console.log("\n───────────────────────────────────────");
  console.log("SUMMARY");
  console.log("───────────────────────────────────────");
  for (const [status, n] of Object.entries(stats.counts)) console.log(`  ${status}: ${n}`);
  console.log(`  GitHub-only orphans found: ${stats.orphanCount}`);
  console.log(`  Orphans with NO row attribution (→ _unassigned/): ${stats.unassignedOrphans.length}`);
  if (stats.unassignedOrphans.length) {
    console.log("    " + stats.unassignedOrphans.slice(0, 20).join("\n    "));
    if (stats.unassignedOrphans.length > 20) console.log(`    ...and ${stats.unassignedOrphans.length - 20} more`);
  }
  if (stats.counts.MISSING_SOURCE) {
    console.log(`\n⚠️  ${stats.counts.MISSING_SOURCE} reference(s) pointed at a file that no longer exists on disk/Supabase — see manifest for details.`);
  }
  console.log(`\nManifest: ${MANIFEST_PATH}`);
  console.log(`Staged row updates (NOT yet applied to Supabase): ${stagedPath}`);
  console.log(DRY_RUN
    ? "\nThis was a dry run — nothing was uploaded. Review the manifest, then re-run without --dry-run."
    : "\nUpload pass complete. Supabase rows have NOT been modified — that is a separate, explicitly-confirmed step.");
}

main().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
