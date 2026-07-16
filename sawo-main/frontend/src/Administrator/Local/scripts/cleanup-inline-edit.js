#!/usr/bin/env node
/**
 * cleanup-inline-edit.js
 * Administrator/Local/scripts/cleanup-inline-edit.js
 *
 * One-off cleanup after inline-edit testing (July 16, 2026):
 *   1. Deletes site_content rows for page 'about' (created only by testing).
 *   2. Restores every 'home' section's data from the committed pre-test
 *      snapshot ../data/site_content.json (the GitHub publish failed during
 *      testing, so the snapshot predates all test edits).
 *   3. Lists files in the site-content-images bucket under the about and home
 *      folders uploaded on/after the test date, prints them, and deletes them.
 *
 * Run:  node cleanup-inline-edit.js          (add --dry-run to preview only)
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in frontend/.env(.local)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, "..", "..", "..", "..");

dotenv.config({ path: path.join(FRONTEND_DIR, ".env") });
dotenv.config({ path: path.join(FRONTEND_DIR, ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const TEST_DATE = "2026-07-16"; // day the inline-edit testing happened

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in frontend .env/.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = "site-content-images";

async function main() {
  console.log(`${DRY_RUN ? "🔍 DRY RUN — no changes will be made" : "🧹 Cleaning up inline-edit test data"}\n`);

  // ── 1. Delete 'about' rows ────────────────────────────────────────────────
  const { data: aboutRows, error: aboutSelErr } = await supabase
    .from("site_content")
    .select("page, section, updated_at, updated_by")
    .eq("page", "about");
  if (aboutSelErr) throw new Error("Selecting about rows: " + aboutSelErr.message);

  if (!aboutRows?.length) {
    console.log("1) No 'about' rows in site_content — nothing to delete.");
  } else {
    for (const r of aboutRows) console.log(`1) Deleting about/${r.section} (updated ${r.updated_at} by ${r.updated_by ?? "?"})`);
    if (!DRY_RUN) {
      const { error } = await supabase.from("site_content").delete().eq("page", "about");
      if (error) throw new Error("Deleting about rows: " + error.message);
    }
  }

  // ── 2. Restore 'home' rows from snapshot ──────────────────────────────────
  const snapshotPath = path.join(__dirname, "..", "data", "site_content.json");
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
  const homeSections = snapshot.home || {};

  console.log(`\n2) Restoring ${Object.keys(homeSections).length} home sections from snapshot (${path.relative(process.cwd(), snapshotPath)})`);
  for (const [section, data] of Object.entries(homeSections)) {
    console.log(`   home/${section} ← snapshot (${Object.keys(data).length} keys)`);
    if (!DRY_RUN) {
      const { error } = await supabase
        .from("site_content")
        .update({ data, updated_by: "cleanup-inline-edit" })
        .eq("page", "home")
        .eq("section", section);
      if (error) throw new Error(`Restoring home/${section}: ` + error.message);
    }
  }

  // ── 3. Storage cleanup: test uploads in about/ and home*/ folders ─────────
  console.log(`\n3) Scanning storage bucket '${BUCKET}' for test uploads (on/after ${TEST_DATE})…`);
  const foldersToScan = ["about", "about/hero", "about/story", "home", "home/hero", "home/section1", "home/section2", "home/section3", "home/section4", "home/section5"];
  let deletedCount = 0;

  for (const folder of foldersToScan) {
    const { data: files, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
    if (error || !files?.length) continue;

    const testFiles = files.filter(
      (f) => f.id !== null && f.created_at && f.created_at.slice(0, 10) >= TEST_DATE
    );
    for (const f of testFiles) {
      const fullPath = `${folder}/${f.name}`;
      console.log(`   deleting ${fullPath} (uploaded ${f.created_at})`);
      if (!DRY_RUN) {
        const { error: delErr } = await supabase.storage.from(BUCKET).remove([fullPath]);
        if (delErr) console.warn(`   ⚠ failed: ${delErr.message}`);
        else deletedCount++;
      } else {
        deletedCount++;
      }
    }
  }
  if (deletedCount === 0) console.log("   No test uploads found.");

  console.log(`\n✅ ${DRY_RUN ? "Dry run complete." : "Cleanup complete."} about rows: ${aboutRows?.length ?? 0} deleted, home sections restored: ${Object.keys(homeSections).length}, storage files removed: ${deletedCount}`);
}

main().catch((err) => {
  console.error("❌ " + err.message);
  process.exit(1);
});
