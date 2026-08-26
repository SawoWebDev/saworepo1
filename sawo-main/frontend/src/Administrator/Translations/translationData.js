// Administrator/Translations/translationData.js
//
// Data layer for the Translation CMS: bulk fetch, task generation, apply.
// Reuses product-i18n-fields.js (the same field-walking/hashing logic the
// CLI product-i18n.js uses) so both stay in lockstep — see that file's
// header comment.
import { supabase, logActivity } from "../supabase";
import {
  walkProseFields,
  getVariationGroups,
  computeSourceFieldHashes,
  packetTouchedPaths,
  normalize,
} from "../Local/scripts/product-i18n-fields.js";
import { staleOrMissingPaths } from "../Local/translationStatus";

// Same column set product-i18n.js's fetchProduct() uses — prose fields
// plus the structural fields walkProseFields()/getVariationGroups() need,
// nothing extra (no images/spec_images — this mirrors the "don't pull the
// heavy per-row payload" discipline supabaseReader.js already documents).
const PRODUCT_COLUMNS =
  "id, name, slug, short_description, description, type, features, spec_table, included_items, variations, variants, heating_element_groups, updated_at";

// ── bulk fetch ─────────────────────────────────────────────────────────────
// Two queries total, no matter how many products/locales — no N+1.
export async function fetchAllProductsForTranslation() {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_deleted", false)
    .order("name", { ascending: true });
  if (error) throw new Error(`Fetching products: ${error.message}`);
  return data || [];
}

// Map keyed "productId:locale" -> row, covering every locale in one query
// (deliberately not per-locale like the public site's
// getProductTranslationsLive — the CMS needs every locale simultaneously).
export async function fetchAllTranslations() {
  const { data, error } = await supabase
    .from("product_translations")
    .select("product_id, locale, name, short_description, description, type, features, spec_table, variations, included_items, source_field_hashes, updated_at, updated_by");
  if (error) throw new Error(`Fetching product_translations: ${error.message}`);
  const map = new Map();
  for (const row of data || []) map.set(`${row.product_id}:${row.locale}`, row);
  return map;
}

export async function fetchProductById(productId) {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", productId).single();
  if (error) throw new Error(`Fetching product ${productId}: ${error.message}`);
  return data;
}

export async function fetchTranslationsForProduct(productId) {
  const { data, error } = await supabase
    .from("product_translations")
    .select("*")
    .eq("product_id", productId);
  if (error) throw new Error(`Fetching translations for ${productId}: ${error.message}`);
  const byLocale = {};
  for (const row of data || []) byLocale[row.locale] = row;
  return byLocale;
}

// ── translation memory ──────────────────────────────────────────────────
// Same exact-match-on-normalized-text lookup product-i18n.js uses.
export async function loadTranslationMemory(locale) {
  const { data, error } = await supabase
    .from("translation_memory")
    .select("source_text, translated_text")
    .eq("locale", locale);
  if (error) throw new Error(`Loading translation memory: ${error.message}`);
  const map = new Map();
  for (const row of data || []) map.set(row.source_text, row.translated_text);
  return map;
}

async function upsertTranslationMemory(pairs, locale) {
  if (!pairs.length) return;
  const seen = new Map();
  for (const p of pairs) seen.set(p.source, p.translated);
  const rows = Array.from(seen.entries()).map(([source_text, translated_text]) => ({ locale, source_text, translated_text }));
  const { error } = await supabase
    .from("translation_memory")
    .upsert(rows, { onConflict: "locale,source_text", ignoreDuplicates: false });
  if (error) throw new Error(`Updating translation memory: ${error.message}`);
}

