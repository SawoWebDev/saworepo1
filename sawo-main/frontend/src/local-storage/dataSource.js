/**
 * dataSource.js
 * src/local-storage/dataSource.js
 *
 * Global switch controlling where the public frontend reads product,
 * sauna room, and site content data from. As of the 2026-08-06 cleanup
 * (saworepo2 deletion; see docs/go-live/STORAGE-CURRENT.txt) through
 * 2026-08-24, the only supported value was "supabase". A second value was
 * added on 2026-08-24 as a superadmin-only test switch (see Settings.jsx):
 *   "supabase" — live Supabase rows, direct and instant, no sync step.
 *   "neon"     — the Neon Postgres mirror kept current by the
 *                neon_sync_notify trigger on Supabase (see
 *                docs/NEON_BACKUP_PLAN.md). Read via functions/api/neon/*
 *                (Neon has no PostgREST layer, so the browser can't query
 *                it directly the way it queries Supabase) — see
 *                neonReader.js. Exists to verify the Neon mirror is
 *                current and working, not as a resilience feature yet
 *                (see Phase B in NEON_BACKUP_PLAN.md).
 *
 * The older "github" (bundled GitHub-synced JSON snapshot) and "jsonfile"
 * (hand-edited allaccs-data.json fetched from saworepo2 at runtime) modes
 * were dead code, removed in the 2026-08-06 cleanup.
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

const VALID_SOURCES = ["supabase", "neon"];

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
