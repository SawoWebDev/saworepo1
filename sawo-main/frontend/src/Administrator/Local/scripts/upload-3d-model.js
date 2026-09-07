// One-off helper: upload a .glb 3D model asset to the R2 bucket under
// `3d-models/`, for use with sauna_rooms.model_3d_url (see
// src/pages/ThreeDViewer.jsx). Same idiom as upload-hero-asset.js, just a
// different content type / key prefix.
// Usage: node upload-3d-model.js <local-file-path> <key-name-without-ext>
import "dotenv/config";
import fs from "node:fs";
import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const [, , filePath, keyName] = process.argv;
if (!filePath || !keyName) {
  console.error("Usage: node upload-3d-model.js <local-file-path> <key-name-without-ext>");
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
const key = `3d-models/${keyName}-${hash8}.glb`;

await s3.send(new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: key,
  Body: buf,
  ContentType: "model/gltf-binary",
  CacheControl: "public, max-age=31536000, immutable",
}));

const publicUrl = `${R2_PUBLIC_BASE}${key}`;
console.log("Uploaded:", publicUrl);
console.log("Size:", buf.length, "bytes");
console.log("");
console.log("Next: point the room's model_3d_url at this URL, e.g.:");
console.log(
  `  update sauna_rooms set model_3d_url = '${publicUrl}' where slug = 'glass-front-sauna-room-1414';`
);
