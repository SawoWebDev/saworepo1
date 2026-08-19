#!/usr/bin/env node

/**
 * SAWO — Supabase Storage audit / archive / purge.
 *
 * Media moved to Cloudflare R2 (migrate-to-r2.js) and to WordPress, but that
 * migration was row-driven: it copied what rows pointed at and left the
 * buckets themselves untouched. The result is a bucket set that is almost
 * entirely pre-migration leftovers — objects nothing in the database
 * references any more, sitting against a 1 GB Free Plan allowance.
 *
 * This does NOT assume those leftovers are safe to drop. An object is only
 * ever deletable here if BOTH are true:
 *
 *   1. Its name appears nowhere in any content table (see SCAN_DENYLIST) —
 *      not in products, not in an old activity_logs revision, nowhere.
 *   2. A byte-identical copy exists in the local archive directory, put
 *      there by this script's own --archive stage and re-verified by size
 *      at delete time.
 *
 * Supabase Storage has no undelete. Rule 2 is the whole point: the archive
 * is the undo. --archive is also the only stage that costs egress (one full
 * pull of whatever is not already archived), which is a deliberate trade —
 * a few hundred MB once, against carrying the same bytes as permanent
 * "usage" every month.
 *
 * STAGES:
 *   node storage-audit.js                    # audit only — reads, writes manifest
 *   node storage-audit.js --archive          # + download unreferenced objects
 *   node storage-audit.js --delete --yes     # + delete verified-archived ones
 *
 * Options:
 *   --bucket=<name>      restrict to one bucket
 *   --archive-dir=<p>    archive location (default ../data/storage-archive)
 *   --include-external   also treat "served from elsewhere" objects as
 *                        candidates — stale copies of files the site now
 *                        loads from www.sawo.com or R2. Held back by default
 *                        because the judgement ("that other host is
 *                        authoritative now") is the operator's, not this
 *                        script's. They are archived before deletion either
 *                        way.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config(); // fall back to a .env in the cwd, like sync.js

// ── Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DO_ARCHIVE = args.includes("--archive") || args.includes("--delete");
const DO_DELETE = args.includes("--delete");
const CONFIRMED = args.includes("--yes");
const ONLY_BUCKET = (args.find(a => a.startsWith("--bucket=")) || "").split("=")[1] || null;
const INCLUDE_EXTERNAL = args.includes("--include-external");
const ARCHIVE_DIR = (args.find(a => a.startsWith("--archive-dir=")) || "").split("=")[1]
  || path.join(__dirname, "..", "data", "storage-archive");
const MANIFEST_PATH = path.join(__dirname, "..", "data", "storage-audit.json");

// ── Env ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("   Put them in scripts/.env (same file migrate-to-r2.js uses).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const SUPABASE_HOST = (() => { try { return new URL(SUPABASE_URL).host; } catch { return SUPABASE_URL; } })();

// Every table that could plausibly hold a media reference. activity_logs is
// in here deliberately: its revision entries quote old image URLs, and a
// revision rendering a broken image is still a regression.
const SCAN_TABLES = [
  "products", "sauna_rooms", "categories", "tags", "product_variants",
  "product_commerce", "site_content", "page_seo", "app_settings",
  "activity_logs", "contact_submissions", "users",
];

// Excluded from the scan: high-volume telemetry and SEO bookkeeping that
// never holds a media URL. Listed separately from SCAN_TABLES so adding a
// table to the scan list can never be silently undone by this set.
const SCAN_DENYLIST = new Set([
  "analytics_page_views", "analytics_events",
  "uptime_checks", "uptime_daily_summary",
  "ci_check_runs", "_keepalive_pings",
  "seo_keywords", "seo_competitors", "seo_tracked_keywords",
  "seo_sync_state", "seo_serp_usage",
]);

const fmt = bytes => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ── List every object in a bucket, recursing into folders ────────────────
async function listBucket(bucket, prefix = "") {
  const out = [];
  const PAGE = 100;
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE, offset, sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      // A folder placeholder has no id/metadata — recurse into it.
      if (!entry.id) out.push(...await listBucket(bucket, full));
      else out.push({ name: full, size: entry.metadata?.size ?? 0 });
    }
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

// ── Build one big text blob of every content row ─────────────────────────
// Crude on purpose: a substring hit anywhere counts as a reference. It
// over-matches (an object sharing a basename with a WordPress-hosted file
// is kept), and over-matching is the harmless direction.
async function buildReferenceBlob() {
  const parts = [];
  const scanned = [];
  for (const table of SCAN_TABLES) {
    if (SCAN_DENYLIST.has(table)) continue;
    const { data, error: e } = await supabase.from(table).select("*");
    if (e) { console.warn(`   ⚠️  skipped ${table}: ${e.message}`); continue; }
    parts.push(JSON.stringify(data || []));
    scanned.push(`${table}(${(data || []).length})`);
  }
  console.log(`   scanned: ${scanned.join(", ")}`);
  return parts.join("\n");
}

/**
 * Classify one object by how (and whether) the database still mentions it.
 *
 * A plain substring test is not enough here, because the R2/WordPress
 * migrations kept original filenames: `Aries-Corner-NS-NB_FiEn-3P-1P.pdf`
 * appears in the data as a www.sawo.com URL while a same-named object also
 * still sits in the Supabase bucket. Naive matching calls that "referenced"
 * and protects 189 MB of files nothing actually loads from Supabase.
 *
 * Returns one of:
 *   "supabase"  — something points at THIS object in storage. Never delete.
 *   "external"  — the name only ever appears inside a URL on another host
 *                 (www.sawo.com, R2), so the live site is served from there
 *                 and this is a stale pre-migration copy.
 *   "orphan"    — the name appears nowhere at all.
 *
 * Ambiguity resolves to "supabase": a bare filename or relative path with
 * no host could be a bucket path, so it counts as a live reference.
 */
