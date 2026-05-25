#!/usr/bin/env node
/**
 * sync-site-content.js
 * Administrator/Local/scripts/sync-site-content.js
 *
 * Fetches site_content rows from Supabase, downloads any Supabase-hosted
 * images to saworepo2/site-images/, converts URLs to raw GitHub paths, and
 * writes site_content.json to Administrator/Local/data/.
 *
 * Run: node sync-site-content.js
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_OWNER              = process.env.GITHUB_OWNER  || "jmesrafael";
const GITHUB_IMAGES_REPO        = process.env.GITHUB_IMAGES_REPO || "saworepo2";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Check .env file.");
  console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DATA_DIR   = path.join(__dirname, "..", "data");
// site-images lives next to images/ in saworepo2
const IMAGES_DIR = path.join(__dirname, "../../../../../../", "saworepo2", "site-images");

if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR,   { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const GITHUB_RAW_BASE =
  `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_IMAGES_REPO}/main/site-images/`;

let statsDownloaded = 0;

// ── Download one file ─────────────────────────────────────────────────────────
async function downloadFile(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buf = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buf);
    if (fs.statSync(outputPath).size === 0) throw new Error("File empty after write");
    return true;
  } catch (err) {
    console.warn(`  ⚠️  Failed to download ${url}: ${err.message}`);
    return false;
  }
}

// ── Process one image URL ─────────────────────────────────────────────────────
// If it is a Supabase storage URL → download to site-images/ and return GitHub raw URL.
// If it is already null or a non-Supabase URL → return as-is.
async function processImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes(SUPABASE_URL))     return url; // external URL — keep as-is

  const filename   = path.basename(new URL(url).pathname);
  const outputPath = path.join(IMAGES_DIR, filename);
  const githubUrl  = `${GITHUB_RAW_BASE}${filename}`;

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    return githubUrl; // already downloaded
  }

  const ok = await downloadFile(url, outputPath);
  if (ok) { statsDownloaded++; return githubUrl; }
  return url; // keep original Supabase URL on failure
}

// ── Process all image_url fields inside a data object recursively ─────────────
async function processDataImages(data) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return Promise.all(data.map(item => processDataImages(item)));
  }

  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (
      (key === "image_url" || key === "image_640" || key === "image_1024" ||
       key === "image_1920" || key === "image_left" || key === "image_right") &&
      typeof val === "string" && val.includes("://")
    ) {
      out[key] = await processImageUrl(val);
    } else if (Array.isArray(val)) {
      out[key] = await Promise.all(val.map(item => processDataImages(item)));
    } else if (val && typeof val === "object") {
      out[key] = await processDataImages(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

// ── Fetch all site_content rows from Supabase ─────────────────────────────────
async function fetchSiteContent() {
  console.log("📄 Fetching site_content from Supabase...");
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("page")
    .order("section");

  if (error) {
    console.error("❌ Error fetching site_content:", error.message);
    process.exit(1);
  }

  return data || [];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function sync() {
  try {
    console.log("🚀 Starting site content sync...\n");

    const rows = await fetchSiteContent();
    console.log(`✅ Fetched ${rows.length} content rows\n`);

    // Build nested JSON: { page: { section: data } }
    const result = {};

    for (const row of rows) {
      const { page, section, data } = row;
      if (!result[page]) result[page] = {};
      process.stdout.write(`  Processing ${page}/${section}... `);
      result[page][section] = await processDataImages(data);
      console.log("✓");
    }

    const timestamp = new Date().toISOString();

    // Write to local data folder
    fs.writeFileSync(
      path.join(DATA_DIR, "site_content.json"),
      JSON.stringify(result, null, 2)
    );

    console.log("\n✅ Sync complete!");
    console.log(`📄 Sections written: ${rows.length}`);
    console.log(`🖼️  Images downloaded: ${statsDownloaded}`);
    console.log(`⏱️  Last synced: ${timestamp}`);
    console.log(`\n📁 Output: ${path.join(DATA_DIR, "site_content.json")}`);
    console.log(`📁 Images: ${IMAGES_DIR}\n`);

  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

sync();
