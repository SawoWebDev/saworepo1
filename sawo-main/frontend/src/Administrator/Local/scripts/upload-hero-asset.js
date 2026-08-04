// One-off helper: upload a compressed static site asset (hero images etc.,
// not CMS-managed product/room media) to the R2 bucket under `site-assets/`.
// Usage: node upload-hero-asset.js <local-file-path> <key-name-without-ext>
import "dotenv/config";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const [, , filePath, keyName] = process.argv;
if (!filePath || !keyName) {
  console.error("Usage: node upload-hero-asset.js <local-file-path> <key-name-without-ext>");
  process.exit(1);
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "sawo-media";
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "https://saworepo1.pages.dev/media/").replace(/\/?$/, "/");

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in .env");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const buf = fs.readFileSync(filePath);
const hash8 = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
const ext = path.extname(filePath) || ".webp";
const key = `site-assets/${keyName}-${hash8}${ext}`;

await s3.send(new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: key,
  Body: buf,
  ContentType: "image/webp",
  CacheControl: "public, max-age=31536000, immutable",
}));

console.log("Uploaded:", `${R2_PUBLIC_BASE}${key}`);
console.log("Size:", buf.length, "bytes");
