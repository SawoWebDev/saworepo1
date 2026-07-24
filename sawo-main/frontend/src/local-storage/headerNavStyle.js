/**
 * headerNavStyle.js
 * src/local-storage/headerNavStyle.js
 *
 * Global switch controlling how the header's top-level nav items look on
 * hover/active, independent of headerLayout.js's nav *structure* toggle:
 *   "style1" — growing underline beneath the item (current default).
 *   "style2" — solid brand-brown pill behind the item, beveled like the
 *              admin CMS's .btn-primary buttons.
 *
 * Same app_settings table / read-cache pattern as headerLayout.js and
 * dataSource.js, so it can be flipped from the admin CMS and take effect
 * for visitors within seconds, no redeploy needed.
 */

import { getSupabase } from "./supabaseClient";

const KEY = "header_nav_style";
const CACHE_STORAGE_KEY = "sawo_header_nav_style_cache_v1";
const CACHE_MS = 30 * 1000; // 30s

const VALID_STYLES = ["style1", "style2"];

let memCache = null;
let memCacheTime = 0;

async function readSetting() {
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
    const res = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_settings?key=eq.${KEY}&select=value`,
      {
        headers: {
          apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const raw = rows?.[0]?.value;
    const value = VALID_STYLES.includes(raw) ? raw : "style1";

    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[headerNavStyle] Failed to read setting, defaulting to 'style1':", err.message);
    return memCache || "style1";
  }
}

export async function getHeaderNavStyle() {
  return readSetting();
}

export async function setHeaderNavStyle(value, username = null) {
  if (!VALID_STYLES.includes(value)) {
    throw new Error(`Invalid header nav style: ${value}`);
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY, value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  memCache = value;
  memCacheTime = Date.now();
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: memCacheTime }));
}
