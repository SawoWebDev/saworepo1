#!/usr/bin/env node

/**
 * One-time backfill of media_upload_log for the 119 heater thumbnails
 * uploaded by heater-image-refresh.js before media_upload_log existed.
 * Reads data/heater-image-refresh-log.json and inserts one row per
 * successful upload, with original_filename = the local source PNG's
 * basename (the thing that would otherwise be unrecoverable once the R2
 * key is hashed).
 *
 * Run from this directory: node backfill-media-upload-log.js
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const LOG_PATH = path.join(__dirname, "..", "data", "heater-image-refresh-log.json");
const R2_PUBLIC_BASE = "https://saworepo1.pages.dev/media/";

function keyFromUrl(url) {
  return url.startsWith(R2_PUBLIC_BASE) ? url.slice(R2_PUBLIC_BASE.length) : null;
}

async function main() {
  const entries = JSON.parse(fs.readFileSync(LOG_PATH, "utf8")).filter(r => r.status === "ok");
  console.log(`${entries.length} successful uploads to backfill`);

  const rows = entries.map(r => {
    const key = keyFromUrl(r.newThumbnail);
    return {
      key,
      public_url: r.newThumbnail,
      original_filename: path.basename(r.file),
      entity_prefix: "products",
      slug: r.slug,
      role: "thumbnail",
      ext: "webp",
      content_type: "image/webp",
      bytes: r.webpBytes,
      source: "script:heater-image-refresh",
      uploaded_by_username: "claude-code",
    };
  }).filter(r => r.key);

  const { data, error } = await supabase
    .from("media_upload_log")
    .upsert(rows, { onConflict: "key", ignoreDuplicates: true })
    .select("key");

  if (error) throw error;
  console.log(`Inserted/confirmed ${data.length} rows in media_upload_log`);
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
