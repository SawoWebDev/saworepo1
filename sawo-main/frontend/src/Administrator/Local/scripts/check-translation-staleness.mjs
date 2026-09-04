#!/usr/bin/env node
/**
 * check-translation-staleness.mjs — finds products whose product_translations
 * row for a locale is either missing entirely or stale (English source
 * changed since that field was last translated, per source_field_hashes).
 *
 * Complements product-i18n.js's `pending` (which only catches "no row at
 * all") — this also catches "row exists but source moved on since."
 *
 * Usage:
 *   node check-translation-staleness.mjs <locale>   (defaults to zh)
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { computeSourceFieldHashes } from "./product-i18n-fields.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, "..", "..", "..", "..");
dotenv.config({ path: path.join(FRONTEND_DIR, ".env") });
dotenv.config({ path: path.join(FRONTEND_DIR, ".env.local") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LOCALE = process.argv[2] || "zh";

(async () => {
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("*")
    .eq("is_deleted", false);
  if (pErr) throw pErr;

  const { data: translations, error: tErr } = await supabase
    .from("product_translations")
    .select("product_id, source_field_hashes")
    .eq("locale", LOCALE);
  if (tErr) throw tErr;

  const trMap = new Map(translations.map((t) => [t.product_id, t.source_field_hashes || {}]));

  let staleCount = 0;
  let missingCount = 0;
  const staleSlugs = [];
  const missingSlugs = [];

  for (const product of products) {
    const storedHashes = trMap.get(product.id);
    if (!storedHashes) {
      missingCount++;
      missingSlugs.push(product.slug);
      continue;
    }
    const currentHashes = computeSourceFieldHashes(product, null);
    const diffs = [];
    for (const [pathKey, hash] of Object.entries(currentHashes)) {
      if (storedHashes[pathKey] !== undefined && storedHashes[pathKey] !== hash) {
        diffs.push(pathKey);
      }
    }
    if (diffs.length) {
      staleCount++;
      staleSlugs.push({ slug: product.slug, diffs });
    }
  }

  console.log(`Checked ${products.length} products for locale=${LOCALE}`);
  console.log(`Missing translation row entirely: ${missingCount}`);
  if (missingSlugs.length) console.log(missingSlugs.join(", "));
  console.log(`Stale (source changed since translation): ${staleCount}`);
  for (const s of staleSlugs) console.log(` - ${s.slug}: ${s.diffs.join(", ")}`);
})();
