#!/usr/bin/env node

/**
 * Upload ladle product images to Supabase storage
 * and insert product records into the products table
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env variables (from frontend directory)
dotenv.config({ path: path.join(__dirname, "../../../../.env.local") });
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing env vars: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Image source directory (from scripts folder, go up 6 levels to git-sawo root, then into saworepo2)
const IMAGES_DIR = path.join(__dirname, "../../../../../../", "saworepo2", "images");
const PRODUCTS_JSON = path.join(__dirname, "../data/products.json");

// Supabase storage bucket and path
const BUCKET = "product-images";
const STORAGE_PATH_PREFIX = "products/2026/05";

/**
 * Upload a single image to Supabase and return the public URL
 */
async function uploadImage(filename) {
  const localPath = path.join(IMAGES_DIR, filename);

  if (!fs.existsSync(localPath)) {
    console.warn(`  ⚠ File not found: ${filename}`);
    return null;
  }

  const storagePath = `${STORAGE_PATH_PREFIX}/${filename}`;
  const buffer = fs.readFileSync(localPath);

  try {
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: "image/webp",
      upsert: true,
    });

    if (error) {
      console.warn(`  ⚠ Upload error for ${filename}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (err) {
    console.warn(`  ⚠ Exception uploading ${filename}: ${err.message}`);
    return null;
  }
}

/**
 * Convert local image path to Supabase URL
 */
async function convertImagePath(localPath) {
  if (!localPath) return null;
  if (localPath.includes("://")) return localPath; // already a URL

  const filename = path.basename(localPath);
  return await uploadImage(filename);
}

/**
 * Main upload + insert flow
 */
async function main() {
  console.log("🚀 Starting ladle product upload to Supabase...\n");

  // Read products.json (strip BOM if present)
  const productsContent = fs.readFileSync(PRODUCTS_JSON, "utf-8").replace(/^﻿/, "");
  const productsData = JSON.parse(productsContent);
  const allLadles = productsData.slice(-15); // Last 15 products are the ladles

  console.log(`📦 Found ${allLadles.length} ladle products to upload`);
  console.log("📤 Uploading images...\n");

  // Track image uploads (to avoid uploading the same file twice)
  const uploadedUrls = {};

  // Step 1: Upload all images and collect URLs
  for (const product of allLadles) {
    console.log(`  Uploading images for: ${product.name}`);

    // Upload thumbnail
    if (product.thumbnail && !product.thumbnail.includes("://")) {
      const filename = path.basename(product.thumbnail);
      if (!uploadedUrls[filename]) {
        uploadedUrls[filename] = await uploadImage(filename);
      }
      product.thumbnail = uploadedUrls[filename];
    }

    // Upload images array
    if (Array.isArray(product.images)) {
      product.images = await Promise.all(
        product.images.map(async (imgPath) => {
          if (!imgPath || imgPath.includes("://")) return imgPath;
          const filename = path.basename(imgPath);
          if (!uploadedUrls[filename]) {
            uploadedUrls[filename] = await uploadImage(filename);
          }
          return uploadedUrls[filename];
        })
      );
      product.images = product.images.filter(Boolean);
    }

    // Upload spec_images array
    if (Array.isArray(product.spec_images)) {
      product.spec_images = await Promise.all(
        product.spec_images.map(async (imgPath) => {
          if (!imgPath || imgPath.includes("://")) return imgPath;
          const filename = path.basename(imgPath);
          if (!uploadedUrls[filename]) {
            uploadedUrls[filename] = await uploadImage(filename);
          }
          return uploadedUrls[filename];
        })
      );
      product.spec_images = product.spec_images.filter(Boolean);
    }
  }

  console.log(`\n✅ Images uploaded. Total URLs cached: ${Object.keys(uploadedUrls).length}\n`);

  // Step 2: Insert/upsert products into Supabase
  console.log("📝 Inserting products into Supabase...\n");

  const { data, error } = await supabase
    .from("products")
    .upsert(allLadles, { onConflict: "slug" })
    .select("id, slug, name");

  if (error) {
    console.error("❌ Error upserting products:", error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully upserted ${data?.length || 0} products:\n`);
  data?.forEach((p) => {
    console.log(`  ✓ ${p.name} (${p.slug})`);
  });

  console.log("\n🎉 Upload complete!");
  console.log(`\nTo verify in Products.jsx:`);
  console.log(`  1. Switch dataSource to "live"`);
  console.log(`  2. All 15 ladle products should appear with images and descriptions`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
