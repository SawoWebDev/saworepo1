#!/usr/bin/env node

/**
 * SAWO — Pail Shower image refresh (2026-10-07).
 *
 * Replaces the thumbnail (main image) and all three variant/variation
 * images (Cedar 393-D, Hemlock 393-H, Black 393-BL) of the Pail Shower
 * product with new renders from sawo.com, the same way a CMS image change
 * does it:
 *   1. Upload each webp to R2 under the product's existing
 *      products/pail-shower-393-d/ folder as <role>-<sha1-hash8>.webp
 *      (content-hashed key).
 *   2. Update products.thumbnail / variants[].image / variations[].image
 *      on the live Supabase row.
 *   3. Log each new upload in media_upload_log.
 *   4. Soft-trash the OLD images (media_upload_log.trashed_at) instead of
 *      deleting them from R2 — mirrors mediaUpload.js trashMediaUrls, so
 *      the old images are restorable from the CMS Trash for 30 days.
 *
 * Run from this directory:
 *   node pail-shower-image-refresh.js --dry-run
 *   node pail-shower-image-refresh.js
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

const SLUG = "pail-shower";
const SRC_DIR = "D:/temp/claude/d--NEW-SITES-REACT-SITE/1a5e4d92-e748-4bac-931c-c62026027534/scratchpad/pail-shower";

// role -> source file. "thumbnail" updates products.thumbnail; the others
// match variants[].code / variations[].code (case-insensitive) and update
// both arrays' .image field.
const MAP = [
  { role: "thumbnail", code: null,      file: "SAWO_sauna_accessories_pail_shower_new.webp" },
  { role: "variant",   code: "393-BL",  file: "SAWO_sauna_accessories_pail_shower_black.webp" },
  { role: "variant",   code: "393-D",   file: "SAWO_sauna_accessories_pail_shower_cedar.webp" },
  { role: "variant",   code: "393-H",   file: "SAWO_sauna_accessories_pail_shower_hemlock.webp" },
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

async function trashOldKey(oldKey, oldUrl, folder, role) {
  if (!oldKey) return;
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase.from("media_upload_log").select("id").eq("key", oldKey).maybeSingle();
  if (existing) {
    await supabase.from("media_upload_log").update({ trashed_at: nowIso, restored_at: null }).eq("id", existing.id);
  } else {
    await supabase.from("media_upload_log").insert({
      key: oldKey, public_url: oldUrl, entity_prefix: "products",
      slug: folder.split("/")[1], role, ext: "webp",
      source: "trash-backfill", uploaded_by_username: "claude-code", trashed_at: nowIso,
    });
  }
}

async function main() {
  console.log(`${DRY_RUN ? "DRY RUN — " : ""}pail-shower: ${MAP.length} images\n`);

  const { data: product, error } = await supabase
    .from("products").select("id, thumbnail, variants, variations").eq("slug", SLUG).single();
  if (error || !product) throw new Error(`product row not found for ${SLUG}: ${error?.message || ""}`);

  const oldThumbKey = keyFromPublicUrl(product.thumbnail);
  if (!oldThumbKey) throw new Error(`${SLUG}: thumbnail is not an R2 url: ${product.thumbnail}`);
  const folder = oldThumbKey.split("/").slice(0, 2).join("/"); // products/pail-shower-393-d

  let newThumbnail = product.thumbnail;
  const variants = JSON.parse(JSON.stringify(product.variants || []));
  const variations = JSON.parse(JSON.stringify(product.variations || []));
  const trash = []; // { oldKey, oldUrl, role }

  for (const { role, code, file } of MAP) {
    const buf = fs.readFileSync(path.join(SRC_DIR, file));
    const newBase = role === "thumbnail" ? "thumbnail" : `variant-${code.toLowerCase()}`;
    const newKey = `${folder}/${newBase}-${hash8(buf)}.webp`;
    const newUrl = `${R2_PUBLIC_BASE}${newKey}`;

    if (role === "thumbnail") {
      const oldUrl = product.thumbnail;
      const oldKey = keyFromPublicUrl(oldUrl);
      console.log(`thumbnail\n  ${file} (${buf.length}B)\n  old: ${oldKey}\n  new: ${newKey}`);
      if (!DRY_RUN) {
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET, Key: newKey, Body: buf, ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }));
        await supabase.from("media_upload_log").upsert({
          key: newKey, public_url: newUrl, original_filename: file,
          entity_prefix: "products", slug: folder.split("/")[1], role: "thumbnail", ext: "webp",
          content_type: "image/webp", bytes: buf.length,
          source: "script:pail-shower-image-refresh", uploaded_by_username: "claude-code",
        }, { onConflict: "key", ignoreDuplicates: true });
      }
      newThumbnail = newUrl;
      if (oldKey && oldKey !== newKey) trash.push({ oldKey, oldUrl, role: "thumbnail" });
      continue;
    }

    const variant = variants.find(v => (v.code || "").toUpperCase() === code.toUpperCase());
    const variation = variations.find(v => (v.code || "").toUpperCase() === code.toUpperCase());
    if (!variant || !variation) throw new Error(`no variant/variation entry for code ${code}`);

    const oldUrl = variant.image;
    const oldKey = keyFromPublicUrl(oldUrl);
    console.log(`variant ${code}\n  ${file} (${buf.length}B)\n  old: ${oldKey}\n  new: ${newKey}`);

    if (!DRY_RUN) {
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET, Key: newKey, Body: buf, ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      await supabase.from("media_upload_log").upsert({
        key: newKey, public_url: newUrl, original_filename: file,
        entity_prefix: "products", slug: folder.split("/")[1], role: newBase, ext: "webp",
        content_type: "image/webp", bytes: buf.length,
        source: "script:pail-shower-image-refresh", uploaded_by_username: "claude-code",
      }, { onConflict: "key", ignoreDuplicates: true });
    }

    variant.image = newUrl;
    variation.image = newUrl;
    if (oldKey && oldKey !== newKey) trash.push({ oldKey, oldUrl, role: newBase });
  }

  if (DRY_RUN) {
    console.log("\nDry run — no uploads, no DB writes, no trashing happened.");
    return;
  }

  const { error: updErr } = await supabase
    .from("products")
    .update({ thumbnail: newThumbnail, variants, variations })
    .eq("id", product.id);
  if (updErr) throw new Error(`DB update failed for ${SLUG}: ${updErr.message}`);

  for (const { oldKey, oldUrl, role } of trash) {
    await trashOldKey(oldKey, oldUrl, folder, role);
  }

  console.log("\n✔ uploaded, DB updated, old images trashed");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
