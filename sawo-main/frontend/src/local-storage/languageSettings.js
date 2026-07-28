/**
 * languageSettings.js
 * src/local-storage/languageSettings.js
 *
 * Global switch controlling the public site's language switcher (the new
 * Next.js frontend, frontend-next/): whether it's shown at all, and which
 * of the built locales appear in it.
 *
 * "Built" locales are the ones the frontend-next app actually ships
 * (see frontend-next/src/translation/routing.js) — this setting only
 * controls VISIBILITY of a subset of them, not which locales exist.
 * Adding a brand-new language is still a build-time change over there.
 * A hidden locale's pages still exist and stay in the sitemap/hreflang —
 * this is a display toggle, not a routing/SEO change.
 *
 * The setting lives in the same app_settings table as the "Live Data
 * Source" toggle (see dataSource.js and
 * Administrator/Local/scripts/setup-app-settings.sql), so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy.
 */

import { getSupabase } from "./supabaseClient";
import { getSettings, primeSetting } from "./appSettings";

const KEY_ENABLED = "language_switcher_enabled";
const KEY_LANGUAGES = "enabled_languages";

// Kept in sync by hand with frontend-next/src/translation/routing.js `locales`.
export const BUILT_LOCALES = ["en", "fi", "de"];

function sanitizeLanguages(value) {
  if (!Array.isArray(value)) return [...BUILT_LOCALES];
  const filtered = value.filter((loc) => BUILT_LOCALES.includes(loc));
  return filtered.length > 0 ? filtered : [...BUILT_LOCALES];
}

// Reading is delegated to appSettings.js, which batches these two keys with
// every other public setting into ONE request per page load (this used to be
// its own separate round trip). Validation and the default-to-all-enabled
// behaviour below are unchanged.
async function readSettings() {
  const all = await getSettings();
  return {
    enabled: typeof all?.[KEY_ENABLED] === "boolean" ? all[KEY_ENABLED] : true,
    languages: sanitizeLanguages(all?.[KEY_LANGUAGES]),
  };
}

export async function getLanguageSwitcherEnabled() {
  const { enabled } = await readSettings();
  return enabled;
}

export async function getEnabledLanguages() {
  const { languages } = await readSettings();
  return languages;
}

export async function setLanguageSwitcherEnabled(value, username = null) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_ENABLED, value: !!value, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  primeSetting(KEY_ENABLED, !!value);
}

export async function setEnabledLanguages(value, username = null) {
  const languages = sanitizeLanguages(value);
  if (languages.length === 0) {
    throw new Error("At least one language must remain enabled.");
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_LANGUAGES, value: languages, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  primeSetting(KEY_LANGUAGES, languages);
}
