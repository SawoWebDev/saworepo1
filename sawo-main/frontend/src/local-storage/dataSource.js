/**
 * dataSource.js
 * src/local-storage/dataSource.js
 *
 * Global switch controlling where the public frontend reads product,
 * sauna room, and site content data from. As of the 2026-08-06 cleanup
 * (saworepo2 deletion; see docs/go-live/STORAGE-CURRENT.txt), the only
 * supported value is:
 *   "supabase" — live Supabase rows, direct and instant, no sync step.
 *
 * The older "github" (bundled GitHub-synced JSON snapshot) and "jsonfile"
 * (hand-edited allaccs-data.json fetched from saworepo2 at runtime) modes
 * were dead code — the live site had run exclusively on Supabase + R2 for
 * a while before they were removed. This switch (and the app_settings row
 * behind it) is kept only so the value can still be read/set from the CMS
 * without a schema change; there is currently nothing else for it to be.
 *
 * The setting itself lives in the app_settings table (see
 * Administrator/Local/scripts/setup-app-settings.sql) so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy. Cached briefly so we don't hit Supabase on every
 * render, but short enough that a toggle takes effect within seconds.
 */

import { getSupabase } from "./supabaseClient";
import { getSettings, primeSetting } from "./appSettings";

const KEY_SOURCE = "data_source";

const VALID_SOURCES = ["supabase"];

// Reading is delegated to appSettings.js, which batches this key with
// every other public setting into ONE request per page load (this used to be
// its own separate round trip).
async function readSettings() {
  const all = await getSettings();
  return {
    source: VALID_SOURCES.includes(all?.[KEY_SOURCE]) ? all[KEY_SOURCE] : "supabase",
  };
}

export async function getDataSource() {
  const { source } = await readSettings();
  return source;
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

  primeSetting(KEY_SOURCE, value);
}