function classifyReference(blob, objectName) {
  const needles = [objectName];
  const base = path.basename(objectName);
  if (base !== objectName) needles.push(base);

  let sawAny = false;
  for (const needle of needles) {
    let from = 0;
    for (;;) {
      const at = blob.indexOf(needle, from);
      if (at === -1) break;
      sawAny = true;
      from = at + needle.length;

      // Widen to the enclosing token: JSON/text delimiters bound a URL.
      let start = at;
      while (start > 0 && !'"\'\\ \t\n\r,{}[]()<>'.includes(blob[start - 1])) start--;
      const token = blob.slice(start, from);

      if (token.includes("/storage/v1/object/") || token.includes(SUPABASE_HOST)) return "supabase";
      if (!/^https?:\/\//i.test(token)) return "supabase"; // bare path — assume bucket
    }
  }
  return sawAny ? "external" : "orphan";
}

// ── Archive one object ───────────────────────────────────────────────────
async function archiveObject(bucket, obj) {
  const dest = path.join(ARCHIVE_DIR, bucket, obj.name);
  if (fs.existsSync(dest) && fs.statSync(dest).size === obj.size && obj.size > 0) {
    return "already-archived";
  }
  const { data, error } = await supabase.storage.from(bucket).download(obj.name);
  if (error) throw new Error(`download ${bucket}/${obj.name}: ${error.message}`);
  const buf = Buffer.from(await data.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  const written = fs.statSync(dest).size;
  if (obj.size > 0 && written !== obj.size) {
    throw new Error(`size mismatch for ${bucket}/${obj.name}: got ${written}, expected ${obj.size}`);
  }
  return "archived";
}

function isSafelyArchived(bucket, obj) {
  const dest = path.join(ARCHIVE_DIR, bucket, obj.name);
  if (!fs.existsSync(dest)) return false;
  const local = fs.statSync(dest).size;
  return local > 0 && (obj.size === 0 || local === obj.size);
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔎 Reading storage buckets...");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) { console.error("❌ Could not list buckets:", bErr.message); process.exit(1); }

  const targets = buckets.filter(b => !ONLY_BUCKET || b.name === ONLY_BUCKET);
  if (targets.length === 0) { console.error(`❌ No bucket named "${ONLY_BUCKET}".`); process.exit(1); }

  console.log("🔗 Building reference index from content tables...");
  const blob = await buildReferenceBlob();

  const manifest = { generated_at: new Date().toISOString(), archive_dir: ARCHIVE_DIR, buckets: {} };
  let totalOrphanBytes = 0, totalKeptBytes = 0, totalExternalBytes = 0;

  for (const b of targets) {
    const objects = await listBucket(b.name);
    const live = [], external = [], orphans = [];
    for (const o of objects) {
      const cls = classifyReference(blob, o.name);
      (cls === "supabase" ? live : cls === "external" ? external : orphans).push(o);
    }
    // Both classes are candidates: an "external" object is a stale copy of a
    // file the site now loads from another host. It is only ever deleted with
    // --include-external, and only after archiving, same as an orphan.
    const candidates = INCLUDE_EXTERNAL ? orphans.concat(external) : orphans;

    const bytes = list => list.reduce((n, o) => n + o.size, 0);
    totalOrphanBytes += bytes(orphans);
    totalExternalBytes += bytes(external);
    totalKeptBytes += bytes(live);

    console.log(`\n📦 ${b.name}`);
    console.log(`   ${objects.length} object(s), ${fmt(bytes(objects))}`);
    console.log(`   loaded from Supabase:  ${live.length} (${fmt(bytes(live))}) — never touched`);
    console.log(`   served from elsewhere: ${external.length} (${fmt(bytes(external))})${INCLUDE_EXTERNAL ? "" : " — needs --include-external"}`);
    console.log(`   unreferenced:          ${orphans.length} (${fmt(bytes(orphans))})`);

    if (DO_ARCHIVE && candidates.length) {
      let done = 0, skipped = 0;
      for (const o of candidates) {
        const r = await archiveObject(b.name, o);
        r === "archived" ? done++ : skipped++;
        if ((done + skipped) % 100 === 0) console.log(`   ...${done + skipped}/${candidates.length}`);
      }
      console.log(`   archived ${done}, already had ${skipped} → ${path.join(ARCHIVE_DIR, b.name)}`);
    }

    const describe = list => list.map(o => ({ name: o.name, size: o.size, archived: isSafelyArchived(b.name, o) }));
    manifest.buckets[b.name] = {
      total: objects.length,
      loaded_from_supabase: live.map(o => o.name),
      served_from_elsewhere: describe(external),
      unreferenced: describe(orphans),
    };

    if (DO_DELETE) {
      const deletable = candidates.filter(o => isSafelyArchived(b.name, o));
      const blocked = candidates.length - deletable.length;
      if (blocked) console.log(`   ⚠️  ${blocked} candidate(s) are NOT verified in the archive — skipping those.`);
      if (!CONFIRMED) {
        console.log(`   would delete ${deletable.length} object(s) — re-run with --yes to actually delete.`);
      } else if (deletable.length) {
        for (let i = 0; i < deletable.length; i += 100) {
          const batch = deletable.slice(i, i + 100).map(o => o.name);
          const { error } = await supabase.storage.from(b.name).remove(batch);
          if (error) { console.error(`   ❌ delete failed: ${error.message}`); process.exit(1); }
          console.log(`   deleted ${Math.min(i + 100, deletable.length)}/${deletable.length}`);
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Loaded from Supabase (kept):  ${fmt(totalKeptBytes)}`);
  console.log(`Served from elsewhere:        ${fmt(totalExternalBytes)}`);
  console.log(`Unreferenced:                 ${fmt(totalOrphanBytes)}`);
  console.log(`Reclaimable now:              ${fmt(INCLUDE_EXTERNAL ? totalOrphanBytes + totalExternalBytes : totalOrphanBytes)}`);
  console.log(`Manifest:                     ${MANIFEST_PATH}`);
  if (!DO_ARCHIVE) console.log(`\nNothing was downloaded or deleted. Next: --archive, then --delete --yes.`);
  else if (!DO_DELETE) console.log(`\nArchived only. Nothing was deleted.`);
  else if (!CONFIRMED) console.log(`\nDry run. Nothing was deleted.`);
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
