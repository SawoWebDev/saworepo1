#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Check .env file.");
  console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const DATA_DIR = path.join(__dirname, "..", "data");
const IMAGES_DIR = path.join(__dirname, "../../../../../../../saworepo2");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let statsDownloaded = { images: 0, files: 0 };

// ── Fetch Products ────────────────────────────────────────────────────────────
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

// ── Fetch Categories ──────────────────────────────────────────────────────────
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

// ── Fetch Tags ────────────────────────────────────────────────────────────────
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

// ── Download and process images ────────────────────────────────────────────────
async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.buffer();
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (err) {
    console.warn(`⚠️  Failed to download ${url}: ${err.message}`);
    return false;
  }
}

// ── Process image field (thumbnail, images[], spec_images[]) ────────────────────
async function processImageField(value, productSlug, bucket = "product-images") {
  if (!value) return value;

  // Handle array
  if (Array.isArray(value)) {
    const results = [];
    for (const item of value) {
      const processed = await processImageField(item, productSlug, bucket);
      results.push(processed);
    }
    return results;
  }

  // Already a relative path, keep as-is
  if (!value.includes("http") && !value.includes("://")) {
    return value;
  }

  // It's already a full URL, extract the filename and path
  const filename = path.basename(value);
  let downloadUrl = value;

  // If it's already a full Supabase URL, use it as-is
  if (value.includes(SUPABASE_URL)) {
    downloadUrl = value;
  } else {
    // If it's just a path, build the full URL
    downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${value}`;
  }

  const outputPath = path.join(IMAGES_DIR, productSlug, filename);

  const success = await downloadImage(downloadUrl, outputPath);
  if (success) {
    statsDownloaded.images++;
    return `${productSlug}/${filename}`;
  }

  // If download fails, return original path
  return value;
}

// ── Process files field ────────────────────────────────────────────────────────
async function processFiles(filesArray, productSlug) {
  if (!filesArray || !Array.isArray(filesArray)) return filesArray;

  const processed = [];
  for (const file of filesArray) {
    if (typeof file === "object" && file.path) {
      const filename = path.basename(file.path);
      const downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/product-pdf/${file.path}`;
      const outputPath = path.join(IMAGES_DIR, productSlug, "files", filename);

      const success = await downloadImage(downloadUrl, outputPath);
      if (success) {
        statsDownloaded.files++;
        processed.push({ ...file, path: `${productSlug}/files/${filename}` });
      } else {
        processed.push(file);
      }
    } else {
      processed.push(file);
    }
  }
  return processed;
}

// ── Main sync function ─────────────────────────────────────────────────────────
async function sync() {
  try {
    console.log("🚀 Starting sync...\n");

    const [products, categories, tags] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchTags(),
    ]);

    // Process product images and files
    console.log("🎨 Processing images and files...");
    const processedProducts = [];
    for (const product of products) {
      const slug = product.slug;

      // Process thumbnail
      if (product.thumbnail) {
        product.thumbnail = await processImageField(product.thumbnail, slug);
      }

      // Process images array
      if (product.images && Array.isArray(product.images)) {
        product.images = await processImageField(product.images, slug);
      }

      // Process spec_images array
      if (product.spec_images && Array.isArray(product.spec_images)) {
        product.spec_images = await processImageField(product.spec_images, slug);
      }

      // Process files
      if (product.files && Array.isArray(product.files)) {
        product.files = await processFiles(product.files, slug);
      }

      processedProducts.push(product);
    }

    // Write JSON files
    const timestamp = new Date().toISOString();
    const meta = {
      last_synced: timestamp,
      total_products: products.length,
      total_images_downloaded: statsDownloaded.images,
      total_files_downloaded: statsDownloaded.files,
    };

    fs.writeFileSync(
      path.join(DATA_DIR, "products.json"),
      JSON.stringify(processedProducts, null, 2)
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

    // Log summary
    console.log("\n✅ Sync complete!\n");
    console.log(`✅ Products synced: ${products.length}`);
    console.log(`🖼️  Images downloaded: ${statsDownloaded.images}`);
    console.log(`📄 Files downloaded: ${statsDownloaded.files}`);
    console.log(`⏱️  Last synced: ${timestamp}\n`);
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

sync();
