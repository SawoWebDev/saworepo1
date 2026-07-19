/**
 * dataSource.js
 * src/local-storage/dataSource.js
 *
 * Global switch controlling where the public frontend reads product,
 * sauna room, and site content data from:
 *   "github"   — the GitHub-synced JSON snapshot (raw.githubusercontent.com
 *                / bundled products.json). Current default behavior.
 *   "supabase" — live Supabase rows, direct and instant, no sync step.
 *   "jsonfile" — a single hand-edited JSON file in the images repo
 *                (raw.githubusercontent.com/.../allaccs-data.json), scoped
 *                by json_source_scope below. Falls back to the "github"
 *                snapshot for anything outside that scope.
 *
 * The setting itself lives in the app_settings table (see
 * Administrator/Local/scripts/setup-app-settings.sql) so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy. Cached briefly so we don't hit Supabase on every
 * render, but short enough that a toggle takes effect within seconds.
 *
 * json_source_scope controls which product group the "jsonfile" source
 * applies to: "all" | "saunarooms" | "heaters" | "accessories". Only
 * "accessories" is implemented today; it defaults to "accessories" when
 * the row is missing so the SQL seed update is optional.
 */

import { getSupabase } from "./supabaseClient";

const KEY_SOURCE = "data_source";
const KEY_SCOPE = "json_source_scope";
const CACHE_STORAGE_KEY = "sawo_data_source_cache_v2";
const CACHE_MS = 30 * 1000; // 30s

const VALID_SOURCES = ["github", "supabase", "jsonfile"];
const VALID_SCOPES = ["all", "saunarooms", "heaters", "accessories"];

let memCache = null; // { source, scope }
let memCacheTime = 0;

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
    // Plain REST fetch (same pattern as track.js) instead of the supabase-js
    // SDK: this runs on every public page's cold visit, and going through
    // getSupabase() would download the ~50KB-gzip SDK chunk just to read
    // two settings rows. The SDK stays admin-only (setters / live reads).
    const res = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_settings?key=in.(${KEY_SOURCE},${KEY_SCOPE})&select=key,value`,
      {
        headers: {
          apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const byKey = Object.fromEntries((rows || []).map(r => [r.key, r.value]));

    const source = VALID_SOURCES.includes(byKey[KEY_SOURCE]) ? byKey[KEY_SOURCE] : "github";
    const scope = VALID_SCOPES.includes(byKey[KEY_SCOPE]) ? byKey[KEY_SCOPE] : "accessories";

    const value = { source, scope };
    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[dataSource] Failed to read settings, defaulting to 'github':", err.message);
    return memCache || { source: "github", scope: "accessories" };
  }
}

export async function getDataSource() {
  const { source } = await readSettings();
  return source;
}

export async function getJsonSourceScope() {
  const { scope } = await readSettings();
  return scope;
}

function updateCache(partial) {
  const value = { source: "github", scope: "accessories", ...(memCache || {}), ...partial };
  memCache = value;
  memCacheTime = Date.now();
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: memCacheTime }));
}

export async function setDataSource(value, username = null) {
  if (!VALID_SOURCES.includes(value)) {
    throw new Error(`Invalid data source: ${value}`);
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_SOURCE, value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  updateCache({ source: value });
}

export async function setJsonSourceScope(value, username = null) {
  if (!VALID_SCOPES.includes(value)) {
    throw new Error(`Invalid json source scope: ${value}`);
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_SCOPE, value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  updateCache({ scope: value });
}
