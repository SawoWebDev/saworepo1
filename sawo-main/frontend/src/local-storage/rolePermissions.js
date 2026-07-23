/**
 * rolePermissions.js
 * src/local-storage/rolePermissions.js
 *
 * Admin-configurable overrides for permissions.js's CAPABILITY_MAP, edited
 * from the Roles & Permissions page (Administrator/RolesPermissions.jsx).
 * Stored as one JSON object, sparse — only capabilities a superadmin has
 * actually toggled are present; every other capability keeps falling
 * through to its static CAPABILITY_MAP default.
 *
 * { "products.delete": ["admin","superadmin"], "taxonomy.create": [...], ... }
 *
 * Lives in the same app_settings table as the other CMS-wide toggles (see
 * dataSource.js / headerLayout.js), so a change takes effect for other
 * logged-in sessions within seconds, no redeploy. Only superadmin can see/
 * change it (enforced by "page.permissions" in permissions.js, which is
 * intentionally NEVER itself included in this override system — that would
 * risk a superadmin locking themselves out of the page that controls
 * locking-out).
 *
 * setRoleCapabilityOverrides always force-includes "superadmin" in every
 * capability's role array — the same never-lock-yourself-out invariant,
 * applied per-row instead of to one setting.
 */

import { getSupabase } from "./supabaseClient";

const KEY = "role_capabilities";
const CACHE_STORAGE_KEY = "sawo_role_capabilities_cache_v1";
const CACHE_MS = 30 * 1000; // 30s

// Superseded single-purpose setting from before this was generalized —
// read once as a migration seed for "page.users" only, never written again.
const LEGACY_USERS_KEY = "users_management_roles";

const VALID_ROLES = ["superadmin", "admin", "editor", "viewer"];

let memCache = null;
let memCacheTime = 0;

function sanitizeRoles(roles) {
  const filtered = Array.isArray(roles) ? roles.filter((r) => VALID_ROLES.includes(r)) : [];
  if (!filtered.includes("superadmin")) filtered.push("superadmin");
  return filtered;
}

function sanitizeOverrides(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [cap, roles] of Object.entries(value)) {
    out[cap] = sanitizeRoles(roles);
  }
  return out;
}

async function fetchSettingRow(key) {
  const res = await fetch(
    `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/app_settings?key=eq.${key}&select=value`,
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
    // Plain REST fetch (same pattern as dataSource.js / headerLayout.js).
    let value = sanitizeOverrides(await fetchSettingRow(KEY));

    // One-time soft migration: fold in the old single-purpose setting if it
    // exists and hasn't already been folded into "page.users".
    if (!("page.users" in value)) {
      try {
        const legacy = await fetchSettingRow(LEGACY_USERS_KEY);
        if (Array.isArray(legacy)) value = { ...value, "page.users": sanitizeRoles(legacy) };
      } catch {}
    }

    memCache = value;
    memCacheTime = now;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ value, time: now }));
    return value;
  } catch (err) {
    console.warn("[rolePermissions] Failed to read overrides, defaulting to none:", err.message);
    return memCache || {};
  }
}

export async function getRoleCapabilityOverrides() {
  return readSetting();
}

export async function setRoleCapabilityOverrides(overrides, username = null) {
  const value = sanitizeOverrides(overrides);

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
