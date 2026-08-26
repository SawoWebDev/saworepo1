/**
 * languageSettings.js
 * src/local-storage/languageSettings.js
 *
 * Global switch controlling the public site's language switcher
 * (components/Header/HeaderLanguageSwitcher.jsx, mounted in Header.jsx):
 * whether it's shown at all, and which of the built locales appear in it.
 *
 * "Built" locales are the ones this CRA app actually routes (see
 * src/i18n/translatedRoutes.js's LOCALE_PREFIXES) — this setting only
 * controls VISIBILITY of a subset of them, not which locales exist. Adding
 * a brand-new language is still a code change (new locale catalogs +
 * LOCALE_PREFIXES entry, see frontend/README-i18n.md). A hidden locale's
 * pages still exist and stay in the sitemap/hreflang — this is a display
 * toggle, not a routing/SEO change.
 *
 * The setting lives in the same app_settings table as the "Live Data
 * Source" toggle (see dataSource.js and
 * Administrator/Local/scripts/setup-app-settings.sql), so it can be
 * flipped from the admin CMS and take effect immediately for visitors,
 * without a redeploy.
 */

import { getSupabase } from "./supabaseClient";
import { getSettings, getCachedSettings, primeSetting } from "./appSettings";

const KEY_ENABLED = "language_switcher_enabled";
const KEY_LANGUAGES = "enabled_languages";

// Kept in sync by hand with src/i18n/translatedRoutes.js's LOCALE_PREFIXES.
// German is still fully routed/built (its pages exist, stay in the
// sitemap/hreflang) — see PILOT_ENABLED_LOCALES below for why it doesn't
// show up in the public switcher right now.
export const BUILT_LOCALES = ["en", "fi", "de"];

// Finnish-first pilot (see docs/🔴 GO-LIVE/SAWO_Multilingual_Implementation_
// Specification(1).md §74): until the Finnish rollout is validated, the
// public switcher is HARD-CAPPED to a known-good subset, regardless of what's
// stored in app_settings — a stray/legacy `enabled_languages` row containing
// "de" (there was one) must not silently re-show it. This is deliberately
// stricter than sanitizeLanguages used to be (DB value always won before);
// once the Finnish pilot is validated, change this back to BUILT_LOCALES so
// the admin CMS toggle (Settings.jsx) governs German again.
// "zh" added alongside "fi" to pilot Chinese too and see how translation
// coverage/velocity compares — same hard-cap mechanism, just a bigger set.
const PILOT_ENABLED_LOCALES = ["en", "fi", "zh"];

function sanitizeLanguages(value) {
  if (!Array.isArray(value)) return [...PILOT_ENABLED_LOCALES];
  const filtered = value.filter((loc) => PILOT_ENABLED_LOCALES.includes(loc));
  return filtered.length > 0 ? filtered : [...PILOT_ENABLED_LOCALES];
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

// Synchronous, cache-only reads for the switcher's INITIAL render state —
// see HeaderLanguageSwitcher.jsx's comment on why this matters: seeding
// useState from a hardcoded `true` meant a visitor whose CMS toggle is OFF
// briefly saw the switcher before it vanished once the async settings
// fetch resolved (reads as broken, not as lazy content). Real cached
// settings (any repeat visit, or same-session after the async fetch below
// resolves once) paint the CORRECT state immediately, no flash either way.
// Only a genuine first-ever visit (nothing cached yet, or a build-time
// prerender snapshot where the network fetch is deliberately blocked) has
// no answer available — those default to HIDDEN, not shown-then-removed,
// since "pops in after load" reads as normal lazy content while "shown
// then vanishes" reads as a bug.
export function getCachedLanguageSwitcherEnabled() {
  const all = getCachedSettings();
  return typeof all?.[KEY_ENABLED] === "boolean" ? all[KEY_ENABLED] : false;
}

export function getCachedEnabledLanguages() {
  const all = getCachedSettings();
  return sanitizeLanguages(all?.[KEY_LANGUAGES]);
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
