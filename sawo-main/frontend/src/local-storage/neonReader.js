/**
 * neonReader.js
 * src/local-storage/neonReader.js
 *
 * Read-only counterpart to supabaseReader.js — Neon has no PostgREST
 * layer, so the browser can't query it directly the way it queries
 * Supabase; these hit the Cloudflare Pages Functions proxy at
 * functions/api/neon/* instead (same-origin, no CORS/base-URL needed).
 * Reached two ways: the CMS's superadmin-only "Data Source" test toggle
 * (dataSource.js), or automatically as a fallback when Supabase fails
 * (see readWithFallback in supabaseReader.js, which owns all
 * logging/catching for both sources — this module deliberately lets
 * fetch failures throw rather than swallowing them into `[]`, so a real
 * Neon outage is distinguishable from a genuinely-empty table).
 *
 * Only covers what those Pages Functions actually expose: full-table reads
 * of products/categories/tags/sauna_rooms. There is no Neon equivalent yet
 * for trash, "recent", or single-row-by-slug queries.
 */

async function fetchTable(route) {
  const res = await fetch(`/api/neon/${route}`);
  if (!res.ok) throw new Error(`Neon read failed (${route}): HTTP ${res.status}`);
  const { data } = await res.json();
  return data || [];
}

export function getAllProductsLive() {
  return fetchTable("products");
}

export function getAllCategoriesLive() {
  return fetchTable("categories");
}

export function getAllTagsLive() {
  return fetchTable("tags");
}

export function getAllSaunaRoomsLive() {
  return fetchTable("sauna-rooms");
}
