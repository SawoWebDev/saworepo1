/**
 * supabaseReader.js
 * src/local-storage/supabaseReader.js
 *
 * Fetches live data from Supabase for the Administrator CMS.
 * Used only in the admin panel to show real-time data.
 * The frontend continues to use cacheReader.js (local cache).
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 *  import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from '../local-storage/supabaseReader';
 *
 *  // In admin CMS:
 *  const products = await getAllProductsLive();
 *
 *  // In frontend:
 *  import { getAllProducts } from '../local-storage/cacheReader';
 *  const products = getAllProducts();
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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SMART CACHING LAYER — Reduces egress via memory, localStorage, and selective fields
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "sawo_visible_products_v1";
let _cache = null;
let _cacheTime = 0;
let _inflight = null;

/**
 * Get visible products with smart caching.
 * Checks: memory (this session) → localStorage (5 min TTL) → Supabase
 * Fetches selective fields to reduce egress by ~60-70%
 * Deduplicates in-flight requests.
 *
 * @param {boolean} force - Skip caches, force fresh Supabase fetch
 * @returns {Promise<Array>} Array of visible published products
 */
export async function getVisibleProductsCached(force = false) {
  const now = Date.now();

  // ─── Step 1: Check in-memory cache (fastest, deduplicates concurrent requests) ───
  if (!force && _inflight) {
    // Concurrent request in-flight, reuse same Promise
    return _inflight;
  }

  if (!force && _cache && (now - _cacheTime) < CACHE_TTL_MS) {
    // In-memory cache still fresh
    return _cache;
  }

  // ─── Step 2: Check localStorage cache (survives page refresh) ───
  if (!force) {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const { data, time } = JSON.parse(stored);
        if (data && (now - time) < CACHE_TTL_MS) {
          // localStorage cache still fresh; hydrate memory for this session
          _cache = data;
          _cacheTime = time;
          return data;
        }
      }
    } catch (err) {
      console.warn("[supabaseReader] localStorage parse failed:", err);
    }
  }

  // ─── Step 3: Fetch from Supabase (with selective fields to reduce egress) ───
  const fetchPromise = (async () => {
    try {
      // No server-side status filter — a scheduled draft (status="draft" +
      // future publish_at) must still be fetched so it can flip visible at
      // the right moment client-side; isPubliclyVisible() below is the
      // actual gate. .eq("visible", true) alone is safe to keep server-side
      // since that flag never interacts with scheduling.
      const { data, error } = await (await getSupabase())
        .from("products")
        .select("id,name,slug,thumbnail,categories,tags,status,visible,publish_at,sort_order,features,short_description,files")
        .eq("visible", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const products = (data || []).filter(isPubliclyVisible);

      // ─── Write to both caches ───
      _cache = products;
      _cacheTime = now;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: products, time: now }));
      } catch (e) {
        console.warn("[supabaseReader] localStorage write failed (quota?):", e);
      }

      return products;
    } catch (err) {
      console.error("[supabaseReader] Failed to fetch visible products:", err);
      return [];
    } finally {
      _inflight = null;
    }
  })();

  _inflight = fetchPromise;
  return fetchPromise;
}


/**
 * Bust the cached products (call after admin sync to force refresh)
 */
export function bustProductCache() {
  _cache = null;
  _cacheTime = 0;
  _inflight = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    // ignore
  }
}
