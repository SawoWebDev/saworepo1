// src/Administrator/csv/productCsv.js
//
// Shared CSV <-> product-row conversion for export and import. One explicit
// column list (never Object.keys) so the file format is stable even as the
// product schema grows, and both directions agree on how JSON-ish columns
// are represented in a single CSV cell.
import Papa from "papaparse";

// Columns that hold arrays/objects on the products table — serialized as a
// JSON string in the CSV cell (e.g. ["a.webp","b.webp"] or [{"name":"x"}]).
export const JSON_COLUMNS = new Set([
  "images", "spec_images", "files", "variants", "spec_table", "categories", "tags", "features",
]);

// Boolean columns — CSV has no native boolean type, stored as "true"/"false".
const BOOLEAN_COLUMNS = new Set(["visible", "featured"]);

// Numeric columns.
const NUMBER_COLUMNS = new Set(["capacity_liters", "sort_order"]);

// Explicit, ordered column list. Deliberately excludes `id` (the app matches
// existing rows by slug) and audit/timestamp columns (those are always
// server-assigned, never imported).
export const COLUMNS = [
  "name", "slug", "short_description", "description",
  "thumbnail", "images", "spec_images", "files", "variants", "spec_table",
  "categories", "tags", "features",
  "brand", "type", "capacity_liters", "variant_type", "product_family", "parent_product_id",
  "status", "visible", "featured", "sort_order",
  "meta_title", "meta_description", "og_image",
];

// One row (a product-shaped object, e.g. from Products.jsx's `products` state
// or a saved payload) -> a flat object safe to hand to Papa.unparse.
export function toCsvRow(product) {
  const row = {};
  for (const col of COLUMNS) {
    const val = product[col];
    if (val === null || val === undefined) {
      row[col] = "";
    } else if (JSON_COLUMNS.has(col)) {
      row[col] = JSON.stringify(val);
    } else if (BOOLEAN_COLUMNS.has(col)) {
      row[col] = val ? "true" : "false";
    } else {
      row[col] = val;
    }
  }
  return row;
}

// Defaults applied when a cell is blank — matches EMPTY_FORM/the products
// table's own defaults (Products.jsx:96-105), not a blanket per-type rule.
const BLANK_DEFAULTS = {
  visible: true,
  featured: false,
  status: "published",
  brand: "SAWO",
  spec_table: null,
  sort_order: 0,
};

// A raw parsed CSV row (all string values) -> a DB-ready product object
// (numbers as numbers, booleans as booleans, JSON columns parsed) — this is
// what gets upserted directly, not routed back through form state. Throws
// with a field name on malformed JSON so the dry-run can surface exactly
// which cell is bad.
export function fromCsvRow(row) {
  const product = {};
  for (const col of COLUMNS) {
    const raw = row[col];
    if (raw === undefined || String(raw).trim() === "") {
      product[col] = col in BLANK_DEFAULTS
        ? BLANK_DEFAULTS[col]
        : JSON_COLUMNS.has(col) ? [] : NUMBER_COLUMNS.has(col) ? null : "";
      continue;
    }
    if (JSON_COLUMNS.has(col)) {
      try {
        product[col] = JSON.parse(raw);
      } catch {
        throw new Error(`Column "${col}" is not valid JSON: ${raw.slice(0, 60)}`);
      }
    } else if (BOOLEAN_COLUMNS.has(col)) {
      product[col] = String(raw).trim().toLowerCase() === "true";
    } else if (NUMBER_COLUMNS.has(col)) {
      const n = parseFloat(raw);
      if (Number.isNaN(n)) throw new Error(`Column "${col}" is not a number: ${raw}`);
      product[col] = n;
    } else {
      product[col] = String(raw).trim();
    }
  }
  return product;
}

export function productsToCsvString(products) {
  return Papa.unparse(products.map(toCsvRow), { columns: COLUMNS });
}

// Parses raw CSV text into { rows, headers, errors }. Header mapping (when
// headers don't match COLUMNS) is applied by the caller before fromCsvRow.
export function parseCsvString(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  return {
    rows: result.data,
    headers: result.meta.fields || [],
    errors: result.errors || [],
  };
}

function valuesEqual(col, a, b) {
  if (JSON_COLUMNS.has(col)) return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  if (NUMBER_COLUMNS.has(col)) return String(a ?? "") === String(b ?? "");
  if (BOOLEAN_COLUMNS.has(col)) return !!a === !!b;
  return (a ?? "") === (b ?? "");
}

// Compares an incoming (CSV-derived) product against the existing row with
// the same slug (or null if none exists yet) and returns only the fields
// that actually differ — the shape the dry-run preview renders.
export function diffProductRow(existing, incoming) {
  const changes = {};
  for (const col of COLUMNS) {
    if (col === "slug") continue; // the match key — never itself a "change"
    const before = existing ? existing[col] : undefined;
    const after = incoming[col];
    if (!valuesEqual(col, before, after)) {
      changes[col] = { before: before ?? null, after: after ?? null };
    }
  }
  return changes;
}

// Classifies one parsed CSV row against a Map of existing products keyed by
// slug. Returns { slug, action, changes, error, product }. `action` is one
// of "create" | "update" | "unchanged" | "error" — mirrors the states the
// import dry-run table needs to render.
export function classifyImportRow(rawRow, existingBySlug) {
  const slug = (rawRow.slug || "").trim();
  if (!slug) return { slug: "", action: "error", error: "Missing slug", changes: {}, product: null };
  if (!rawRow.name || !String(rawRow.name).trim()) {
    return { slug, action: "error", error: "Missing name", changes: {}, product: null };
  }
  try {
    const product = fromCsvRow(rawRow);
    const existing = existingBySlug.get(slug) || null;
    const changes = diffProductRow(existing, product);
    const action = !existing ? "create" : Object.keys(changes).length === 0 ? "unchanged" : "update";
    return { slug, action, changes, error: null, product, existingId: existing?.id };
  } catch (err) {
    return { slug, action: "error", error: err.message, changes: {}, product: null };
  }
}

export function downloadCsv(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
