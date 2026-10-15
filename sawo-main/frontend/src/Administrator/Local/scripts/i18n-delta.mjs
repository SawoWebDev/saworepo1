#!/usr/bin/env node
/**
 * i18n-delta.mjs — translate ONLY what's missing or stale, for every
 * product x locale, in one pass. Counterpart to the CMS "Translate" button
 * for when you'd rather fill the text yourself (or have Claude do it)
 * instead of calling an API.
 *
 *   node i18n-delta.mjs extract <out.json>   write every pending field
 *   node i18n-delta.mjs apply   <in.json>    apply a filled-in file
 *
 * extract file shape (one entry per product):
 *   { slug, productId, name, paths: { "<path>": "<english>" },
 *     need: { "<locale>": ["<path>", ...] },        // what that locale lacks
 *     tm:   { "<locale>": { "<path>": "<text>" } }, // translation-memory hits
 *     translations: { "<locale>": { "<path>": "" } } }  <- fill these in
 *
 * apply merges ONLY the filled paths into the existing product_translations
 * row (untouched fields keep their current translation), records freshness
 * hashes for exactly those paths, and adds the pairs to translation memory.
 * Same rules as the CMS apply step (Translations/translationData.js).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  normalize,
  getVariationGroups,
  walkProseFields,
  computeSourceFieldHashes,
  hashSourceValue,
} from "./product-i18n-fields.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, "..", "..", "..", "..");
dotenv.config({ path: path.join(FRONTEND_DIR, ".env") });
dotenv.config({ path: path.join(FRONTEND_DIR, ".env.local") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const LOCALES = ["fi", "zh", "ja", "de", "fr", "es", "th"];
const COLS =
  "id, slug, name, short_description, description, type, features, spec_table, included_items, variations, variants, heating_element_groups";

async function all(build) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

function needPaths(product, row) {
  const hashes = row?.source_field_hashes || null;
  if (!row) return walkProseFields(product).filter((f) => f.value).map((f) => f.path);
  return walkProseFields(product)
    .filter((f) => f.value && (!hashes || hashes[f.path] !== hashSourceValue(f.value)))
    .map((f) => f.path);
}

// ── extract ─────────────────────────────────────────────────────────────
async function extract(outFile) {
  const products = await all(() =>
    supabase.from("products").select(COLS).eq("is_deleted", false).order("id", { ascending: true })
  );
  const rows = await all(() =>
    supabase.from("product_translations").select("*").order("product_id").order("locale")
  );
  const rowMap = new Map(rows.map((r) => [`${r.product_id}:${r.locale}`, r]));
  const tmByLocale = {};
  for (const l of LOCALES) {
    const tm = await all(() =>
      supabase.from("translation_memory").select("source_text, translated_text").eq("locale", l).order("source_text")
    );
    tmByLocale[l] = new Map(tm.map((t) => [t.source_text, t.translated_text]));
  }

  const out = [];
  for (const product of products) {
    const english = new Map(walkProseFields(product).map((f) => [f.path, f.value]));
    const entry = { slug: product.slug, productId: product.id, name: product.name, paths: {}, need: {}, tm: {}, translations: {} };
    for (const l of LOCALES) {
      const row = rowMap.get(`${product.id}:${l}`) || null;
      const need = needPaths(product, row);
      if (!need.length) continue;
      entry.need[l] = need;
      entry.tm[l] = {};
      entry.translations[l] = {};
      for (const p of need) {
        entry.paths[p] = english.get(p);
        const hit = tmByLocale[l].get(normalize(english.get(p)));
        if (hit !== undefined) entry.tm[l][p] = hit;
        else entry.translations[l][p] = "";
      }
    }
    if (Object.keys(entry.need).length) out.push(entry);
  }
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8");
  const n = out.reduce((s, e) => s + Object.values(e.translations).reduce((a, t) => a + Object.keys(t).length, 0), 0);
  console.log(`${out.length} product(s) pending; ${n} field-translations to write -> ${outFile}`);
}

// ── apply ───────────────────────────────────────────────────────────────
function mergeRow(product, byPath, base) {
  const row = {};
  for (const k of ["name", "short_description", "description", "type"]) {
    if (byPath.has(k)) row[k] = byPath.get(k);
  }
  if (Array.isArray(product.features) && [...byPath.keys()].some((k) => /^features\[\d+\]$/.test(k))) {
    const prev = Array.isArray(base?.features) ? base.features : [];
    row.features = product.features.map((o, i) => (byPath.has(`features[${i}]`) ? byPath.get(`features[${i}]`) : prev[i] ?? o));
  }
  if (product.spec_table?.headers && [...byPath.keys()].some((k) => /^spec_table_headers\[\d+\]$/.test(k))) {
    const prev = Array.isArray(base?.spec_table?.headers) ? base.spec_table.headers : [];
    row.spec_table = {
      ...product.spec_table,
      headers: product.spec_table.headers.map((o, i) => (byPath.has(`spec_table_headers[${i}]`) ? byPath.get(`spec_table_headers[${i}]`) : prev[i] ?? o)),
    };
  }
  if ([...byPath.keys()].some((k) => k.startsWith("variations["))) {
    const prevGroups = Array.isArray(base?.variations) ? base.variations : [];
    row.variations = getVariationGroups(product).map((g, i) => {
      const pg = prevGroups[i] || {};
      const m = { ...g };
      const n = byPath.get(`variations[${i}].name`);
      const d = byPath.get(`variations[${i}].description`);
      if (n !== undefined) m.name = n; else if (pg.name != null) m.name = pg.name;
      if (d !== undefined) m.description = d; else if (pg.description != null) m.description = pg.description;
      if (Array.isArray(g.features)) {
        const pf = Array.isArray(pg.features) ? pg.features : [];
        m.features = g.features.map((o, fi) => (byPath.has(`variations[${i}].features[${fi}]`) ? byPath.get(`variations[${i}].features[${fi}]`) : pf[fi] ?? o));
      }
      if (g.spec_table?.headers) {
        const ph = Array.isArray(pg.spec_table?.headers) ? pg.spec_table.headers : [];
        m.spec_table = {
          ...g.spec_table,
          headers: g.spec_table.headers.map((o, hi) => (byPath.has(`variations[${i}].spec_table_headers[${hi}]`) ? byPath.get(`variations[${i}].spec_table_headers[${hi}]`) : ph[hi] ?? o)),
        };
      }
      return m;
    });
  }
  if (Array.isArray(product.included_items) && [...byPath.keys()].some((k) => k.startsWith("included_items["))) {
    const prev = Array.isArray(base?.included_items) ? base.included_items : [];
    row.included_items = product.included_items.map((it, i) => {
      const pi = prev[i] || {};
      const m = { ...it };
      const t = byPath.get(`included_items[${i}].title`);
      const n = byPath.get(`included_items[${i}].note`);
      if (t !== undefined) m.title = t; else if (pi.title != null) m.title = pi.title;
      if (n !== undefined) m.note = n; else if (pi.note != null) m.note = pi.note;
      return m;
    });
  }
  return row;
}

async function apply(inFile) {
  const entries = JSON.parse(fs.readFileSync(inFile, "utf8"));
  let ok = 0, skipped = 0, failed = 0;
  for (const e of entries) {
    const { data: product, error } = await supabase.from("products").select(COLS).eq("id", e.productId).single();
    if (error) { console.error(`  ${e.slug}: ${error.message}`); failed++; continue; }
    const englishNow = new Map(walkProseFields(product).map((f) => [f.path, f.value]));

    for (const l of Object.keys(e.need)) {
      const filled = { ...(e.tm[l] || {}) };
      for (const [p, t] of Object.entries(e.translations[l] || {})) if (typeof t === "string" && t.trim()) filled[p] = t;
      const paths = Object.keys(filled);
      // Refuse if the English moved since extract — never write a translation
      // of text that's no longer there.
      const changed = paths.filter((p) => hashSourceValue(englishNow.get(p)) !== hashSourceValue(e.paths[p]));
      if (changed.length) { console.error(`  ${e.slug}/${l}: English changed (${changed.join(", ")}) — re-extract`); failed++; continue; }
      if (!paths.length) { skipped++; continue; }

      const { data: base } = await supabase.from("product_translations").select("*").eq("product_id", product.id).eq("locale", l).maybeSingle();
      const byPath = new Map(paths.map((p) => [p, filled[p]]));
      const row = {
        product_id: product.id,
        locale: l,
        ...mergeRow(product, byPath, base),
        // Also mark fields that are EMPTY in English as reviewed — there's
        // nothing to translate, but without a hash the CMS grid keeps showing
        // the product as "needs update" forever.
        source_field_hashes: {
          ...(base?.source_field_hashes || {}),
          ...computeSourceFieldHashes(product, [
            ...paths,
            ...walkProseFields(product).filter((f) => f.value == null || String(f.value).trim() === "").map((f) => f.path),
          ]),
        },
        updated_by: "i18n-delta (Claude)",
      };
      const { error: uerr } = await supabase.from("product_translations").upsert(row, { onConflict: "product_id,locale" });
      if (uerr) { console.error(`  ${e.slug}/${l}: ${uerr.message}`); failed++; continue; }

      const tmRows = paths
        .filter((p) => normalize(e.paths[p]) !== normalize(filled[p]) && String(e.paths[p]).length <= 400)
        .map((p) => ({ locale: l, source_text: normalize(e.paths[p]), translated_text: normalize(filled[p]), first_seen_product_id: product.id }));
      if (tmRows.length) await supabase.from("translation_memory").upsert(tmRows, { onConflict: "locale,source_text" });
      ok++;
    }
  }
  console.log(`Applied ${ok} product/locale row(s); skipped ${skipped} (nothing filled); ${failed} failed.`);
}

const [, , cmd, file] = process.argv;
if (cmd === "extract" && file) extract(file).catch((e) => { console.error(e); process.exit(1); });
else if (cmd === "apply" && file) apply(file).catch((e) => { console.error(e); process.exit(1); });
else { console.log("Usage: node i18n-delta.mjs extract <out.json> | apply <in.json>"); process.exit(1); }
