#!/usr/bin/env node
/**
 * Verifies the migrate-to-r2.js upload: object count/size parity against
 * the manifest, plus a checksum spot-check (50 random objects + all PDFs)
 * fetched back over the S3 API. Read-only — no writes.
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = process.env.R2_BUCKET || "sawo-media";
const MANIFEST_PATH = path.join(__dirname, "..", "data", "r2-manifest.jsonl");

async function listAllR2Objects() {
  const objects = new Map(); // key -> size
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token }));
    for (const obj of res.Contents || []) objects.set(obj.Key, obj.Size);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function main() {
  const manifestLines = fs.readFileSync(MANIFEST_PATH, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  const successEntries = manifestLines.filter(e => e.key && (e.status === "uploaded" || e.status === "skipped-exists" || e.status === "deduped-in-run"));
  const uniqueKeys = new Map();
  for (const e of successEntries) uniqueKeys.set(e.key, e);

  console.log(`Manifest: ${successEntries.length} successful entries, ${uniqueKeys.size} unique keys`);

  console.log("Listing R2 bucket contents...");
  const r2Objects = await listAllR2Objects();
  console.log(`R2 bucket "${BUCKET}": ${r2Objects.size} objects\n`);

  // ── Count/size parity ──
  let countOk = 0, missing = [], sizeMismatch = [];
  for (const [key, entry] of uniqueKeys) {
    if (!r2Objects.has(key)) { missing.push(key); continue; }
    const r2Size = r2Objects.get(key);
    if (r2Size !== entry.bytes) { sizeMismatch.push({ key, expected: entry.bytes, actual: r2Size }); continue; }
    countOk++;
  }
  console.log("COUNT/SIZE CHECK");
  console.log(`  ✓ ${countOk} / ${uniqueKeys.size} keys present with matching size`);
  if (missing.length) console.log(`  ✗ MISSING from R2: ${missing.length}\n    ${missing.slice(0, 10).join("\n    ")}`);
  if (sizeMismatch.length) console.log(`  ✗ SIZE MISMATCH: ${sizeMismatch.length}\n    ${JSON.stringify(sizeMismatch.slice(0, 10))}`);

  // ── Checksum spot-check: all PDFs + 50 random others ──
  const pdfEntries = [...uniqueKeys.values()].filter(e => e.contentType === "application/pdf");
  const others = [...uniqueKeys.values()].filter(e => e.contentType !== "application/pdf");
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 50);
  const toCheck = [...pdfEntries, ...shuffled];

  console.log(`\nCHECKSUM SPOT-CHECK (${pdfEntries.length} PDFs + ${shuffled.length} random)`);
  let hashOk = 0, hashFail = [];
  for (const entry of toCheck) {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: entry.key }));
      const buf = await streamToBuffer(res.Body);
      const h8 = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
      if (h8 === entry.hash8) hashOk++;
      else hashFail.push({ key: entry.key, expected: entry.hash8, actual: h8 });
    } catch (err) {
      hashFail.push({ key: entry.key, error: err.message });
    }
  }
  console.log(`  ✓ ${hashOk} / ${toCheck.length} checksums match`);
  if (hashFail.length) console.log(`  ✗ FAILURES:\n    ${JSON.stringify(hashFail, null, 2)}`);

  // ── Orphan assertion: all 3 attributed + 15 unassigned orphans present ──
  const orphanEntries = successEntries.filter(e => e.role === "orphan" || e.entityPrefix === "_unassigned");
  console.log(`\nORPHAN CHECK: ${orphanEntries.length} orphan-origin objects uploaded (expected 18: 3 attributed + 15 unassigned)`);

  console.log("\n" + (missing.length === 0 && sizeMismatch.length === 0 && hashFail.length === 0
    ? "✅ VERIFICATION PASSED — zero missing, zero size mismatches, zero checksum failures."
    : "❌ VERIFICATION FOUND ISSUES — see above."));
}

main().catch(err => { console.error("❌ Verification failed:", err); process.exit(1); });
