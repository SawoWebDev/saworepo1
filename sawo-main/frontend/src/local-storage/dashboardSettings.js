/**
 * dashboardSettings.js
 * src/local-storage/dashboardSettings.js
 *
 * How many days of analytics the admin Dashboard's traffic tiles/chart cover
 * (Dashboard.jsx) — admin-configurable from Settings.jsx, 7/30/90 days.
 *
 * Lives in the same app_settings table as the other CMS-wide toggles (see
 * dataSource.js / headerLayout.js), so a change takes effect for other
 * logged-in sessions within seconds, no redeploy. Admin-only (never read by
 * public visitors), so — like rolePermissions.js — this keeps its own
 * cache instead of going through appSettings.js's public-settings batch.
 */

import { getSupabase } from "./supabaseClient";

const KEY = "dashboard_traffic_window_days";
const CACHE_STORAGE_KEY = "sawo_dashboard_settings_cache_v1";
const CACHE_MS = 30 * 1000; // 30s

export const VALID_WINDOWS = [7, 30, 90];
const DEFAULT_WINDOW = 30;

let memCache = null;
let memCacheTime = 0;

function sanitizeWindow(value) {
  const n = Number(value);
  return VALID_WINDOWS.includes(n) ? n : DEFAULT_WINDOW;
}

async function fetchSettingRow() {
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
  return rows?.[0]?.value;
}

export async function getDashboardTrafficWindow() {
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
    const value = sanitizeWindow(await fetchSettingRow());
    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[dashboardSettings] Failed to read traffic window, defaulting:", err.message);
    return memCache || DEFAULT_WINDOW;
  }
}

export async function setDashboardTrafficWindow(days, username = null) {
  const value = sanitizeWindow(days);

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY, value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  memCache = value;
  memCacheTime = Date.now();
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: memCacheTime }));
  return value;
}
