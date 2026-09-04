#!/usr/bin/env node

/**
 * One-off: add the "Sauna Grille" (622-D, Cedar) product to the
 * Ventilation & Miscellaneous accessory category.
 *
 * Downloads the source PNG from sawo.com, converts to WEBP (sharp, same
 * settings as heater-image-refresh.js), uploads to R2 under
 * products/<slug>/{thumbnail,variant-622-d}-<hash8>.webp, logs both objects
 * in media_upload_log, and inserts the product row into `products`.
 *
 * Run from this directory: node add-sauna-grille-622-d.js
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");

const SOURCE_URL = "https://www.sawo.com/wp-content/uploads/2026/09/622-D-scaled.png";
const SLUG = "sauna-grille-622-d";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function hash8(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
}

async function uploadRole(webpBuf, role, originalFilename) {
  const h = hash8(webpBuf);
  const key = `products/${SLUG}/${role}-${h}.webp`;
  const url = `${R2_PUBLIC_BASE}${key}`;

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: webpBuf, ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  await supabase.from("media_upload_log").upsert({
    key, public_url: url, original_filename: originalFilename,
    entity_prefix: "products", slug: SLUG, role, ext: "webp",
    content_type: "image/webp", bytes: webpBuf.length,
    source: "script:add-sauna-grille-622-d", uploaded_by_username: "claude-code",
  }, { onConflict: "key", ignoreDuplicates: true });

  return url;
}

async function main() {
  console.log(`Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const srcBuf = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${srcBuf.length} bytes`);

  const webpBuf = await sharp(srcBuf)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  console.log(`Converted to WEBP: ${webpBuf.length} bytes`);

  const originalFilename = path.basename(SOURCE_URL);
  const thumbnailUrl = await uploadRole(webpBuf, "thumbnail", originalFilename);
  const variantUrl = await uploadRole(webpBuf, "variant-622-d", originalFilename);
  console.log(`Uploaded thumbnail: ${thumbnailUrl}`);
  console.log(`Uploaded variant:   ${variantUrl}`);

  const { data: maxRow } = await supabase
    .from("products")
    .select("sort_order")
    .contains("categories", ["Ventilation & Miscellaneous"])
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const product = {
    name: "Sauna Grille",
    slug: SLUG,
    short_description: null,
    description: null,
    thumbnail: thumbnailUrl,
    images: [],
    spec_images: [],
    categories: ["Ventilation & Miscellaneous"],
    tags: ["Ventilation", "Grille"],
    features: [],
    brand: "SAWO",
    type: "Ventilation & Miscellaneous",
    spec_table: {
      headers: ["Specification", "Detail"],
      rows: [["Size", "140 x 280mm"]],
    },
    resources: null,
    status: "published",
    visible: true,
    featured: false,
    sort_order: sortOrder,
    created_by_username: "claude-code",
    updated_by_username: "claude-code",
    variants: [
      { code: "622-D", color: "Cedar", image: variantUrl },
    ],
  };

  const { data, error } = await supabase
    .from("products")
    .upsert(product, { onConflict: "slug" })
    .select("id, slug, name");

  if (error) throw new Error(`Insert failed: ${error.message}`);
  console.log(`\nInserted product:`, data[0]);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
