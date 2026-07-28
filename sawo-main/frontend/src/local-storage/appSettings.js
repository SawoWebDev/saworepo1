/**
 * appSettings.js
 * src/local-storage/appSettings.js
 *
 * One batched read of every public `app_settings` row.
 *
 * Each setting used to fetch its own key(s), so a single public page load
 * fired FIVE separate REST round trips to Supabase — dataSource (2 keys),
 * headerLayout (1), headerNavStyle (1), gdprSettings (1) and
 * languageSettings (2) — for what is one read of one table. Against a
 * project in ap-southeast-2 that's five lots of DNS/TLS/latency on every
 * cold visit, competing with the assets that actually matter for first paint.
 *
 * This module coalesces them: whichever setting asks first triggers ONE
 * request for all public keys, and everything else that render shares the
 * same in-flight promise. Net effect on a cold load: 5 round trips -> 1.
 *
 * Plain REST fetch, not the supabase-js SDK — this runs on every public
 * cold visit and going through getSupabase() would pull the ~50KB-gzip SDK
 * chunk just to read a handful of rows. The SDK stays admin-only (setters).
 *
 * Two distinct reads are exposed, and the difference matters:
 *   - getCachedSettings()  synchronous, ignores the TTL. For first paint.
 *   - getSettings()        async, TTL-checked. Revalidates.
 * The TTL governs when to REFETCH, never what to PAINT. Conflating those is
 * what made the header visibly flash its default before the admin's actual
 * selection appeared (see headerLayout.js).
 */

const CACHE_STORAGE_KEY = "sawo_app_settings_cache_v1";
const CACHE_MS = 30 * 1000; // 30s — a CMS toggle takes effect within seconds

// Every key any PUBLIC page reads. Admin-only settings (e.g. role_capabilities)
// stay out: they'd add payload to every visitor's request for nothing.
// header_layout / header_nav_style are deliberately absent: the public header
// is fixed in code at Layout 1 + Style 2 (components/Header/Header.jsx), so
// fetching them would be payload no one reads. The rows still exist in the
// table if the CMS switch is ever restored.
const PUBLIC_KEYS = [
  "data_source",
  "json_source_scope",
  "gdpr_banner_enabled",
  "language_switcher_enabled",
  "enabled_languages",
];

let memCache = null; // { [key]: value }
let memCacheTime = 0;
let inflight = null; // dedupes concurrent callers into one request

function readStorage() {
  try {
    const cached = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed.value === "object") return parsed;
  } catch {}
  return null;
}

function writeCache(byKey, time) {
  memCache = byKey;
  memCacheTime = time;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value: byKey, time }));
  } catch {}
}

/**
 * Last-known settings, synchronously, regardless of cache age.
 *
 * Returns null only when nothing has ever been cached (genuine first visit),
 * in which case callers should fall back to their own documented default.
 */
export function getCachedSettings() {
  if (memCache) return memCache;
  const stored = readStorage();
  if (stored) {
    // Warm memCache but deliberately NOT memCacheTime — leaving the timestamp
    // at 0 keeps getSettings() treating this as expired, so a stale value is
    // painted immediately but still revalidated on mount.
    memCache = stored.value;
    return memCache;
  }
  return null;
}

/**
 * Fresh settings, revalidating if the cache has expired. Concurrent callers
 * within one render share a single request.
 */
export async function getSettings() {
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
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_settings` +
          `?key=in.(${PUBLIC_KEYS.join(",")})&select=key,value`,
        {
          headers: {
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const byKey = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
      writeCache(byKey, Date.now());
      return byKey;
    } catch (err) {
      console.warn("[appSettings] Failed to read settings:", err.message);
      // Return whatever we last knew; each caller validates and applies its
      // own default for anything missing.
      return memCache || {};
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Update one key in the cache after a setter has written it to Supabase, so
 * the change is reflected immediately without waiting for the TTL to lapse.
 */
export function primeSetting(key, value) {
  const next = { ...(memCache || {}), [key]: value };
  writeCache(next, Date.now());
}

/** Read one key from the sync cache, validated. Returns null if unusable. */
export function pickCached(key, validValues) {
  const all = getCachedSettings();
  const raw = all?.[key];
  return validValues.includes(raw) ? raw : null;
}
