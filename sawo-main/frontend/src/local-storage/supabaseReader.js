/**
 * supabaseReader.js
 * src/local-storage/supabaseReader.js
 *
 * Fetches live product/category/tag/sauna-room data — used by BOTH the
 * admin CMS (direct, uncached, for editorial freshness) and public pages
 * (via useLocalProducts.js/useLocalSaunaRooms.js, which wrap these calls
 * in a 24h localStorage-backed cache — see publicDataCache.js). Routes
 * each read to Supabase or Neon per the CMS's Data Source setting
 * (dataSource.js), with an automatic fallback to the other source on a
 * real read failure — see readWithFallback below.
 *
 * cacheReader.js is a separate, narrower cache used only by the header
 * search box (components/Header/SearchBar.jsx) — not a general frontend
 * caching layer.
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 *  import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from '../local-storage/supabaseReader';
 *  const products = await getAllProductsLive();
 */

import { getSupabase } from "./supabaseClient";
import { isPubliclyVisible } from "./visibility";
import { getDataSource } from "./dataSource";
import * as neonReader from "./neonReader";

/**
 * The columns the admin Products list actually renders: card/table cells,
 * the search filter, the heater/accessory grouping, and the Model
 * autocomplete. Deliberately excludes the heavy per-row payload
 * (description, short_description, spec_table, images, spec_images,
 * variants, variations, resources, heating_element_groups, included_items,
 * features) — those are ~74% of this table's wire size and none of them are
 * read until a row is opened.
 *
 * Anything needing a whole row — the edit modal, the preview modal, CSV
 * import/export, bulk operations — fetches it by id/slug instead of
 * expecting the list to have carried it. Adding a heavy column back here
 * silently restores the old cost, so put in this list only what the list
 * itself renders.
 */
export const PRODUCT_LIST_COLUMNS = [
  "id", "name", "slug", "thumbnail", "status", "visible", "featured",
  "sort_order", "created_at", "created_by_username", "publish_at",
  "categories", "tags", "brand", "type", "files",
].join(", ");

/**
 * Fetch every product live, list columns only — the default admin Products
 * view. See PRODUCT_LIST_COLUMNS for why this is not select("*").
 */
