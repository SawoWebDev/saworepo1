/**
 * dataSource.js
 * src/local-storage/dataSource.js
 *
 * Global switch controlling where the public frontend reads product,
 * sauna room, and site content data from:
 *   "github"   — the GitHub-synced JSON snapshot (raw.githubusercontent.com
 *                / bundled products.json). Current default behavior.
 *   "supabase" — live Supabase rows, direct and instant, no sync step.
 *
 * The setting itself lives in the app_settings table (see
 * Administrator/Local/scripts/setup-app-settings.sql) so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy. Cached briefly so we don't hit Supabase on every
 * render, but short enough that a toggle takes effect within seconds.
 */

import { supabase } from "../Administrator/supabase";

const KEY = "data_source";
const CACHE_STORAGE_KEY = "sawo_data_source_cache";
const CACHE_MS = 30 * 1000; // 30s

let memCache = null;
let memCacheTime = 0;

export async function getDataSource() {
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
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", KEY)
      .single();
    if (error) throw error;

    const value = data?.value === "supabase" ? "supabase" : "github";
    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[dataSource] Failed to read data_source setting, defaulting to 'github':", err.message);
    return memCache || "github";
  }
}

export async function setDataSource(value, username = null) {
  if (value !== "github" && value !== "supabase") {
    throw new Error(`Invalid data source: ${value}`);
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY, value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  memCache = value;
  memCacheTime = Date.now();
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: memCacheTime }));
}
