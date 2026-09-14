#!/usr/bin/env node

/**
 * One-off: add "SAWO Sauna Wood Oil" 1L and 4L to the Ventilation &
 * Miscellaneous category (two separate product rows, one per size — same
 * pattern as add-sauna-grille-622-d.js).
 *
 * Downloads the source PNGs from sawo.com, converts to WEBP, uploads to R2
 * under products/<slug>/thumbnail-<hash8>.webp, logs in media_upload_log,
 * and inserts the product rows into `products`.
 *
 * Run from this directory: node add-sauna-wood-oil.js
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

const CATEGORY = "Ventilation & Miscellaneous";
const SHORT_DESC =
  "The SAWO Sauna Wood Oil is a cosmetic grade oil suitable for all wood. Treatment is designed to shield wooden surfaces from humidity and dirt. It prevents moisture absorption, significantly extending the lifespan of your sauna.";

const ITEMS = [
  {
    sourceUrl: "https://www.sawo.com/wp-content/uploads/2026/09/WO-MIN-1L.png",
    slug: "sauna-wood-oil-1l",
    name: "SAWO Sauna Wood Oil 1L",
    code: "WO-MIN-1L",
    size: "1L",
  },
  {
    sourceUrl: "https://www.sawo.com/wp-content/uploads/2026/09/WO-MIN-4L.png",
    slug: "sauna-wood-oil-4l",
    name: "SAWO Sauna Wood Oil 4L",
    code: "WO-MIN-4L",
    size: "4L",
  },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function hash8(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
}

async function uploadThumbnail(slug, webpBuf, originalFilename) {
  const h = hash8(webpBuf);
  const key = `products/${slug}/thumbnail-${h}.webp`;
  const url = `${R2_PUBLIC_BASE}${key}`;

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: webpBuf, ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  await supabase.from("media_upload_log").upsert({
    key, public_url: url, original_filename: originalFilename,
    entity_prefix: "products", slug, role: "thumbnail", ext: "webp",
    content_type: "image/webp", bytes: webpBuf.length,
    source: "script:add-sauna-wood-oil", uploaded_by_username: "claude-code",
  }, { onConflict: "key", ignoreDuplicates: true });

  return url;
}

async function main() {
  const { data: maxRow } = await supabase
    .from("products")
    .select("sort_order")
    .contains("categories", [CATEGORY])
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  let sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const inserted = [];

  for (const item of ITEMS) {
    console.log(`\nDownloading ${item.sourceUrl} ...`);
    const res = await fetch(item.sourceUrl);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    const srcBuf = Buffer.from(await res.arrayBuffer());
    console.log(`Downloaded ${srcBuf.length} bytes`);

    const webpBuf = await sharp(srcBuf)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    console.log(`Converted to WEBP: ${webpBuf.length} bytes`);

    const originalFilename = path.basename(item.sourceUrl);
    const thumbnailUrl = await uploadThumbnail(item.slug, webpBuf, originalFilename);
    console.log(`Uploaded thumbnail: ${thumbnailUrl}`);

    const product = {
      name: item.name,
      slug: item.slug,
      short_description: SHORT_DESC,
      description: null,
      thumbnail: thumbnailUrl,
      images: [],
      spec_images: [],
      categories: [CATEGORY],
      tags: ["Wood Oil", "Maintenance"],
      features: [],
      brand: "SAWO",
      type: CATEGORY,
      spec_table: {
        headers: ["Specification", "Detail"],
        rows: [["Size", item.size], ["Code", item.code]],
      },
      resources: null,
      status: "published",
      visible: true,
      featured: false,
      sort_order: sortOrder++,
      created_by_username: "claude-code",
      updated_by_username: "claude-code",
      variants: [],
    };

    const { data, error } = await supabase
      .from("products")
      .upsert(product, { onConflict: "slug" })
      .select("id, slug, name");

    if (error) throw new Error(`Insert failed for ${item.slug}: ${error.message}`);
    console.log(`Inserted product:`, data[0]);
    inserted.push(data[0]);
  }

  console.log("\nDone:", inserted);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
