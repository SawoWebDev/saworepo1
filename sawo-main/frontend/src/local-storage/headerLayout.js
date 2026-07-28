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
 * The setting lives in the app_settings table (see
 * Administrator/Local/scripts/setup-app-settings.sql), so it can be flipped
 * from the admin CMS and take effect immediately for visitors, without a
 * redeploy.
 *
 * Reading is delegated to appSettings.js, which batches this key together
 * with every other public setting into ONE request per page load.
 */

import { getSupabase } from "./supabaseClient";
import { getSettings, primeSetting, pickCached } from "./appSettings";

const KEY = "header_layout";
const DEFAULT = "layout2";

const VALID_LAYOUTS = ["layout1", "layout2"];

export async function getHeaderLayout() {
  const all = await getSettings();
  const raw = all?.[KEY];
  return VALID_LAYOUTS.includes(raw) ? raw : DEFAULT;
}

/**
 * Synchronous read of the last-known value, deliberately ignoring the cache
 * TTL — for the initial render only.
 *
 * The TTL governs when to REVALIDATE; it should not govern what we PAINT.
 * Conflating those is what made the header flash: once the cache was older
 * than the TTL it was discarded, the component fell back to the hardcoded
 * default, and visitors saw layout2 before the layout1 the admin actually
 * selected. A stale admin-chosen value beats the built-in default, and
 * getHeaderLayout() still corrects it moments later if it really changed.
 *
 * Returns null only when nothing has ever been cached (genuine first visit).
 */
export function getCachedHeaderLayout() {
  return pickCached(KEY, VALID_LAYOUTS);
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

  primeSetting(KEY, value);
}
