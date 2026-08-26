#!/usr/bin/env node
/**
 * backfill-source-hashes.js — one-off migration for existing
 * product_translations rows created before source_field_hashes existed.
 *
 * For every row where source_field_hashes IS NULL: walk all current
 * translatable fields on the English product, hash each one, and write
 * that as the row's baseline — for BOTH filled and null translated fields.
 *
 * Baseline assumption (confirmed with the user before running this):
 * today's translations are treated as CURRENT as of today, not
 * retroactively flagged stale. There is no historical record of whether a
 * pre-existing null field was a deliberate "use English" choice or simply
 * never looked at — per README-i18n.md's i18n gotchas, guessing which is
 * worse than picking the least-disruptive default and letting real drift
 * get caught the next time that English content is actually edited.
 *
 * DRY RUN BY DEFAULT. Prints exactly what it would write, writes nothing,
 * unless --apply is passed. This script only ever writes
 * source_field_hashes — it never touches name/description/features/etc.,
 * so existing translation content cannot be modified by this script
 * regardless of the flag.
 *
 * Usage:
 *   node backfill-source-hashes.js            # dry run, prints a report
 *   node backfill-source-hashes.js --apply    # actually writes
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { computeSourceFieldHashes } from "./product-i18n-fields.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, "..", "..", "..", "..");
dotenv.config({ path: path.join(FRONTEND_DIR, ".env") });
dotenv.config({ path: path.join(FRONTEND_DIR, ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables. Check .env file.");
  console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PRODUCT_COLUMNS =
  "id, name, short_description, description, type, features, spec_table, included_items, variations, variants, heating_element_groups";

async function main() {
  const apply = process.argv.includes("--apply");

  const { data: rows, error: rowsErr } = await supabase
    .from("product_translations")
    .select("id, product_id, locale, source_field_hashes")
    .is("source_field_hashes", null);
  if (rowsErr) throw new Error(`Fetching product_translations: ${rowsErr.message}`);

  if (!rows || rows.length === 0) {
    console.log("No rows with source_field_hashes IS NULL — nothing to backfill.");
    return;
  }

  console.log(`${rows.length} row(s) need backfilling.${apply ? "" : " (DRY RUN — pass --apply to write)"}\n`);

  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", productIds);
  if (prodErr) throw new Error(`Fetching products: ${prodErr.message}`);
  const productsById = new Map((products || []).map((p) => [p.id, p]));

  let written = 0;
  let skippedMissingProduct = 0;

  for (const row of rows) {
    const product = productsById.get(row.product_id);
    if (!product) {
      console.log(`SKIP  ${row.product_id} / ${row.locale} — no matching products row (deleted product?)`);
      skippedMissingProduct++;
      continue;
    }

    const hashes = computeSourceFieldHashes(product); // all prose paths, baselined from CURRENT English
    const fieldCount = Object.keys(hashes).length;
    console.log(`${apply ? "WRITE" : "WOULD WRITE"}  ${product.name} (${product.id}) / ${row.locale} — ${fieldCount} field(s)`);

    if (apply) {
      const { error: updErr } = await supabase
        .from("product_translations")
        .update({ source_field_hashes: hashes })
        .eq("id", row.id);
      if (updErr) throw new Error(`Updating ${row.id}: ${updErr.message}`);
      written++;
    }
  }

  console.log("");
  if (apply) {
    console.log(`Backfilled ${written} row(s). ${skippedMissingProduct} skipped (missing product).`);
  } else {
    console.log(`Dry run complete — ${rows.length - skippedMissingProduct} row(s) would be written, ${skippedMissingProduct} would be skipped.`);
    console.log("Re-run with --apply to write.");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
