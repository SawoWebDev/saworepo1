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
import { getSettings, primeSetting } from "./appSettings";

const KEY_SOURCE = "data_source";
const KEY_SCOPE = "json_source_scope";

const VALID_SOURCES = ["github", "supabase", "jsonfile"];
const VALID_SCOPES = ["all", "saunarooms", "heaters", "accessories"];

// Reading is delegated to appSettings.js, which batches these two keys with
// every other public setting into ONE request per page load (this used to be
// its own separate round trip). Validation and the fall-back-to-"github"
// behaviour below are unchanged — appSettings returns raw rows and each
// consumer still applies its own allowlist and default.
async function readSettings() {
  const all = await getSettings();
  return {
    source: VALID_SOURCES.includes(all?.[KEY_SOURCE]) ? all[KEY_SOURCE] : "github",
    scope: VALID_SCOPES.includes(all?.[KEY_SCOPE]) ? all[KEY_SCOPE] : "accessories",
  };
}

export async function getDataSource() {
  const { source } = await readSettings();
  return source;
}

export async function getJsonSourceScope() {
  const { scope } = await readSettings();
  return scope;
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

export async function setJsonSourceScope(value, username = null) {
  if (!VALID_SCOPES.includes(value)) {
    throw new Error(`Invalid json source scope: ${value}`);
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_SCOPE, value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  primeSetting(KEY_SCOPE, value);
}
