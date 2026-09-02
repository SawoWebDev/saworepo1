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
import { normalize, getVariationGroups, computeSourceFieldHashes, packetTouchedPaths } from "./product-i18n-fields.js";

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

// ── material/color word dictionary ──────────────────────────────────────
// Variation names in this catalog are almost always "<Material/Color>
// (<model code>)" (e.g. "Cedar (513-D)", "Black (449-BL)") — the code is
// per-product-unique, so translation_memory's exact-string match never
// hits on the full name even though the material word itself repeats
// hundreds of times across the catalog. Established during the 2026-09-02
// zh push (see I18N-CHECKLIST.md's naming-convention notes) — every one of
// these words was hand-translated the same way across every category
// (Ladles, Headrest & Backrest, Clocks & Timers, Wooden Floor Mats,
// Accessory Sets, Cloth Hangers). Codifying them here so buildPacket()
// below can auto-fill the word and leave the code untouched, instead of
// every future product re-deriving the same translation by hand.
// Extend this per-locale as more locales get a real translation pass.
const MATERIAL_WORD_DICTIONARY = {
  zh: {
    Cedar: "雪松",
    Aspen: "白杨",
    Hemlock: "铁杉",
    Alder: "桤木",
    Pine: "松木",
    Spruce: "云杉",
    Birch: "桦木",
    Black: "黑色",
    White: "白色",
    Grey: "灰色",
    Gray: "灰色",
    Silver: "银色",
    Natural: "原木色",
    Aluminum: "铝合金",
    "Black Metal": "黑色金属",
  },
};

// Matches "<Word>" or "<Word> (<anything>)" where <Word> is 1-2 plain
// English words (no digits/symbols) — deliberately narrow so it only ever
// fires on the material/color pattern, never on a real product name like
// "Nordex S Combi NS" or "Loisto Wooden Clock Round".
const MATERIAL_NAME_RE = /^([A-Za-z]+(?:\s[A-Za-z]+)?)(\s*\(.+\))?$/;

// Returns a translated variation name if `name` is exactly a known
// material/color word (optionally followed by "(model code)"), else null.
// Only called as a fallback when translation_memory had no exact-string
// hit — a real TM hit (e.g. from an identical name on a sibling product)
// always wins, this is strictly for the case TM structurally can't cover.
function materialWordFallback(name, locale) {
  const dict = MATERIAL_WORD_DICTIONARY[locale];
  if (!dict || !name) return null;
  const m = name.match(MATERIAL_NAME_RE);
  if (!m) return null;
  const word = dict[m[1]];
  if (!word) return null;
  return m[2] ? `${word} ${m[2].trim()}` : word;
}

// ── translation memory ──────────────────────────────────────────────────
// This catalog's product copy is heavily boilerplated within and across
// products in the same category (spec-table headers, feature bullets,
// included-item titles repeat near-verbatim). See
// setup-translation-memory.sql. Exact-match on normalized (trimmed,
// whitespace-collapsed) English text — no fuzzy matching, good enough for
// this catalog's literal phrase reuse. normalize() itself now lives in
// product-i18n-fields.js (imported above) so the Translation CMS's
// freshness hashing uses the exact same normalization.

async function loadTM(locale) {
  const { data, error } = await supabase
    .from("translation_memory")
    .select("source_text, translated_text")
    .eq("locale", locale);
  if (error) throw new Error(`Loading translation memory: ${error.message}`);
  const map = new Map();
  for (const row of data || []) map.set(row.source_text, row.translated_text);
  return map;
}

// Looks up `text` in the TM; if found, records the hit (for the console
// summary + hit_count bump) and returns the translation, else returns the
// original English unchanged (still a valid packet value — untouched
// English is exactly what "needs translation" looks like).
function tmLookup(text, tm, hits, pathLabel) {
  if (!text) return text;
  const key = normalize(text);
  const hit = tm.get(key);
  if (hit === undefined) return text;
  hits.push({ path: pathLabel, source: key });
  return hit;
}

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

// getVariationGroups() (resolves variations vs. legacy variants +
// heating_element_groups, mirroring DispAccessories.jsx's
// getVariationsArray() exactly) now lives in product-i18n-fields.js
// (imported above) — same behavior, moved so the Translation CMS can call
// the identical logic instead of a second copy.

// ── extract ──────────────────────────────────────────────────────────────

