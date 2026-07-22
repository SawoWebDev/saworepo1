/**
 * gdprSettings.js
 * src/local-storage/gdprSettings.js
 *
 * Global switch controlling whether the GDPR consent banner
 * (components/GDPRConsent.jsx) renders on the public site.
 *
 * Same pattern as languageSettings.js / dataSource.js: lives in the
 * app_settings table so it can be flipped from the admin CMS and take
 * effect immediately for visitors, without a redeploy.
 *
 * Defaults to disabled (false) — matches the banner's prior state (it was
 * commented out entirely in App.jsx before this toggle existed). Enabling
 * it is an explicit admin choice, not a silent behavior change.
 */

import { getSupabase } from "./supabaseClient";

const KEY_ENABLED = "gdpr_banner_enabled";
const CACHE_STORAGE_KEY = "sawo_gdpr_settings_cache_v1";
const CACHE_MS = 30 * 1000; // 30s

let memCache = null; // boolean
let memCacheTime = 0;

async function readEnabled() {
  const now = Date.now();
  if (memCache !== null && now - memCacheTime < CACHE_MS) return memCache;

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
    // Plain REST fetch (same pattern as dataSource.js / languageSettings.js)
    // so public pages don't pull the supabase-js SDK just to read one flag.
    const res = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_settings?key=eq.${KEY_ENABLED}&select=value`,
      {
        headers: {
          apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const enabled = typeof rows?.[0]?.value === "boolean" ? rows[0].value : false;

    memCache = enabled;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value: enabled, time: now }));
    return enabled;
  } catch (err) {
    console.warn("[gdprSettings] Failed to read setting, defaulting to disabled:", err.message);
    return memCache ?? false;
  }
}

export async function getGDPRBannerEnabled() {
  return readEnabled();
}

export async function setGDPRBannerEnabled(value, username = null) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_ENABLED, value: !!value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  memCache = !!value;
  memCacheTime = Date.now();
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value: memCache, time: memCacheTime }));
}
