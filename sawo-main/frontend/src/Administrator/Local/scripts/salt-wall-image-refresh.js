#!/usr/bin/env node

/**
 * SAWO — Himalayan Salt Wall group-image refresh (2026-09-24).
 *
 * Replaces the thumbnail (main image) of the four Himalayan Salt Wall
 * products with the new 3-finish group renders from sawo.com, the same way a
 * CMS image change does it:
 *   1. Upload the webp to R2 under the product's existing products/<folder>/
 *      as thumbnail-<sha1-hash8>.webp (content-hashed key).
 *   2. Update products.thumbnail on the live Supabase row.
 *   3. Log the new upload in media_upload_log.
 *   4. Soft-trash the OLD thumbnail (media_upload_log.trashed_at) instead of
 *      deleting it from R2 — mirrors mediaUpload.js trashMediaUrls, so the
 *      old image is restorable from the CMS Trash for 30 days.
 *
 * Run from this directory:
 *   node salt-wall-image-refresh.js --dry-run
 *   node salt-wall-image-refresh.js
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const DRY_RUN = process.argv.includes("--dry-run");

const SRC_DIR = "D:/temp/claude/d--NEW-SITES-REACT-SITE/306001b9-4fb7-4918-8732-4fcec0c87be1/scratchpad/salt";

// product slug -> source file (matched on the HIM-SWL code in the filename)
const MAP = [
  { slug: "himalayan-salt-wall-horizontal-tiles",       file: "HIM-SWL-375-1-G-copy.webp" },
  { slug: "himalayan-salt-wall-horizontal-tiles-large", file: "HIM-SWL-375-2-G-copy.webp" },
  { slug: "himalayan-salt-wall-vertical-tiles",         file: "HIM-SWL-275-1-V-G-copy.webp" },
  { slug: "himalayan-salt-wall-vertical-tiles-large",   file: "HIM-SWL-275-2-V-G-copy.webp" },
];

const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const hash8 = buf => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
const keyFromPublicUrl = url => (url && url.startsWith(R2_PUBLIC_BASE) ? url.slice(R2_PUBLIC_BASE.length) : null);

async function main() {
  console.log(`${DRY_RUN ? "DRY RUN — " : ""}${MAP.length} products\n`);
  for (const { slug, file } of MAP) {
    const buf = fs.readFileSync(path.join(SRC_DIR, file));

    const { data: product, error } = await supabase
      .from("products").select("id, thumbnail").eq("slug", slug).single();
    if (error || !product) throw new Error(`product row not found for ${slug}: ${error?.message || ""}`);

    const oldKey = keyFromPublicUrl(product.thumbnail);
    if (!oldKey) throw new Error(`${slug}: old thumbnail is not an R2 url: ${product.thumbnail}`);
    const folder = oldKey.split("/").slice(0, 2).join("/"); // products/<folder>
    const newKey = `${folder}/thumbnail-${hash8(buf)}.webp`;
    const newUrl = `${R2_PUBLIC_BASE}${newKey}`;

    console.log(`${slug}\n  ${file} (${buf.length}B)\n  old: ${oldKey}\n  new: ${newKey}`);
    if (DRY_RUN) continue;

    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: newKey, Body: buf, ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    const { error: updErr } = await supabase.from("products").update({ thumbnail: newUrl }).eq("id", product.id);
    if (updErr) throw new Error(`DB update failed for ${slug}: ${updErr.message}`);

    await supabase.from("media_upload_log").upsert({
      key: newKey, public_url: newUrl, original_filename: file,
      entity_prefix: "products", slug: folder.split("/")[1], role: "thumbnail", ext: "webp",
      content_type: "image/webp", bytes: buf.length,
      source: "script:salt-wall-image-refresh", uploaded_by_username: "claude-code",
    }, { onConflict: "key", ignoreDuplicates: true });

    if (oldKey !== newKey) {
      const nowIso = new Date().toISOString();
      const { data: existing } = await supabase.from("media_upload_log").select("id").eq("key", oldKey).maybeSingle();
      if (existing) {
        await supabase.from("media_upload_log").update({ trashed_at: nowIso, restored_at: null }).eq("id", existing.id);
      } else {
        await supabase.from("media_upload_log").insert({
          key: oldKey, public_url: product.thumbnail, entity_prefix: "products",
          slug: folder.split("/")[1], role: "thumbnail", ext: "webp",
          source: "trash-backfill", uploaded_by_username: "claude-code", trashed_at: nowIso,
        });
      }
    }
    console.log("  ✔ uploaded, DB updated, old thumbnail trashed");
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