function buildPacket(product, tm, hits, locale) {
  const fields = {
    name: tmLookup(product.name, tm, hits, "name") || null,
    short_description: tmLookup(product.short_description, tm, hits, "short_description") || null, // HTML — translate text nodes, keep tags
    description: tmLookup(product.description, tm, hits, "description") || null, // HTML — same rule
    type: tmLookup(product.type, tm, hits, "type") || null,
  };

  if (Array.isArray(product.features) && product.features.length > 0) {
    fields.features = product.features.map((s, i) => tmLookup(s, tm, hits, `features[${i}]`));
  }

  if (product.spec_table?.headers?.length > 0) {
    // rows are model codes/kW/dimensions/weight/control-mode names — data,
    // not prose, so they're deliberately excluded from the packet.
    fields.spec_table_headers = product.spec_table.headers.map((s, i) =>
      tmLookup(s, tm, hits, `spec_table_headers[${i}]`)
    );
  }

  const variationGroups = getVariationGroups(product);
  if (variationGroups.length > 0) {
    fields.variations = variationGroups.map((g, i) => {
      let name = tmLookup(g.name, tm, hits, `variations[${i}].name`) || null;
      // TM had no exact hit (name includes a unique model code) — fall back
      // to the material/color word dictionary before giving up and leaving
      // it as untranslated English for the human/agent to fill in.
      if (name === g.name) {
        const fallback = materialWordFallback(g.name, locale);
        if (fallback) {
          name = fallback;
          hits.push({ path: `variations[${i}].name`, source: g.name, via: "material-dictionary" });
        }
      }
      return {
      index: i,
      _english_name: g.name || null, // reference only — apply matches by index, not this
      name,
      description: tmLookup(g.description, tm, hits, `variations[${i}].description`) || null,
      features: Array.isArray(g.features)
        ? g.features.map((s, fi) => tmLookup(s, tm, hits, `variations[${i}].features[${fi}]`))
        : [],
      spec_table_headers: g.spec_table?.headers?.length > 0
        ? g.spec_table.headers.map((s, hi) => tmLookup(s, tm, hits, `variations[${i}].spec_table_headers[${hi}]`))
        : undefined,
      };
    });
  }

  if (Array.isArray(product.included_items) && product.included_items.length > 0) {
    fields.included_items = product.included_items.map((item, i) => ({
      index: i,
      _english_title: item.title || null, // reference only
      title: tmLookup(item.title, tm, hits, `included_items[${i}].title`) || null,
      note: tmLookup(item.note, tm, hits, `included_items[${i}].note`) || null,
    }));
  }

  return fields;
}

