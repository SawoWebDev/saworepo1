#!/usr/bin/env node
/**
 * product-i18n.js — extract/apply workflow for translating ONE product's
 * live content into product_translations (see setup-product-translations.sql).
 *
 * Why this exists: a product row mixes real prose (name, descriptions,
 * feature bullets, spec-table column headers, "included in package" titles/
 * notes) with data that must NEVER be translated (image URLs, slugs, model
 * codes like "STN-45-C1/3", physical dimensions, weights, the "Control"
 * column's mode names). Hand-writing SQL INSERTs per product means re-
 * deriving that split every time and risks silently mistranslating a model
 * code. This script knows the split once (PROSE per field, below) and
 * reuses it for both directions.
 *
 * WORKFLOW
 *   1. node product-i18n.js extract <slug>
 *      Fetches the English product row, writes a translator-friendly
 *      packet containing ONLY the prose fields to
 *      Administrator/Local/data/product-i18n/<slug>.fi.packet.json
 *   2. Fill in the Finnish text in that file — every key stays, only the
 *      string VALUES change. Leave a field null/absent to skip translating
 *      it (falls back to English on the live site, per product_translations'
 *      own per-field fallback rule).
 *   3. node product-i18n.js apply <slug> fi
 *      Re-fetches the English row (source of truth for anything NOT prose:
 *      images, slugs, model codes, dimensions), splices the packet's
 *      translated prose back into copies of the original structures, and
 *      upserts the result into product_translations.
 *
 * Requires the same SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY as sync.js
 * (.env in this directory or a parent one dotenv can find).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SUPABASE_URL lives in frontend/.env, SUPABASE_SERVICE_ROLE_KEY in
// frontend/.env.local (CRA's dev server loads both automatically; plain
// dotenv only loads .env, so both are pointed at explicitly here — same
// two files react-scripts itself reads, not new ones to set up).
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

const PACKET_DIR = path.join(__dirname, "..", "data", "product-i18n");
if (!fs.existsSync(PACKET_DIR)) fs.mkdirSync(PACKET_DIR, { recursive: true });

// local_variations/local_variants (checked first by getVariationsArray, see
// below) aren't real `products` columns — they only ever exist as a
// client-side enrichment elsewhere, never on a raw Supabase row, so they're
// deliberately not selected here.
const PRODUCT_COLUMNS =
  "id, name, short_description, description, type, features, spec_table, included_items, variations, variants, heating_element_groups";

async function fetchProduct(slug) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .single();
  if (error) throw new Error(`Fetching "${slug}": ${error.message}`);
  if (!data) throw new Error(`No product with slug "${slug}"`);
  return data;
}

// Mirrors pages/IndividualDisplay/DispAccessories.jsx's getVariationsArray()
// priority EXACTLY — local_variations > variations > a legacy fallback that
// combines variants + heating_element_groups into the same {name, image,
// features, spec_table, description} shape. Whichever one a given product
// actually has populated is what DispProduct.jsx renders, so that's what
// needs translating — always written back to product_translations.variations
// regardless of which field it came from (mergeTranslation overlays
// `variations` on the product object, which getVariationsArray then finds
// first no matter what the untranslated row's own field layout was).
function getVariationGroups(product) {
  if (product.local_variations?.length) return product.local_variations;
  if (product.variations?.length) return product.variations;

  const legacyVariants = product.local_variants?.length ? product.local_variants : product.variants || [];
  const legacyGroups = product.heating_element_groups || [];
  return [
    ...legacyVariants.map((v) => ({
      name: [v.color, v.code ? `(${v.code})` : ""].filter(Boolean).join(" ").trim() || null,
      color: v.color || null,
      code: v.code || null,
      image: v.image || null,
      description: "",
      features: [],
      spec_table: null,
    })),
    ...legacyGroups.map((g) => ({
      name: g.label || null,
      color: null,
      code: null,
      image: g.image || null,
      description: g.description || "",
      features: g.features || [],
      spec_table: g.spec_table || null,
    })),
  ];
}

// ── extract ──────────────────────────────────────────────────────────────

function buildPacket(product) {
  const fields = {
    name: product.name || null,
    short_description: product.short_description || null, // HTML — translate text nodes, keep tags
    description: product.description || null, // HTML — same rule
    type: product.type || null,
  };

  if (Array.isArray(product.features) && product.features.length > 0) {
    fields.features = product.features;
  }

  if (product.spec_table?.headers?.length > 0) {
    // rows are model codes/kW/dimensions/weight/control-mode names — data,
    // not prose, so they're deliberately excluded from the packet.
    fields.spec_table_headers = product.spec_table.headers;
  }

  const variationGroups = getVariationGroups(product);
  if (variationGroups.length > 0) {
    fields.variations = variationGroups.map((g, i) => ({
      index: i,
      _english_name: g.name || null, // reference only — apply matches by index, not this
      name: g.name || null,
      description: g.description || null,
      features: Array.isArray(g.features) ? g.features : [],
      spec_table_headers: g.spec_table?.headers?.length > 0 ? g.spec_table.headers : undefined,
    }));
  }

  if (Array.isArray(product.included_items) && product.included_items.length > 0) {
    fields.included_items = product.included_items.map((item, i) => ({
      index: i,
      _english_title: item.title || null, // reference only
      title: item.title || null,
      note: item.note || null,
    }));
  }

  return fields;
}

function extract(slug) {
  return fetchProduct(slug).then((product) => {
    const packet = {
      slug,
      productId: product.id,
      locale: "fi",
      instructions:
        "Replace every string value below with its Finnish translation. Leave a field null/absent to skip it (falls back to English on the live site). Do NOT edit keys, array length/order, or the _english_* reference fields — apply matches variations/included_items by array index.",
      fields: buildPacket(product),
    };
    const outFile = path.join(PACKET_DIR, `${slug}.fi.packet.json`);
    fs.writeFileSync(outFile, JSON.stringify(packet, null, 2), "utf8");
    console.log(`Wrote ${outFile}`);
    console.log("Fill in the Finnish text, then run:");
    console.log(`  node product-i18n.js apply ${slug} fi`);
  });
}

// ── apply ────────────────────────────────────────────────────────────────

function applyProse(englishArray, translatedArray, proseKeys) {
  if (!Array.isArray(translatedArray)) return undefined;
  return englishArray.map((englishItem, i) => {
    const t = translatedArray.find((x) => x.index === i) || translatedArray[i];
    if (!t) return englishItem;
    const merged = { ...englishItem };
    for (const key of proseKeys) {
      if (t[key] !== undefined && t[key] !== null) merged[key] = t[key];
    }
    return merged;
  });
}

async function apply(slug, locale, packetPathArg) {
  const packetPath = packetPathArg || path.join(PACKET_DIR, `${slug}.${locale}.packet.json`);
  if (!fs.existsSync(packetPath)) throw new Error(`Packet not found: ${packetPath}`);
  const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
  const f = packet.fields || {};

  const product = await fetchProduct(slug);

  const row = {
    product_id: product.id,
    locale,
    name: f.name || null,
    short_description: f.short_description || null,
    description: f.description || null,
    type: f.type || null,
    features: Array.isArray(f.features) ? f.features : null,
    updated_by: "product-i18n.js",
  };

  if (Array.isArray(f.spec_table_headers) && product.spec_table) {
    row.spec_table = { ...product.spec_table, headers: f.spec_table_headers };
  }

  if (Array.isArray(f.variations)) {
    const englishGroups = getVariationGroups(product);
    row.variations = englishGroups.map((group, i) => {
      const t = f.variations.find((x) => x.index === i);
      if (!t) return group;
      const merged = { ...group };
      if (t.name) merged.name = t.name;
      if (t.description) merged.description = t.description;
      if (Array.isArray(t.features)) merged.features = t.features;
      if (Array.isArray(t.spec_table_headers) && group.spec_table) {
        merged.spec_table = { ...group.spec_table, headers: t.spec_table_headers };
      }
      return merged;
    });
  }

  if (Array.isArray(f.included_items) && Array.isArray(product.included_items)) {
    row.included_items = applyProse(product.included_items, f.included_items, ["title", "note"]);
  }

  const { error } = await supabase
    .from("product_translations")
    .upsert(row, { onConflict: "product_id,locale" });
  if (error) throw new Error(`Upserting "${slug}"/${locale}: ${error.message}`);

  console.log(`Applied ${packetPath} -> product_translations (${slug}, ${locale})`);
}

// ── CLI ──────────────────────────────────────────────────────────────────

const [, , command, slug, locale, packetPathArg] = process.argv;

if (command === "extract" && slug) {
  extract(slug).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === "apply" && slug && locale) {
  apply(slug, locale, packetPathArg).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else {
  console.log("Usage:");
  console.log("  node product-i18n.js extract <slug>");
  console.log("  node product-i18n.js apply <slug> <locale> [packetFile]");
  process.exit(1);
}
