#!/usr/bin/env node

/**
 * One-off: add three sand timers to the "Clocks & Timers" category, following
 * the same flow as add-sauna-grille-622-d.js (download source from sawo.com,
 * WEBP via sharp, upload to R2 as products/<slug>/<role>-<hash8>.webp, log in
 * media_upload_log, upsert the products row).
 *
 *   551-BH            Wooden Sandtimer Basic 65 x 340mm
 *   552-BD/BA/BH      Wooden Sandtimer Basic 45 x 300mm
 *   550-RD/RA/RH      Sand Timer 15min with Stone
 *
 * Run from this directory: node add-sandtimers-551-552-550r.js [--dry]
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
const DRY = process.argv.includes("--dry");

const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const U = "https://www.sawo.com/wp-content/uploads/2026/10/";
const T = "SAWO_sauna_accessories_timers_";

const PRODUCTS = [
  {
    name: "Wooden Sandtimer Basic 65 x 340mm", slug: "wooden-sandtimer-basic-65x340-551-bh",
    size: "65 x 340mm", thumb: U + T + "551.webp",
    variants: [{ code: "551-BH", color: "Hemlock", src: U + T + "551-P.webp" }],
  },
  {
    name: "Wooden Sandtimer Basic 45 x 300mm", slug: "wooden-sandtimer-basic-45x300-552-bd",
    size: "45 x 300mm", thumb: U + "552-B.png",
    variants: [
      { code: "552-BD", color: "Cedar", src: U + "552-BD.png" },
      { code: "552-BA", color: "Aspen", src: U + "552-BA.png" },
      { code: "552-BH", color: "Hemlock", src: U + "552-BH.png" },
    ],
  },
  {
    name: "Sand Timer 15min with Stone", slug: "sand-timer-15min-with-stone-550-rd",
    size: "65 x 340mm", thumb: U + "550-R.png",
    variants: [
      { code: "550-RD", color: "Cedar", src: U + T + "550-RD.webp" },
      { code: "550-RA", color: "Aspen", src: U + T + "550-RA.webp" },
      { code: "550-RH", color: "Hemlock", src: U + T + "550-RP.webp" },
    ],
  },
];

const hash8 = buf => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);

async function toWebp(srcUrl) {
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${srcUrl}`);
  const src = Buffer.from(await res.arrayBuffer());
  return sharp(src).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 }).toBuffer();
}

async function uploadRole(slug, webp, role, srcUrl) {
  const key = `products/${slug}/${role}-${hash8(webp)}.webp`;
  const url = `${R2_PUBLIC_BASE}${key}`;
  if (DRY) return url;
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: webp, ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  await supabase.from("media_upload_log").upsert({
    key, public_url: url, original_filename: path.basename(srcUrl),
    entity_prefix: "products", slug, role, ext: "webp",
    content_type: "image/webp", bytes: webp.length,
    source: "script:add-sandtimers-551-552-550r", uploaded_by_username: "claude-code",
  }, { onConflict: "key", ignoreDuplicates: true });
  return url;
}

async function main() {
  const { data: maxRow } = await supabase.from("products").select("sort_order")
    .contains("categories", ["Clocks & Timers"]).order("sort_order", { ascending: false }).limit(1).single();
  let sortOrder = (maxRow?.sort_order ?? -1) + 1;
  console.log(`${DRY ? "[DRY] " : ""}next sort_order: ${sortOrder}`);

  for (const p of PRODUCTS) {
    const thumbnail = await uploadRole(p.slug, await toWebp(p.thumb), "thumbnail", p.thumb);
    const variants = [];
    for (const v of p.variants) {
      const image = await uploadRole(p.slug, await toWebp(v.src), `variant-${v.code.toLowerCase()}`, v.src);
      variants.push({ code: v.code, color: v.color, image });
    }
    const row = {
      name: p.name, slug: p.slug, short_description: null, description: null,
      thumbnail, images: [], spec_images: [],
      categories: ["Clocks & Timers"], tags: [], features: [],
      brand: "SAWO", type: "Clocks & Timers",
      spec_table: { headers: ["Specification", "Detail"], rows: [["Size", p.size]] },
      resources: null, status: "published", visible: true, featured: false,
      sort_order: sortOrder++, variant_type: "material",
      created_by_username: "claude-code", updated_by_username: "claude-code",
      variants,
    };
    if (DRY) { console.log(JSON.stringify(row, null, 1)); continue; }
    const { data, error } = await supabase.from("products").upsert(row, { onConflict: "slug" }).select("id, slug, name");
    if (error) throw new Error(`Insert failed (${p.slug}): ${error.message}`);
    console.log("Inserted:", data[0]);
  }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