async function extract(slug, locale = "fi") {
  const product = await fetchProduct(slug);
  const tm = await loadTM(locale);
  const hits = [];
  const packet = {
    slug,
    productId: product.id,
    locale,
    instructions:
      `Replace every remaining ENGLISH string value below with its ${locale} translation. Leave a field null/absent to skip it (falls back to English on the live site). Do NOT edit keys, array length/order, or the _english_* reference fields — apply matches variations/included_items by array index. See tmPrefilled for which values were auto-filled from translation memory (already translated, worth a quick sanity read, not a fresh translation).`,
    tmPrefilled: hits,
    fields: buildPacket(product, tm, hits, locale),
  };
  const outFile = path.join(PACKET_DIR, `${slug}.${locale}.packet.json`);
  fs.writeFileSync(outFile, JSON.stringify(packet, null, 2), "utf8");
  console.log(`Wrote ${outFile}`);
  console.log(`Translation memory: ${hits.length} field(s) pre-filled, review the rest.`);
  console.log(`Fill in the remaining ${locale} text, then run:`);
  console.log(`  node product-i18n.js apply ${slug} ${locale}`);
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

// Pairs up every (english, finnish) string actually applied, for writing
// into translation_memory. Mirrors the same field walk as the row-building
// logic below — kept separate rather than merged into it so a future
// change to one doesn't silently desync from the other without a diff
// showing it.
function collectTmPairs(product, f) {
  const pairs = [];
  const add = (english, translated) => {
    if (english && translated && normalize(english) !== normalize(translated)) {
      pairs.push({ source: normalize(english), translated: normalize(translated) });
    }
  };

  add(product.name, f.name);
  add(product.short_description, f.short_description);
  add(product.description, f.description);
  add(product.type, f.type);

  if (Array.isArray(product.features) && Array.isArray(f.features)) {
    product.features.forEach((s, i) => add(s, f.features[i]));
  }
  if (product.spec_table?.headers?.length > 0 && Array.isArray(f.spec_table_headers)) {
    product.spec_table.headers.forEach((s, i) => add(s, f.spec_table_headers[i]));
  }

  const englishGroups = getVariationGroups(product);
  if (Array.isArray(f.variations)) {
    englishGroups.forEach((g, i) => {
      const t = f.variations.find((x) => x.index === i);
      if (!t) return;
      add(g.name, t.name);
      add(g.description, t.description);
      if (Array.isArray(g.features) && Array.isArray(t.features)) {
        g.features.forEach((s, fi) => add(s, t.features[fi]));
      }
      if (g.spec_table?.headers?.length > 0 && Array.isArray(t.spec_table_headers)) {
        g.spec_table.headers.forEach((s, hi) => add(s, t.spec_table_headers[hi]));
      }
    });
  }

  if (Array.isArray(product.included_items) && Array.isArray(f.included_items)) {
    product.included_items.forEach((item, i) => {
      const t = f.included_items.find((x) => x.index === i);
      if (!t) return;
      add(item.title, t.title);
      add(item.note, t.note);
    });
  }

  return pairs;
}

async function upsertTM(pairs, locale, productId) {
  if (pairs.length === 0) return;
  // Dedupe within this one product (e.g. "Auto drain" can appear in every
  // variation group) — one row per distinct source string is all TM needs.
  const seen = new Map();
  for (const p of pairs) seen.set(p.source, p.translated);
  const rows = Array.from(seen.entries()).map(([source_text, translated_text]) => ({
    locale,
    source_text,
    translated_text,
    first_seen_product_id: productId,
  }));
  const { error } = await supabase
    .from("translation_memory")
    .upsert(rows, { onConflict: "locale,source_text", ignoreDuplicates: false });
  if (error) throw new Error(`Updating translation memory: ${error.message}`);
  console.log(`Translation memory: recorded ${rows.length} distinct phrase(s).`);
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

  // Freshness hashes: computed from the CURRENT English product (fetched
  // fresh above, not from anything cached in the packet), for exactly the
  // paths this packet covered — filled or deliberately left null, both
  // count as "reviewed." Merged onto the existing row's hash map, never
  // replacing it wholesale, so a packet that only touches a subset of
  // fields (as CMS-generated tasks deliberately will) doesn't wipe out
  // hash entries — and therefore freshness — for the fields it didn't
  // touch. A full-packet apply (every CLI packet today) naturally acts as
  // a full refresh through this same merge, no special-casing needed.
  const touchedPaths = packetTouchedPaths(f);
  const newHashes = computeSourceFieldHashes(product, touchedPaths);
  const { data: existingRow } = await supabase
    .from("product_translations")
    .select("source_field_hashes")
    .eq("product_id", product.id)
    .eq("locale", locale)
    .maybeSingle();
  row.source_field_hashes = { ...(existingRow?.source_field_hashes || {}), ...newHashes };

  const { error } = await supabase
    .from("product_translations")
    .upsert(row, { onConflict: "product_id,locale" });
  if (error) throw new Error(`Upserting "${slug}"/${locale}: ${error.message}`);

  console.log(`Applied ${packetPath} -> product_translations (${slug}, ${locale})`);

  await upsertTM(collectTmPairs(product, f), locale, product.id);
}

// ── pending ──────────────────────────────────────────────────────────────
// Lists published+visible+not-deleted product slugs in `category` that
// don't yet have a product_translations row for `locale`. Replaces the
// one-off inline SQL query re-written by hand at the start of every batch
// (see I18N-CHECKLIST.md's Batch 1-3 entries) with a single command —
// same filter logic (status=published, visible=true, is_deleted=false)
// each of those batches used.
async function pending(locale, category) {
  const { data: prods, error } = await supabase
    .from("products")
    .select("slug, name, categories, is_deleted")
    .eq("status", "published")
    .eq("visible", true);
  if (error) throw new Error(`Listing products: ${error.message}`);
  const notDeleted = (prods || []).filter((p) => !p.is_deleted);
  const inCategory = category
    ? notDeleted.filter((p) => (p.categories || []).includes(category))
    : notDeleted;

  const { data: tr, error: e2 } = await supabase
    .from("product_translations")
    .select("product_id")
    .eq("locale", locale);
  if (e2) throw new Error(`Listing translations: ${e2.message}`);

  // Need product_id, not slug, to diff — re-select with id included.
  const { data: prodsWithId, error: e3 } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", inCategory.map((p) => p.slug));
  if (e3) throw new Error(`Listing product ids: ${e3.message}`);
  const trSet = new Set((tr || []).map((t) => t.product_id));
  const missing = prodsWithId.filter((p) => !trSet.has(p.id)).map((p) => p.slug);

  if (category) console.log(`Category "${category}": ${inCategory.length} total, ${missing.length} missing ${locale}.`);
  else console.log(`${inCategory.length} total, ${missing.length} missing ${locale}.`);
  missing.forEach((s) => console.log(s));
}

// ── extract-many / apply-many ───────────────────────────────────────────
// Same extract()/apply() as above, looped over a slug list within ONE node
// process instead of one process launch per product — the actual
// bottleneck was never CPU time, it was ~259 separate `node product-i18n.js
// ...` invocations across a session. `slugsArg` is comma-separated, or "-"
// to read one slug per line from stdin (so `pending`'s output can be piped
// straight in: `node product-i18n.js pending zh "Doors & Handles" | tail -n
// +2 | node product-i18n.js extract-many zh -`).
function readSlugList(slugsArg) {
  if (slugsArg === "-") {
    return fs.readFileSync(0, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return slugsArg.split(",").map((s) => s.trim()).filter(Boolean);
}

async function extractMany(locale, slugsArg) {
  const slugs = readSlugList(slugsArg);
  console.log(`Extracting ${slugs.length} product(s) into ${locale} packets...`);
  let prefilled = 0;
  for (const s of slugs) {
    try {
      const product = await fetchProduct(s);
      const tm = await loadTM(locale);
      const hits = [];
      const packet = {
        slug: s,
        productId: product.id,
        locale,
        instructions:
          `Replace every remaining ENGLISH string value below with its ${locale} translation. Leave a field null/absent to skip it (falls back to English on the live site). Do NOT edit keys, array length/order, or the _english_* reference fields — apply matches variations/included_items by array index. See tmPrefilled for which values were auto-filled from translation memory (already translated, worth a quick sanity read, not a fresh translation).`,
        tmPrefilled: hits,
        fields: buildPacket(product, tm, hits, locale),
      };
      const outFile = path.join(PACKET_DIR, `${s}.${locale}.packet.json`);
      fs.writeFileSync(outFile, JSON.stringify(packet, null, 2), "utf8");
      prefilled += hits.length;
      console.log(`  ${s}: wrote packet, ${hits.length} field(s) pre-filled`);
    } catch (err) {
      console.error(`  ${s}: FAILED — ${err.message}`);
    }
  }
  console.log(`Done. ${prefilled} total field(s) pre-filled across ${slugs.length} product(s) — review packets in ${PACKET_DIR}, then apply-many.`);
}

async function applyMany(locale, slugsArg) {
  const slugs = readSlugList(slugsArg);
  console.log(`Applying ${slugs.length} product(s) for ${locale}...`);
  let ok = 0;
  for (const s of slugs) {
    try {
      await apply(s, locale);
      ok++;
    } catch (err) {
      console.error(`  ${s}: FAILED — ${err.message}`);
    }
  }
  console.log(`Done. ${ok}/${slugs.length} applied successfully.`);
}

// ── CLI ──────────────────────────────────────────────────────────────────

const [, , command, arg0, arg1, arg2] = process.argv;

if (command === "extract" && arg0) {
  extract(arg0, arg1 || "fi").catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === "apply" && arg0 && arg1) {
  apply(arg0, arg1, arg2).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === "pending" && arg0) {
  pending(arg0, arg1).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === "extract-many" && arg0 && arg1) {
  extractMany(arg0, arg1).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === "apply-many" && arg0 && arg1) {
  applyMany(arg0, arg1).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else {
  console.log("Usage:");
  console.log("  node product-i18n.js extract <slug> [locale]              (locale defaults to fi)");
  console.log("  node product-i18n.js apply <slug> <locale> [packetFile]");
  console.log("  node product-i18n.js pending <locale> [category]          list slugs still missing that locale");
  console.log("  node product-i18n.js extract-many <locale> <slugs|->      comma-separated, or - for stdin (one per line)");
  console.log("  node product-i18n.js apply-many <locale> <slugs|->        same, applies existing packets");
  process.exit(1);
}
