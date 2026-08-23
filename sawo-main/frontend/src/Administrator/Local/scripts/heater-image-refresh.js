#!/usr/bin/env node

/**
 * SAWO — heater main-image refresh.
 *
 * For each product in heater_image_map.json:
 *   1. Convert the matched local PNG -> WEBP (sharp, quality 82, capped at
 *      1600px on the long edge — plenty for a product main image, keeps
 *      file size light).
 *   2. Upload to R2 under products/<slug>/thumbnail-<hash8>.webp
 *      (content-hashed key, same convention as migrate-to-r2.js).
 *   3. Update the product's `thumbnail` column in Supabase.
 *   4. Delete the OLD R2 object the row pointed at before the update.
 *   5. Delete the local source PNG.
 *
 * Run from this directory:
 *   node heater-image-refresh.js --dry-run   # convert+size-check only, no upload/DB/delete
 *   node heater-image-refresh.js             # live run
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const DRY_RUN = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");

const HEATERS_IMG_ROOT = path.join(__dirname, "..", "..", "..", "..", "..", "..", "..", "HEATERS IMG");
const MAP_PATH = "C:/Users/WEB.WEB-DEVPC1/AppData/Local/Temp/claude/d--NEW-SITES-REACT-SITE/bba49f5c-269d-4c8c-95ec-a9a5e0317546/scratchpad/heater_image_map.json";
const LOG_PATH = path.join(__dirname, "..", "data", "heater-image-refresh-log.json");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function hash8(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
}

function keyFromPublicUrl(url) {
  if (!url || !url.startsWith(R2_PUBLIC_BASE)) return null;
  return url.slice(R2_PUBLIC_BASE.length);
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  console.log(`${DRY_RUN ? "DRY RUN — " : ""}${map.length} products to process\n`);

  const results = [];
  let ok = 0, failed = 0;

  for (const { slug, file } of map) {
    const srcPath = path.join(HEATERS_IMG_ROOT, file);
    const row = { slug, file, status: "pending" };

    try {
      if (!fs.existsSync(srcPath)) throw new Error(`local file not found: ${srcPath}`);

      const { data: product, error: fetchErr } = await supabase
        .from("products").select("id, thumbnail").eq("slug", slug).single();
      if (fetchErr || !product) throw new Error(`product row not found for slug ${slug}: ${fetchErr?.message || ""}`);

      const oldThumbnail = product.thumbnail;
      const oldKey = keyFromPublicUrl(oldThumbnail);

      const webpBuf = await sharp(srcPath)
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const h = hash8(webpBuf);
      const newKey = `products/${slug}/thumbnail-${h}.webp`;
      const newUrl = `${R2_PUBLIC_BASE}${newKey}`;

      const srcStat = fs.statSync(srcPath);
      row.sourceBytes = srcStat.size;
      row.webpBytes = webpBuf.length;
      row.oldThumbnail = oldThumbnail;
      row.newThumbnail = newUrl;

      if (!DRY_RUN) {
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET, Key: newKey, Body: webpBuf, ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }));

        const { error: updateErr } = await supabase
          .from("products").update({ thumbnail: newUrl }).eq("id", product.id);
        if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

        await supabase.from("media_upload_log").upsert({
          key: newKey, public_url: newUrl, original_filename: path.basename(file),
          entity_prefix: "products", slug, role: "thumbnail", ext: "webp",
          content_type: "image/webp", bytes: webpBuf.length,
          source: "script:heater-image-refresh", uploaded_by_username: "claude-code",
        }, { onConflict: "key", ignoreDuplicates: true });

        if (oldKey && oldKey !== newKey) {
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldKey }));
            row.oldDeleted = true;
          } catch (e) {
            row.oldDeleted = false;
            row.oldDeleteError = e.message;
          }
        } else {
          row.oldDeleted = "skipped (no old key or same key)";
        }

        fs.unlinkSync(srcPath);
        row.localDeleted = true;
      }

      row.status = "ok";
      ok++;
      console.log(`✔ ${slug}  ${row.sourceBytes}B PNG -> ${row.webpBytes}B WEBP`);
    } catch (err) {
      row.status = "failed";
      row.error = err.message;
      failed++;
      console.error(`✘ ${slug}: ${err.message}`);
    }

    results.push(row);
  }

  fs.writeFileSync(LOG_PATH, JSON.stringify(results, null, 2));
  console.log(`\n${ok} ok, ${failed} failed. Log: ${LOG_PATH}`);
  if (DRY_RUN) console.log("Dry run — no uploads, no DB writes, no deletes happened.");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
