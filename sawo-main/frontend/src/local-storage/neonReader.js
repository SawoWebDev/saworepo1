/**
 * neonReader.js
 * src/local-storage/neonReader.js
 *
 * Read-only counterpart to supabaseReader.js, used only when the CMS's
 * "Data Source" setting (see dataSource.js) is switched to "neon". Neon has
 * no PostgREST layer, so the browser can't query it directly the way it
 * queries Supabase — these hit the Cloudflare Pages Functions proxy at
 * functions/api/neon/* instead (same-origin, no CORS/base-URL needed).
 *
 * Only covers what those Pages Functions actually expose: full-table reads
 * of products/categories/tags/sauna_rooms. There is no Neon equivalent yet
 * for trash, "recent", or single-row-by-slug queries — callers needing
 * those should filter the full list client-side, same as this module's own
 * getVisibleProductsLive below does.
 */

async function fetchTable(route) {
  const res = await fetch(`/api/neon/${route}`);
  if (!res.ok) throw new Error(`Neon read failed (${route}): HTTP ${res.status}`);
  const { data } = await res.json();
  return data || [];
}

export async function getAllProductsLive() {
  try {
    return await fetchTable("products");
  } catch (err) {
    console.error("[neonReader] Failed to fetch products:", err);
    return [];
  }
}

export async function getAllCategoriesLive() {
  try {
    return await fetchTable("categories");
  } catch (err) {
    console.error("[neonReader] Failed to fetch categories:", err);
    return [];
  }
}

export async function getAllTagsLive() {
  try {
    return await fetchTable("tags");
  } catch (err) {
    console.error("[neonReader] Failed to fetch tags:", err);
    return [];
  }
}

export async function getAllSaunaRoomsLive() {
  try {
    return await fetchTable("sauna-rooms");
  } catch (err) {
    console.error("[neonReader] Failed to fetch sauna rooms:", err);
    return [];
  }
}
