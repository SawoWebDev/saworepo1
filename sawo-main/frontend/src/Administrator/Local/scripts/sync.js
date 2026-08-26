#!/usr/bin/env node
/**
 * sync.js — refreshes the local products/categories/tags/meta JSON
 * snapshots (Administrator/Local/data/*.json) from live Supabase.
 *
 * These snapshots feed offline/local-storage fallback paths and
 * scripts/generate-sitemap.js (which can't do a live Supabase query itself
 * — see that script's header). Re-run whenever product data changes
 * meaningfully and you need those snapshots current, e.g. before
 * regenerating the sitemap.
 *
 * HISTORY: this used to also re-download every product's images/PDFs to a
 * local `saworepo2/images`+`files` folder (a sibling repo), rewriting each
 * product's image/file fields to local relative paths. That pipeline
 * predates the move to Cloudflare Pages/R2 for asset hosting — every
 * product's images/files are now already-live CDN URLs
 * (https://saworepo1.pages.dev/media/...), not Supabase Storage bucket
 * paths, so there is nothing left to download: Supabase Storage buckets
 * for this project were emptied 2026-08-20 (see memory:
 * supabase-storage-winddown), and `saworepo2` itself has since been
 * discarded. Removed that whole step 2026-08-26 rather than repoint it at
 * a new destination — the CDN URLs already work as-is, live, from
 * Supabase's own columns, so there's no local copy to maintain.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SUPABASE_URL lives in frontend/.env, SUPABASE_SERVICE_ROLE_KEY in
// frontend/.env.local — same two-file load as product-i18n.js (plain
// dotenv.config() only reads .env, which silently dropped the service
// role key here before).
const FRONTEND_DIR = path.join(__dirname, "..", "..", "..", "..");
dotenv.config({ path: path.join(FRONTEND_DIR, ".env") });
dotenv.config({ path: path.join(FRONTEND_DIR, ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Check .env / .env.local files.");
  console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

async function fetchProducts() {
  console.log("📦 Fetching products...");
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching products:", error.message);
    process.exit(1);
  }

  return data || [];
}

async function fetchCategories() {
  console.log("📂 Fetching categories...");
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description");

  if (error) {
    console.error("❌ Error fetching categories:", error.message);
    process.exit(1);
  }

  return data || [];
}

async function fetchTags() {
  console.log("🏷️  Fetching tags...");
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug");

  if (error) {
    console.error("❌ Error fetching tags:", error.message);
    process.exit(1);
  }

  return data || [];
}

async function sync() {
  try {
    console.log("🚀 Starting sync...\n");

    const [products, categories, tags] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchTags(),
    ]);

    const timestamp = new Date().toISOString();
    const meta = {
      last_synced: timestamp,
      total_products: products.length,
    };

    fs.writeFileSync(
      path.join(DATA_DIR, "products.json"),
      JSON.stringify(products, null, 2)
    );
    fs.writeFileSync(
      path.join(DATA_DIR, "categories.json"),
      JSON.stringify(categories, null, 2)
    );
    fs.writeFileSync(
      path.join(DATA_DIR, "tags.json"),
      JSON.stringify(tags, null, 2)
    );
    fs.writeFileSync(
      path.join(DATA_DIR, "meta.json"),
      JSON.stringify(meta, null, 2)
    );

    console.log("\n✅ Sync complete!\n");
    console.log(`✅ Products synced: ${products.length}`);
    console.log(`✅ Categories synced: ${categories.length}`);
    console.log(`✅ Tags synced: ${tags.length}`);
    console.log(`⏱️  Last synced: ${timestamp}\n`);
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

sync();
