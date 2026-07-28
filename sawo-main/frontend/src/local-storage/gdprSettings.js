/**
 * gdprSettings.js
 * src/local-storage/gdprSettings.js
 *
 * Global switch controlling whether the GDPR consent banner
 * (components/GDPRConsent.jsx) renders on the public site.
 *
 * Same pattern as languageSettings.js / dataSource.js: lives in the
 * app_settings table so it can be flipped from the admin CMS and take
 * effect immediately for visitors, without a redeploy.
 *
 * Defaults to disabled (false) — matches the banner's prior state (it was
 * commented out entirely in App.jsx before this toggle existed). Enabling
 * it is an explicit admin choice, not a silent behavior change.
 */

import { getSupabase } from "./supabaseClient";
import { getSettings, primeSetting } from "./appSettings";

const KEY_ENABLED = "gdpr_banner_enabled";

// Reading is delegated to appSettings.js, which batches this key with every
// other public setting into ONE request per page load (this used to be its
// own separate round trip). The default-to-disabled behaviour is unchanged:
// anything that isn't an explicit boolean true/false reads as false.
export async function getGDPRBannerEnabled() {
  const all = await getSettings();
  const raw = all?.[KEY_ENABLED];
  return typeof raw === "boolean" ? raw : false;
}

export async function setGDPRBannerEnabled(value, username = null) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_ENABLED, value: !!value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  primeSetting(KEY_ENABLED, !!value);
}
