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
 * Same app_settings table as headerLayout.js and dataSource.js, so it can be
 * flipped from the admin CMS and take effect for visitors within seconds, no
 * redeploy needed. Reading is delegated to appSettings.js, which batches this
 * key with every other public setting into ONE request per page load.
 */

import { getSupabase } from "./supabaseClient";
import { getSettings, primeSetting, pickCached } from "./appSettings";

const KEY = "header_nav_style";
const DEFAULT = "style1";

const VALID_STYLES = ["style1", "style2"];

export async function getHeaderNavStyle() {
  const all = await getSettings();
  const raw = all?.[KEY];
  return VALID_STYLES.includes(raw) ? raw : DEFAULT;
}

/**
 * Synchronous read of the last-known value, deliberately ignoring the cache
 * TTL. See the matching comment in headerLayout.js — the TTL decides when to
 * revalidate, not what to paint. Returns null only on a genuine first visit.
 */
export function getCachedHeaderNavStyle() {
  return pickCached(KEY, VALID_STYLES);
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

  primeSetting(KEY, value);
}