// ── task generation ───────────────────────────────────────────────────────
// Builds a translation task for one (product, locale): only the paths that
// are actually stale/missing, each with the current English value, the
// existing translated value (if any, for reference), and a translation-
// memory hint if one exists. expected_source_hashes snapshots the CURRENT
// hash per targeted path — the concurrency guard applyTranslationTask()
// checks against at apply time.
export function buildTranslationTask(product, locale, translationRow, tm) {
  const paths = staleOrMissingPaths(product, translationRow);
  const allFields = new Map(walkProseFields(product).map((f) => [f.path, f.value]));
  const existingByPath = existingTranslationByPath(translationRow);

  const items = paths.map((path) => {
    const englishValue = allFields.get(path);
    const tmHint = tm ? tm.get(normalize(englishValue)) : undefined;
    return {
      path,
      english: englishValue,
      existingTranslation: existingByPath[path] ?? null,
      translated: tmHint ?? existingByPath[path] ?? null, // prefill: TM match, else keep prior translation as a starting point
      tmPrefilled: tmHint !== undefined,
    };
  });

  return {
    productId: product.id,
    productName: product.name,
    locale,
    items,
    expected_source_hashes: computeSourceFieldHashes(product, paths),
  };
}

// Flattens a product_translations row's structured columns
// (features[], variations[], included_items[]) into the same path-keyed
// shape as walkProseFields, for reference/prefill purposes.
function existingTranslationByPath(row) {
  const out = {};
  if (!row) return out;
  out["name"] = row.name ?? null;
  out["short_description"] = row.short_description ?? null;
  out["description"] = row.description ?? null;
  out["type"] = row.type ?? null;
  if (Array.isArray(row.features)) row.features.forEach((v, i) => (out[`features[${i}]`] = v));
  if (row.spec_table?.headers) row.spec_table.headers.forEach((v, i) => (out[`spec_table_headers[${i}]`] = v));
  if (Array.isArray(row.variations)) {
    row.variations.forEach((v, i) => {
      out[`variations[${i}].name`] = v.name ?? null;
      out[`variations[${i}].description`] = v.description ?? null;
      if (Array.isArray(v.features)) v.features.forEach((f, fi) => (out[`variations[${i}].features[${fi}]`] = f));
      if (v.spec_table?.headers) v.spec_table.headers.forEach((h, hi) => (out[`variations[${i}].spec_table_headers[${hi}]`] = h));
    });
  }
  if (Array.isArray(row.included_items)) {
    row.included_items.forEach((v, i) => {
      out[`included_items[${i}].title`] = v.title ?? null;
      out[`included_items[${i}].note`] = v.note ?? null;
    });
  }
  return out;
}

// ── apply ────────────────────────────────────────────────────────────────
// Applies a reviewed task's translated values back to product_translations.
// Re-fetches English fresh and re-checks expected_source_hashes before
// writing anything (concurrency guard — spec section 29): if the English
// source changed since the task was generated, aborts with a specific
// per-path error instead of silently overwriting with now-stale content.
export async function applyTranslationTask({ productId, locale, items, expected_source_hashes, currentUser }) {
  const product = await fetchProductById(productId);

  const touchedPaths = items.map((i) => i.path);
  const currentHashes = computeSourceFieldHashes(product, touchedPaths);
  const changedPaths = touchedPaths.filter((p) => currentHashes[p] !== expected_source_hashes[p]);
  if (changedPaths.length > 0) {
    const err = new Error(
      `The English source changed after this task was generated (${changedPaths.join(", ")}). Regenerate the task to see the latest English text.`
    );
    err.code = "SOURCE_CHANGED";
    err.changedPaths = changedPaths;
    throw err;
  }

  const structured = buildStructuredRow(product, items);

  const { data: existingRow } = await supabase
    .from("product_translations")
    .select("source_field_hashes")
    .eq("product_id", productId)
    .eq("locale", locale)
    .maybeSingle();

  const newHashes = computeSourceFieldHashes(product, packetTouchedPaths(fieldsFromItems(items)));
  const row = {
    product_id: productId,
    locale,
    ...structured,
    source_field_hashes: { ...(existingRow?.source_field_hashes || {}), ...newHashes },
    updated_by: currentUser?.username || "translation-cms",
  };

  const { error } = await supabase.from("product_translations").upsert(row, { onConflict: "product_id,locale" });
  if (error) throw new Error(`Applying translation: ${error.message}`);

  const tmPairs = items
    .filter((i) => i.translated && normalize(i.english) !== normalize(i.translated))
    .map((i) => ({ source: normalize(i.english), translated: normalize(i.translated) }));
  await upsertTranslationMemory(tmPairs, locale);

  await logActivity({
    action: "translation_apply",
    entity: "product_translation",
    entity_id: `${productId}:${locale}`,
    entity_name: `${product.name} (${locale})`,
    username: currentUser?.username,
    user_id: currentUser?.id,
    meta: { paths: touchedPaths },
  });

  return row;
}

