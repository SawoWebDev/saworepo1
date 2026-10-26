#!/usr/bin/env node
// One-off: replace the 551-BH thumbnail + variant image with 551-BH.png
// (same upload flow as add-sandtimers-551-552-550r.js). Run: node fix-sandtimer-551-bh-image.js
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
const BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const s3 = new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });

const SRC = "https://www.sawo.com/wp-content/uploads/2026/10/551-BH.png";
const SLUG = "wooden-sandtimer-basic-65x340-551-bh";

const res = await fetch(SRC);
if (!res.ok) throw new Error(`Download failed ${res.status}`);
const webp = await sharp(Buffer.from(await res.arrayBuffer()))
  .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();

async function up(role) {
  const key = `products/${SLUG}/${role}-${crypto.createHash("sha1").update(webp).digest("hex").slice(0, 8)}.webp`;
  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: webp, ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable" }));
  await supabase.from("media_upload_log").upsert({ key, public_url: BASE + key, original_filename: "551-BH.png",
    entity_prefix: "products", slug: SLUG, role, ext: "webp", content_type: "image/webp", bytes: webp.length,
    source: "script:fix-sandtimer-551-bh-image", uploaded_by_username: "claude-code" }, { onConflict: "key", ignoreDuplicates: true });
  return BASE + key;
}
const thumbnail = await up("thumbnail");
const variantUrl = await up("variant-551-bh");
const { data, error } = await supabase.from("products")
  .update({ thumbnail, variants: [{ code: "551-BH", color: "Hemlock", image: variantUrl }], updated_by_username: "claude-code" })
  .eq("slug", SLUG).select("slug, thumbnail, variants");
if (error) throw error;
console.log(JSON.stringify(data, null, 1));
