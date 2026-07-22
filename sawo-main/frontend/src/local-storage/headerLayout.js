/**
 * headerLayout.js
 * src/local-storage/headerLayout.js
 *
 * Global switch controlling which of the two site header nav structures is
 * shown to public visitors:
 *   "layout1" — Sauna / Steam / Infrared / Support / Contact Us / About Us /
 *               Careers as separate top-level items (Sauna and Steam each
 *               carry their own dropdown).
 *   "layout2" — the current header: a single "Products" mega-menu covering
 *               Sauna/Steam/Infrared, plus Support / About Us (with Careers
 *               nested under About Us) / Contact Us. Default.
 *
 * The setting lives in the same app_settings table as the "Live Data
 * Source" toggle (see dataSource.js and
 * Administrator/Local/scripts/setup-app-settings.sql), so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy. Cached briefly so we don't hit Supabase on every
 * render, but short enough that a toggle takes effect within seconds.
 */

import { getSupabase } from "./supabaseClient";

const KEY = "header_layout";
const CACHE_STORAGE_KEY = "sawo_header_layout_cache_v1";
const CACHE_MS = 30 * 1000; // 30s

const VALID_LAYOUTS = ["layout1", "layout2"];

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
    // Plain REST fetch (same pattern as dataSource.js) so public pages don't
    // pull the supabase-js SDK just to read one settings row.
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
    const value = VALID_LAYOUTS.includes(raw) ? raw : "layout2";

    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[headerLayout] Failed to read setting, defaulting to 'layout2':", err.message);
    return memCache || "layout2";
  }
}

export async function getHeaderLayout() {
  return readSetting();
}

export async function setHeaderLayout(value, username = null) {
  if (!VALID_LAYOUTS.includes(value)) {
    throw new Error(`Invalid header layout: ${value}`);
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
