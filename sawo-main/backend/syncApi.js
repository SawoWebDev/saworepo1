/**
 * Sync API - Merges Supabase data with local products.json
 * Only adds NEW items, downloads images to saworepo2
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from backend .env
dotenv.config({ path: path.join(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("   Required: SUPABASE_URL, SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Paths
const PRODUCTS_JSON = path.join(__dirname, "../frontend/src/Administrator/Local/data/products.json");
const CATEGORIES_JSON = path.join(__dirname, "../frontend/src/Administrator/Local/data/categories.json");
const TAGS_JSON = path.join(__dirname, "../frontend/src/Administrator/Local/data/tags.json");
const META_JSON = path.join(__dirname, "../frontend/src/Administrator/Local/data/meta.json");
const IMAGES_DIR = path.join(__dirname, "../../saworepo2/images");
const FILES_DIR = path.join(__dirname, "../../saworepo2/files");

let statsDownloaded = { images: 0, files: 0 };

// ── Fetch from Supabase ────────────────────────────────────────────────────
async function fetchSupabaseData() {
  console.log("📦 Fetching from Supabase...");

  const [products, categories, tags] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_deleted", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, slug, description"),
    supabase
      .from("tags")
      .select("id, name, slug"),
  ]);

  if (products.error) throw new Error(`Products fetch failed: ${products.error.message}`);
  if (categories.error) throw new Error(`Categories fetch failed: ${categories.error.message}`);
  if (tags.error) throw new Error(`Tags fetch failed: ${tags.error.message}`);

  return {
    products: products.data || [],
    categories: categories.data || [],
    tags: tags.data || [],
  };
}

// ── Download image from URL ────────────────────────────────────────────────
async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    const stats = fs.statSync(outputPath);
    return stats.size > 0;
  } catch (err) {
    console.warn(`⚠️  Failed to download ${url}: ${err.message}`);
    return false;
  }
}

// ── Process image field ────────────────────────────────────────────────────
async function processImageField(value, bucket = "product-images") {
  if (!value) return value;

  if (Array.isArray(value)) {
    const results = [];
    for (const item of value) {
      const processed = await processImageField(item, bucket);
      results.push(processed);
    }
    return results;
  }

  // Already a relative path, keep as-is
  if (!value.includes("http") && !value.includes("://")) {
    return value;
  }

  // It's a full URL, extract filename and download
  const filename = path.basename(value);
  let downloadUrl = value;

  if (value.includes(SUPABASE_URL)) {
    downloadUrl = value;
  } else {
    downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${value}`;
  }

  const outputPath = path.join(IMAGES_DIR, filename);
  const success = await downloadImage(downloadUrl, outputPath);

  if (success) {
    statsDownloaded.images++;
    return `images/${filename}`;
  }

  return value; // Return original if download fails
}

// ── Process files array ────────────────────────────────────────────────────
async function processFiles(filesArray) {
  if (!filesArray || !Array.isArray(filesArray)) return filesArray;

  const processed = [];
  for (const file of filesArray) {
    if (typeof file === "object" && file.path) {
      const filename = path.basename(file.path);
      const downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/product-pdf/${file.path}`;
      const outputPath = path.join(FILES_DIR, filename);

      const success = await downloadImage(downloadUrl, outputPath);
      if (success) {
        statsDownloaded.files++;
        processed.push({ ...file, path: `files/${filename}` });
      } else {
        processed.push(file);
      }
    } else {
      processed.push(file);
    }
  }
  return processed;
}

// ── Main merge sync function ───────────────────────────────────────────────
export async function syncMerge() {
  try {
    statsDownloaded = { images: 0, files: 0 };
    console.log("🚀 Starting merge sync...\n");

    // Load existing local products
    const existingProducts = fs.existsSync(PRODUCTS_JSON)
      ? JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf-8"))
      : [];
    const existingIds = new Set(existingProducts.map(p => p.id));

    // Fetch from Supabase
    const { products: supabaseProducts, categories, tags } = await fetchSupabaseData();

    // Find NEW products (not in local)
    const newProducts = supabaseProducts.filter(p => !existingIds.has(p.id));

    if (newProducts.length === 0) {
      return {
        success: true,
        message: "✅ Already up to date! No new products.",
        added: 0,
        total: existingProducts.length,
        existing: existingProducts.length,
      };
    }

    // Process images and files for new products
    console.log(`🎨 Processing ${newProducts.length} new products...`);
    for (const product of newProducts) {
      if (product.thumbnail) {
        product.thumbnail = await processImageField(product.thumbnail);
      }
      if (product.images && Array.isArray(product.images)) {
        product.images = await processImageField(product.images);
      }
      if (product.spec_images && Array.isArray(product.spec_images)) {
        product.spec_images = await processImageField(product.spec_images);
      }
      if (product.files && Array.isArray(product.files)) {
        product.files = await processFiles(product.files);
      }
    }

    // Merge: combine existing + new
    const mergedProducts = [...existingProducts, ...newProducts].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });

    // Prepare meta
    const timestamp = new Date().toISOString();
    const meta = {
      last_synced: timestamp,
      total_products: mergedProducts.length,
      new_products_added: newProducts.length,
      total_images_downloaded: statsDownloaded.images,
      total_files_downloaded: statsDownloaded.files,
    };

    // Ensure directories exist
    const dataDir = path.dirname(PRODUCTS_JSON);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

    // Write updated JSON files
    fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(mergedProducts, null, 2));
    fs.writeFileSync(CATEGORIES_JSON, JSON.stringify(categories, null, 2));
    fs.writeFileSync(TAGS_JSON, JSON.stringify(tags, null, 2));
    fs.writeFileSync(META_JSON, JSON.stringify(meta, null, 2));

    console.log("\n✅ Sync complete!\n");
    console.log(`✅ New products added: ${newProducts.length}`);
    console.log(`📦 Total products: ${mergedProducts.length}`);
    console.log(`🖼️  Images downloaded: ${statsDownloaded.images}`);
    console.log(`📄 Files downloaded: ${statsDownloaded.files}`);

    return {
      success: true,
      message: `✅ Sync complete! Added ${newProducts.length} new product(s).`,
      added: newProducts.length,
      total: mergedProducts.length,
      existing: existingProducts.length,
      imagesDownloaded: statsDownloaded.images,
      filesDownloaded: statsDownloaded.files,
      timestamp,
    };
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    return {
      success: false,
      message: `❌ Sync failed: ${err.message}`,
      error: err.message,
    };
  }
}
