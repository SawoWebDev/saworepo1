/**
 * languageSettings.js
 * src/local-storage/languageSettings.js
 *
 * Global switch controlling the public site's language switcher (the new
 * Next.js frontend, frontend-next/): whether it's shown at all, and which
 * of the built locales appear in it.
 *
 * "Built" locales are the ones the frontend-next app actually ships
 * (see frontend-next/src/translation/routing.js) — this setting only
 * controls VISIBILITY of a subset of them, not which locales exist.
 * Adding a brand-new language is still a build-time change over there.
 * A hidden locale's pages still exist and stay in the sitemap/hreflang —
 * this is a display toggle, not a routing/SEO change.
 *
 * The setting lives in the same app_settings table as the "Live Data
 * Source" toggle (see dataSource.js and
 * Administrator/Local/scripts/setup-app-settings.sql), so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy.
 */

import { getSupabase } from "./supabaseClient";

const KEY_ENABLED = "language_switcher_enabled";
const KEY_LANGUAGES = "enabled_languages";
const CACHE_STORAGE_KEY = "sawo_language_settings_cache_v1";
const CACHE_MS = 30 * 1000; // 30s

// Kept in sync by hand with frontend-next/src/translation/routing.js `locales`.
export const BUILT_LOCALES = ["en", "fi", "de"];

let memCache = null; // { enabled, languages }
let memCacheTime = 0;

function sanitizeLanguages(value) {
  if (!Array.isArray(value)) return [...BUILT_LOCALES];
  const filtered = value.filter((loc) => BUILT_LOCALES.includes(loc));
  return filtered.length > 0 ? filtered : [...BUILT_LOCALES];
}

async function readSettings() {
  const now = Date.now();
  if (memCache && now - memCacheTime < CACHE_MS) return memCache;

  try {
    const cached = localStorage.getItem(CACHE_STORAGE_KEY);
    if (cached) {
      const { value, time } = JSON.parse(cached);
      if (now - time < CACHE_MS) {
        memCache = value;
        memCacheTime = time;
        return value;
      }
    }
  } catch {}

  try {
    // Plain REST fetch (same pattern as dataSource.js) so public pages don't
    // pull the supabase-js SDK just to read two settings rows.
    const res = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_settings?key=in.(${KEY_ENABLED},${KEY_LANGUAGES})&select=key,value`,
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

    const enabled = typeof byKey[KEY_ENABLED] === "boolean" ? byKey[KEY_ENABLED] : true;
    const languages = sanitizeLanguages(byKey[KEY_LANGUAGES]);

    const value = { enabled, languages };
    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[languageSettings] Failed to read settings, defaulting to all-enabled:", err.message);
    return memCache || { enabled: true, languages: [...BUILT_LOCALES] };
  }
}

export async function getLanguageSwitcherEnabled() {
  const { enabled } = await readSettings();
  return enabled;
}

export async function getEnabledLanguages() {
  const { languages } = await readSettings();
  return languages;
}

function updateCache(partial) {
  const value = { enabled: true, languages: [...BUILT_LOCALES], ...(memCache || {}), ...partial };
  memCache = value;
  memCacheTime = Date.now();
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: memCacheTime }));
}

export async function setLanguageSwitcherEnabled(value, username = null) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_ENABLED, value: !!value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  updateCache({ enabled: !!value });
}

export async function setEnabledLanguages(value, username = null) {
  const languages = sanitizeLanguages(value);
  if (languages.length === 0) {
    throw new Error("At least one language must remain enabled.");
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_LANGUAGES, value: languages, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  updateCache({ languages });
}
