#!/usr/bin/env node
/**
 * Applies the staged R2 URL rewrites (r2-staged-row-updates.json, produced
 * by migrate-to-r2.js) to the live products/sauna_rooms tables.
 *
 * ALWAYS takes a full pre-write backup of the current row values first —
 * written to data/r2-backup-<timestamp>.json — so this is reversible by
 * re-running the same update logic against the backup file.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const STAGED_PATH = path.join(__dirname, "..", "data", "r2-staged-row-updates.json");
const staged = JSON.parse(fs.readFileSync(STAGED_PATH, "utf8"));

const RESTORE = process.argv.includes("--restore");
const RESTORE_FILE = (process.argv.find(a => a.startsWith("--file=")) || "").split("=")[1];

async function backup() {
  const [{ data: products }, { data: rooms }] = await Promise.all([
    supabase.from("products").select("id,slug,thumbnail,images,spec_images,files,variants"),
    supabase.from("sauna_rooms").select("id,slug,thumbnail,images,spec_images,files,configurations"),
  ]);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, "..", "data", `r2-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ products, sauna_rooms: rooms }, null, 2));
  console.log(`✅ Backup written: ${backupPath} (${products.length} products, ${rooms.length} rooms)`);
  return backupPath;
}

async function applyUpdates(data, label) {
  let ok = 0, failed = [];
  for (const row of data.products || []) {
    const { id, slug, ...fields } = row;
    const { error } = await supabase.from("products").update(fields).eq("id", id);
    if (error) failed.push({ id, slug, table: "products", error: error.message });
    else ok++;
  }
  for (const row of data.sauna_rooms || []) {
    const { id, slug, ...fields } = row;
    const { error } = await supabase.from("sauna_rooms").update(fields).eq("id", id);
    if (error) failed.push({ id, slug, table: "sauna_rooms", error: error.message });
    else ok++;
  }
  console.log(`\n[${label}] ✅ ${ok} rows updated`);
  if (failed.length) {
    console.log(`[${label}] ❌ ${failed.length} rows FAILED:`);
    console.log(JSON.stringify(failed, null, 2));
  }
  return { ok, failed };
}

async function main() {
  if (RESTORE) {
    if (!RESTORE_FILE || !fs.existsSync(RESTORE_FILE)) {
      console.error("❌ --restore requires --file=<path-to-backup-json>");
      process.exit(1);
    }
    const backupData = JSON.parse(fs.readFileSync(RESTORE_FILE, "utf8"));
    console.log(`⏪ Restoring from ${RESTORE_FILE}...`);
    await applyUpdates(backupData, "RESTORE");
    return;
  }

  console.log("📸 Taking pre-write backup...");
  const backupPath = await backup();

  console.log(`\n🚀 Applying staged R2 URLs (${staged.products.length} products, ${staged.sauna_rooms.length} rooms)...`);
  const result = await applyUpdates(staged, "APPLY");

  console.log(`\nBackup for rollback: ${backupPath}`);
  console.log(`Rollback command: node apply-r2-urls.js --restore --file="${backupPath}"`);
}

main().catch(err => { console.error("❌ Failed:", err); process.exit(1); });
