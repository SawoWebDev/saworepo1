/**
 * cacheReader.js
 * src/local-storage/cacheReader.js
 *
 * Frontend cache for products and categories.
 * Fetches from Supabase once and caches in localStorage for 1 hour.
 * Zero egress for subsequent searches/views.
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 *  import { getVisibleProducts, getCachedProducts, refreshCache } from '../local-storage/cacheReader';
 *
 *  // Get visible products (with auto-fetch if expired)
 *  const products = await getVisibleProducts();
 *
 *  // Force refresh cache
 *  await refreshCache();
 */

import { getAllProductsLive } from "./supabaseReader";

const CACHE_KEYS = {
  products: "sawo_products_cache",
  timestamp: "sawo_products_timestamp",
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get all cached products (fetches from Supabase if cache expired/missing)
 */
export async function getCachedProducts() {
  const cached = localStorage.getItem(CACHE_KEYS.products);
  const timestamp = localStorage.getItem(CACHE_KEYS.timestamp);
  const now = Date.now();

  // Return cached if valid
  if (cached && timestamp && now - parseInt(timestamp) < CACHE_DURATION) {
    return JSON.parse(cached);
  }

  // Fetch fresh from Supabase
  return await refreshCache();
}

/**
 * Get only visible (published & visible) cached products
 */
export async function getVisibleProducts() {
  const products = await getCachedProducts();
  return products.filter(
    (p) => p.visible !== false && p.status === "published"
  );
}

/**
 * Search cached products by query
 */
export async function searchProducts(query) {
  const products = await getVisibleProducts();
  const q = query.toLowerCase().trim();

  if (!q) return products;

  return products.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.short_description?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.categories?.some((cat) => cat.toLowerCase().includes(q))
  );
}

/**
 * Force refresh cache from Supabase
 */
export async function refreshCache() {
  try {
    const products = await getAllProductsLive();
    localStorage.setItem(CACHE_KEYS.products, JSON.stringify(products));
    localStorage.setItem(CACHE_KEYS.timestamp, Date.now().toString());
    return products;
  } catch (err) {
    console.error("[cacheReader] Failed to refresh cache:", err);
    // Fall back to stale cache if Supabase fails
    const cached = localStorage.getItem(CACHE_KEYS.products);
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Clear cache
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEYS.products);
  localStorage.removeItem(CACHE_KEYS.timestamp);
}
