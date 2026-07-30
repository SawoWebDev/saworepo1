/**
 * pageSeo.js
 * src/local-storage/pageSeo.js
 *
 * CMS-editable SEO overrides for the ~42 static hub/category pages (Home,
 * /sauna/heaters, /contact, /about, etc.) whose title/description otherwise
 * live hard-coded in each page's own <SEO title="..." description="..." />
 * call. Companion to the per-product/per-room override columns already on
 * the `products`/`sauna_rooms` tables (see setup-seo-fields.sql and their
 * use in DispProduct.jsx / DispAccessories.jsx / DispSaunaRoom.jsx) — this
 * covers everything that ISN'T a product/room detail page.
 *
 * Same batched-read-once, cache-with-TTL shape as appSettings.js: one
 * request for the whole `page_seo` table on whichever page loads first,
 * shared by every subsequent <SEO> mount on that page load and reused
 * (subject to the TTL) across client-side route changes. Plain REST fetch,
 * not the supabase-js SDK — this runs on every public page load and the SDK
 * chunk is admin-only (see appSettings.js for the same reasoning).
 */

const CACHE_STORAGE_KEY = "sawo_page_seo_cache_v1";
const CACHE_MS = 30 * 1000; // matches appSettings.js — CMS edits take effect within seconds

let memCache = null; // { [path]: { meta_title, meta_description, og_image } }
let memCacheTime = 0;
let inflight = null;

function readStorage() {
  try {
    const cached = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed.value === "object") return parsed;
  } catch {}
  return null;
}

function writeCache(byPath, time) {
  memCache = byPath;
  memCacheTime = time;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value: byPath, time }));
  } catch {}
}

/** Last-known overrides map, synchronously, regardless of cache age. */
export function getCachedPageSeoMap() {
  if (memCache) return memCache;
  const stored = readStorage();
  if (stored) {
    memCache = stored.value;
    return memCache;
  }
  return null;
}

/** Fresh overrides map, revalidating if the cache has expired. */
export async function getPageSeoMap() {
  const now = Date.now();
  if (memCache && now - memCacheTime < CACHE_MS) return memCache;

  const stored = readStorage();
  if (stored && now - stored.time < CACHE_MS) {
    writeCache(stored.value, stored.time);
    return stored.value;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/page_seo` +
          `?select=path,meta_title,meta_description,og_image`,
        {
          headers: {
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const byPath = Object.fromEntries((rows || []).map((r) => [r.path, r]));
      writeCache(byPath, Date.now());
      return byPath;
    } catch (err) {
      // Table may not exist yet (setup-page-seo.sql not run) — fail open,
      // exactly like appSettings.js: every page just keeps its hard-coded
      // <SEO> props, nothing breaks.
      console.warn("[pageSeo] Failed to read overrides:", err.message);
      return memCache || {};
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** One page's override, or null if none set. Convenience wrapper for SEO.jsx. */
export async function getPageSeoOverride(path) {
  const all = await getPageSeoMap();
  const row = all?.[path];
  if (!row) return null;
  const { meta_title, meta_description, og_image } = row;
  if (!meta_title && !meta_description && !og_image) return null;
  return { title: meta_title || null, description: meta_description || null, image: og_image || null };
}

/** Update the cache after a save in the admin CMS, so it reflects immediately. */
export function primePageSeo(path, row) {
  const next = { ...(memCache || {}), [path]: row };
  writeCache(next, Date.now());
}