export async function getProductsListLive() {
  try {
    const { data, error } = await (await getSupabase())
      .from("products")
      .select(PRODUCT_LIST_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch product list:", err);
    return [];
  }
}

/**
 * Tries the selected primary source first (per the Data Source setting);
 * on a real failure — thrown error, not just an unusually-empty result —
 * automatically retries the other source before giving up. This is what
 * makes Neon an actual safety net for "products don't show" rather than a
 * manually-flipped toggle only: a genuine Supabase outage now degrades to
 * Neon automatically instead of the page silently rendering nothing.
 * Deliberately does NOT fall back on a merely-empty success (an empty
 * table is a valid real state, not a failure) — only on a thrown error.
 */
async function readWithFallback(label, supabaseFn, neonFn) {
  const source = await getDataSource();
  const [primaryName, primary, fallbackName, fallback] =
    source === "neon"
      ? ["Neon", neonFn, "Supabase", supabaseFn]
      : ["Supabase", supabaseFn, "Neon", neonFn];

  try {
    console.info(`[dataSource] Reading "${label}" from ${primaryName}`);
    return await primary();
  } catch (err) {
    console.error(`[dataSource] ${primaryName} read failed for "${label}", falling back to ${fallbackName}:`, err);
    try {
      const data = await fallback();
      console.info(`[dataSource] Fallback to ${fallbackName} for "${label}" succeeded`);
      return data;
    } catch (err2) {
      console.error(`[dataSource] ${fallbackName} fallback also failed for "${label}":`, err2);
      return [];
    }
  }
}

async function fetchProductsFromSupabase() {
  const { data, error } = await (await getSupabase())
    .from("products")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch all products live — from whichever source is primary (see
 * dataSource.js), with an automatic fallback to the other source on a
 * real read failure. See readWithFallback above.
 */
export async function getAllProductsLive() {
  return readWithFallback("products", fetchProductsFromSupabase, neonReader.getAllProductsLive);
}

/**
 * Fetch every product_translations row for one locale, keyed by product_id
 * — see Administrator/Local/scripts/setup-product-translations.sql. A
 * product with no row here just isn't translated yet; callers merge this
 * on top of getAllProductsLive()'s English rows and keep the English value
 * for any field (name/short_description/description) this row leaves null,
 * rather than showing a blank.
 */
export async function getProductTranslationsLive(locale) {
  if (!locale || locale === "en") return {};
  try {
    const { data, error } = await (await getSupabase())
      .from("product_translations")
      .select("product_id, name, short_description, description, type, features, spec_table, variations, included_items")
      .eq("locale", locale);

    if (error) throw error;
    const byProductId = {};
    for (const row of data || []) byProductId[row.product_id] = row;
    return byProductId;
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch product translations:", err);
    return {};
  }
}

/**
 * Fetch soft-deleted products still within their retention window — backs
 * the admin Trash page. See purge_expired_trash() (scheduled via pg_cron,
 * daily) for what actually removes a row once its 30 days are up.
 */
export async function getTrashedProductsLive() {
  try {
    const { data, error } = await (await getSupabase())
      .from("products")
      .select("*")
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch trashed products:", err);
    return [];
  }
}

/**
 * Fetch only recently-created products live from Supabase — the admin
 * Products list's default view. products.select("*") pulls every row's
 * images/spec_images/description/spec_table/etc, so pulling the whole
 * table on every visit is real egress; most admin visits only care about
 * what was just added. Filtering server-side (not fetch-all-then-slice)
 * is what actually avoids downloading the rest of the table.
 */
export async function getRecentProductsLive(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await (await getSupabase())
      .from("products")
      .select("*")
      .eq("is_deleted", false)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch recent products:", err);
    return [];
  }
}

async function fetchCategoriesFromSupabase() {
  const { data, error } = await (await getSupabase())
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch all categories live — see getAllProductsLive.
 */
export async function getAllCategoriesLive() {
  return readWithFallback("categories", fetchCategoriesFromSupabase, neonReader.getAllCategoriesLive);
}

async function fetchTagsFromSupabase() {
  const { data, error } = await (await getSupabase())
    .from("tags")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch all tags live — see getAllProductsLive.
 */
export async function getAllTagsLive() {
  return readWithFallback("tags", fetchTagsFromSupabase, neonReader.getAllTagsLive);
}

/**
 * Fetch a single product by ID live from Supabase
 */
export async function getProductByIdLive(id) {
  try {
    const { data, error } = await (await getSupabase())
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch product:", err);
    return null;
  }
}

/**
 * Fetch a single product by slug live from Supabase
 */
export async function getProductBySlugLive(slug) {
  try {
    const { data, error } = await (await getSupabase())
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch product by slug:", err);
    return null;
  }
}

async function fetchSaunaRoomsFromSupabase() {
  const { data, error } = await (await getSupabase())
    .from("sauna_rooms")
    .select("*")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch all sauna rooms live (mirrors the GitHub-synced saunaroom-data.json
 * shape/filter used by useLocalSaunaRooms) — see getAllProductsLive.
 */
export async function getAllSaunaRoomsLive() {
  return readWithFallback("sauna_rooms", fetchSaunaRoomsFromSupabase, neonReader.getAllSaunaRoomsLive);
}

/**
 * Fetch soft-deleted sauna rooms still within their retention window — backs
 * the admin Trash page. See purge_expired_trash() (scheduled via pg_cron,
 * daily) for what actually removes a row once its 30 days are up.
 */
export async function getTrashedSaunaRoomsLive() {
  try {
    const { data, error } = await (await getSupabase())
      .from("sauna_rooms")
      .select("*")
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch trashed sauna rooms:", err);
    return [];
  }
}

/**
 * Fetch only recently-created sauna rooms live from Supabase — same egress
 * rationale as getRecentProductsLive above; sauna_rooms rows are just as
 * heavy (images, spec_images, configurations, door_options, feature_tabs).
 */
export async function getRecentSaunaRoomsLive(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await (await getSupabase())
      .from("sauna_rooms")
      .select("*")
      .eq("is_deleted", false)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch recent sauna rooms:", err);
    return [];
  }
}

/**
 * Get visible (published & visible) products live from Supabase
 */
export async function getVisibleProductsLive() {
  try {
    const products = await getAllProductsLive();
    return products.filter(isPubliclyVisible);
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch visible products:", err);
    return [];
  }
}

/**
 * Search products live from Supabase
 */
export async function searchProductsLive(query) {
  try {
    const products = await getAllProductsLive();
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.short_description?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  } catch (err) {
    console.error("[supabaseReader] Failed to search products:", err);
    return [];
  }
}

