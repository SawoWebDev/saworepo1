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

import { supabase } from "../Administrator/supabase";

/**
 * Fetch all products live from Supabase
 */
export async function getAllProductsLive() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch products:", err);
    return [];
  }
}

/**
 * Fetch all categories live from Supabase
 */
export async function getAllCategoriesLive() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch categories:", err);
    return [];
  }
}

/**
 * Fetch all tags live from Supabase
 */
export async function getAllTagsLive() {
  try {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("[supabaseReader] Failed to fetch tags:", err);
    return [];
  }
}

/**
 * Fetch a single product by ID live from Supabase
 */
export async function getProductByIdLive(id) {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

/**
 * Get visible (published & visible) products live from Supabase
 */
export async function getVisibleProductsLive() {
  try {
    const products = await getAllProductsLive();
    return products.filter(p =>
      p.visible !== false && p.status === 'published'
    );
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
      const { data, error } = await supabase
        .from("products")
        .select("id,name,slug,thumbnail,categories,tags,status,visible,sort_order,features,short_description,files")
        .eq("status", "published")
        .eq("visible", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const products = data || [];

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
