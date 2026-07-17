/**
 * cacheReader.js
 * src/local-storage/cacheReader.js
 *
 * Frontend cache for products, categories, and site content.
 * Fetches from Supabase (products) or raw GitHub JSON (site_content) once,
 * then caches in localStorage for 1 hour. Zero egress for subsequent views.
 *
 * ─── USAGE ────────────────────────────────────────────────────────────────────
 *  import { getVisibleProducts, getCachedProducts, refreshCache } from '../local-storage/cacheReader';
 *  import { getSiteContent, refreshSiteContent }                  from '../local-storage/cacheReader';
 *
 *  // Get visible products (with auto-fetch if expired)
 *  const products = await getVisibleProducts();
 *
 *  // Get home page content (fetches raw GitHub JSON, caches 1 hour)
 *  const homeContent = await getSiteContent('home');
 *
 *  // Force refresh site content cache
 *  await refreshSiteContent();
 */

import { getAllProductsLive } from "./supabaseReader";
import { getDataSource } from "./dataSource";
import { getSupabase } from "./supabaseClient";

// ─── Site Content ───────────────────────────────────────────────────────────
// Reads from the GitHub-synced site_content.json by default, or live Supabase
// rows when the admin has flipped the "Live Data Source" toggle to Supabase
// (see dataSource.js). Either way the result is cached in localStorage for 1hr.

const GITHUB_OWNER    = process.env.REACT_APP_GITHUB_OWNER    || "jmesrafael";
const GITHUB_MAIN_REPO = process.env.REACT_APP_MAIN_REPO      || "saworepo1";

const SITE_CONTENT_URL =
  `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_MAIN_REPO}/main/sawo-main/frontend/src/Administrator/Local/data/site_content.json`;

const SITE_CONTENT_CACHE_KEY       = "sawo_site_content_cache";
const SITE_CONTENT_TIMESTAMP_KEY   = "sawo_site_content_timestamp";
const SITE_CONTENT_CACHE_DURATION  = 60 * 60 * 1000; // 1 hour

/**
 * Fetch the full site_content.json from GitHub (or return localStorage cache).
 * Returns the parsed JSON object  { home: { hero: {…}, section1: {…}, … }, … }
 */
export async function refreshSiteContent() {
  try {
    const source = await getDataSource();
    let json;

    if (source === "supabase") {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from("site_content").select("page, section, data");
      if (error) throw new Error(error.message);
      json = {};
      for (const row of data || []) {
        if (!json[row.page]) json[row.page] = {};
        json[row.page][row.section] = row.data;
      }
    } else {
      const res = await fetch(SITE_CONTENT_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    }

    localStorage.setItem(SITE_CONTENT_CACHE_KEY,     JSON.stringify(json));
    localStorage.setItem(SITE_CONTENT_TIMESTAMP_KEY, Date.now().toString());
    return json;
  } catch (err) {
    console.warn("[cacheReader] Could not fetch site_content.json — using stale cache or empty.", err.message);
    const stale = localStorage.getItem(SITE_CONTENT_CACHE_KEY);
    return stale ? JSON.parse(stale) : {};
  }
}

/**
 * Get site content for a specific page (e.g. 'home').
 * Returns an object keyed by section: { hero: {…}, section1: {…}, … }
 * Falls back gracefully to {} so all components still work with fallback values.
 *
 * @param {string} page  - e.g. 'home', 'about'
 */
export async function getSiteContent(page = "home") {
  const cached    = localStorage.getItem(SITE_CONTENT_CACHE_KEY);
  const timestamp = localStorage.getItem(SITE_CONTENT_TIMESTAMP_KEY);
  const now       = Date.now();

  let allContent;

  if (cached && timestamp && now - parseInt(timestamp) < SITE_CONTENT_CACHE_DURATION) {
    allContent = JSON.parse(cached);
  } else {
    allContent = await refreshSiteContent();
  }

  return allContent?.[page] ?? {};
}

/**
 * Synchronous, zero-network read of the localStorage site-content cache.
 * Lets the homepage paint cached CMS content immediately while deferring any
 * network refresh (and the Supabase SDK chunk it may pull) until after
 * load+idle, so nothing competes with the LCP image on slow connections.
 *
 * @returns {{ data: object|null, fresh: boolean }}
 *   data  — the page's section map, or null when nothing is cached
 *   fresh — false means the caller should schedule a deferred getSiteContent()
 */
export function getCachedSiteContentSync(page = "home") {
  try {
    const cached    = localStorage.getItem(SITE_CONTENT_CACHE_KEY);
    const timestamp = localStorage.getItem(SITE_CONTENT_TIMESTAMP_KEY);
    if (!cached) return { data: null, fresh: false };
    const fresh =
      !!timestamp && Date.now() - parseInt(timestamp) < SITE_CONTENT_CACHE_DURATION;
    return { data: JSON.parse(cached)?.[page] ?? {}, fresh };
  } catch {
    return { data: null, fresh: false };
  }
}

/**
 * Force-clear the site content cache (useful after an admin sync).
 */
export function clearSiteContentCache() {
  localStorage.removeItem(SITE_CONTENT_CACHE_KEY);
  localStorage.removeItem(SITE_CONTENT_TIMESTAMP_KEY);
}

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