// Reconstructs { name, short_description, ..., variations, included_items }
// from a flat items[] list (path + translated value) — the inverse of
// existingTranslationByPath, needed because product_translations stores
// variations/included_items as structured JSONB, not flat paths.
function fieldsFromItems(items) {
  const fields = {};
  for (const { path, translated } of items) {
    if (path === "name" || path === "short_description" || path === "description" || path === "type") {
      fields[path] = translated;
    }
  }
  return fields;
}

function buildStructuredRow(product, items) {
  const byPath = new Map(items.map((i) => [i.path, i.translated]));
  const row = {};

  for (const key of ["name", "short_description", "description", "type"]) {
    if (byPath.has(key)) row[key] = byPath.get(key);
  }

  const featureIndexes = [...byPath.keys()].filter((k) => /^features\[\d+\]$/.test(k));
  if (featureIndexes.length && Array.isArray(product.features)) {
    row.features = product.features.map((orig, i) => (byPath.has(`features[${i}]`) ? byPath.get(`features[${i}]`) : orig));
  }

  const specHeaderIndexes = [...byPath.keys()].filter((k) => /^spec_table_headers\[\d+\]$/.test(k));
  if (specHeaderIndexes.length && product.spec_table?.headers) {
    row.spec_table = {
      ...product.spec_table,
      headers: product.spec_table.headers.map((orig, i) => (byPath.has(`spec_table_headers[${i}]`) ? byPath.get(`spec_table_headers[${i}]`) : orig)),
    };
  }

  const variationTouched = [...byPath.keys()].some((k) => k.startsWith("variations["));
  if (variationTouched) {
    const englishGroups = getVariationGroups(product);
    row.variations = englishGroups.map((group, i) => {
      const name = byPath.get(`variations[${i}].name`);
      const description = byPath.get(`variations[${i}].description`);
      const merged = { ...group };
      if (name !== undefined) merged.name = name;
      if (description !== undefined) merged.description = description;

      const featureKeys = [...byPath.keys()].filter((k) => k.startsWith(`variations[${i}].features[`));
      if (featureKeys.length && Array.isArray(group.features)) {
        merged.features = group.features.map((orig, fi) =>
          byPath.has(`variations[${i}].features[${fi}]`) ? byPath.get(`variations[${i}].features[${fi}]`) : orig
        );
      }

      const headerKeys = [...byPath.keys()].filter((k) => k.startsWith(`variations[${i}].spec_table_headers[`));
      if (headerKeys.length && group.spec_table?.headers) {
        merged.spec_table = {
          ...group.spec_table,
          headers: group.spec_table.headers.map((orig, hi) =>
            byPath.has(`variations[${i}].spec_table_headers[${hi}]`) ? byPath.get(`variations[${i}].spec_table_headers[${hi}]`) : orig
          ),
        };
      }
      return merged;
    });
  }

  const includedItemsTouched = [...byPath.keys()].some((k) => k.startsWith("included_items["));
  if (includedItemsTouched && Array.isArray(product.included_items)) {
    row.included_items = product.included_items.map((item, i) => {
      const title = byPath.get(`included_items[${i}].title`);
      const note = byPath.get(`included_items[${i}].note`);
      const merged = { ...item };
      if (title !== undefined) merged.title = title;
      if (note !== undefined) merged.note = note;
      return merged;
    });
  }

  return row;
}
