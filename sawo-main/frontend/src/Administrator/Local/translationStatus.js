// Administrator/Local/translationStatus.js
//
// Computes translation freshness status for the Translation CMS, purely
// client-side from two bulk-fetched arrays (products, product_translations)
// — no per-product/per-locale query loop. See product-i18n-fields.js for
// the field-walking/hashing logic this builds on.
import { walkProseFields, hashSourceValue } from "./scripts/product-i18n-fields.js";
import { PRODUCT_TRANSLATION_LOCALES } from "../../i18n/productTranslationLocales";

export const FIELD_STATUS = {
  CURRENT: "CURRENT",
  NEEDS_UPDATE: "NEEDS_UPDATE",
  MISSING: "MISSING",
};

// Per-field status: does this one field-path's stored hash match the
// CURRENT English value at that path?
//   no hash entry at all           -> MISSING (never reviewed)
//   hash entry, matches            -> CURRENT (reviewed, still valid —
//                                     true whether the translated value
//                                     itself is filled or intentionally null)
//   hash entry, doesn't match      -> NEEDS_UPDATE (English changed since)
export function fieldStatus(currentEnglishValue, storedHash) {
  if (storedHash == null) return FIELD_STATUS.MISSING;
  return hashSourceValue(currentEnglishValue) === storedHash ? FIELD_STATUS.CURRENT : FIELD_STATUS.NEEDS_UPDATE;
}

// Every field-path status for one (product, translationRow) pair. Returns
// an array of { path, value, status } — value is the CURRENT English value
// at that path (for display), not the translated one.
export function fieldStatusesForProduct(product, translationRow) {
  const hashes = translationRow?.source_field_hashes || null;
  return walkProseFields(product).map(({ path, value }) => ({
    path,
    value,
    status: fieldStatus(value, hashes ? hashes[path] : null),
  }));
}

// Per-(product, locale) rollup — the grid-cell status. Per the confirmed
// decision: a product/locale with a newly-added field this locale never
// saw (MISSING at the field level) still rolls up to NEEDS_UPDATE, not a
// 4th status — the exact field-level gap is still visible in the detail
// view, just not promoted to a 4th grid symbol (spec: keep the status
// model small).
export function rollupStatus(product, translationRow) {
  if (!translationRow) return FIELD_STATUS.MISSING;
  const statuses = fieldStatusesForProduct(product, translationRow).map((f) => f.status);
  if (statuses.some((s) => s === FIELD_STATUS.NEEDS_UPDATE || s === FIELD_STATUS.MISSING)) {
    return FIELD_STATUS.NEEDS_UPDATE;
  }
  return FIELD_STATUS.CURRENT;
}

// Builds the full status grid: for every product x every locale in
// PRODUCT_TRANSLATION_LOCALES, the rollup status — plus the raw per-field
// breakdown, so the detail view doesn't need to recompute anything.
//
// translationsByProductLocale: Map keyed "productId:locale" -> row, built
// once by the caller from one bulk product_translations query (all
// locales, no per-locale query loop — see Translations.jsx).
export function buildStatusGrid(products, translationsByProductLocale) {
  return products.map((product) => {
    const locales = {};
    for (const { code } of PRODUCT_TRANSLATION_LOCALES) {
      const row = translationsByProductLocale.get(`${product.id}:${code}`) || null;
      locales[code] = {
        rollup: rollupStatus(product, row),
        row,
      };
    }
    return { product, locales };
  });
}

// Overview-tab counters — one pass over the grid, no separate queries.
export function summarizeGrid(grid) {
  let current = 0;
  let needsUpdate = 0;
  let missing = 0;
  const perLocale = {};
  for (const { code } of PRODUCT_TRANSLATION_LOCALES) perLocale[code] = { current: 0, needsUpdate: 0, missing: 0 };

  for (const { locales } of grid) {
    for (const { code } of PRODUCT_TRANSLATION_LOCALES) {
      const status = locales[code].rollup;
      if (status === FIELD_STATUS.CURRENT) { current++; perLocale[code].current++; }
      else if (status === FIELD_STATUS.NEEDS_UPDATE) { needsUpdate++; perLocale[code].needsUpdate++; }
      else { missing++; perLocale[code].missing++; }
    }
  }

  return {
    products: grid.length,
    languages: PRODUCT_TRANSLATION_LOCALES.length,
    current,
    needsUpdate,
    missing,
    perLocale,
  };
}

// Which field-paths on a product/locale actually need attention (stale or
// missing) — this is what task generation (translationTasks.js) hands to
// walkProseFields-based packet building.
export function staleOrMissingPaths(product, translationRow) {
  return fieldStatusesForProduct(product, translationRow)
    .filter((f) => f.status !== FIELD_STATUS.CURRENT)
    .map((f) => f.path);
}
