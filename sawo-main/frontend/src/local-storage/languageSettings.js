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
import { LOCALES } from "../i18n/translatedRoutes";

const KEY_ENABLED = "language_switcher_enabled";
const KEY_LANGUAGES = "enabled_languages";
const KEY_ORDER = "language_order";

// Derived from translatedRoutes.js's LOCALES so a new locale only needs adding
// in one place. Array order = the DEFAULT switcher order (see getLanguageOrder
// for the CMS-editable override).
export const BUILT_LOCALES = LOCALES.map((l) => l.code);

// Shown when nothing valid is stored in app_settings (first run, or a
// malformed row). Deliberately NOT all of BUILT_LOCALES: a locale only goes
// public once someone turns it on in the admin CMS (Settings.jsx).
const DEFAULT_ENABLED_LOCALES = ["en", "fi", "zh"];

// The admin CMS toggle governs which built locales appear in the switcher.
// (This used to hard-cap to a Finnish/Chinese pilot subset, which silently
// dropped "de" from a CMS save while the CMS UI still showed it as on.)
function sanitizeLanguages(value) {
  if (!Array.isArray(value)) return [...DEFAULT_ENABLED_LOCALES];
  const filtered = value.filter((loc) => BUILT_LOCALES.includes(loc));
  return filtered.length > 0 ? filtered : [...DEFAULT_ENABLED_LOCALES];
}

// Display order of ALL built locales in the switcher (and the CMS list that
// edits it). Whatever is stored is de-duplicated and cleaned of unknown codes;
// any built locale missing from it (e.g. one added to the code after the
// order was last saved) is appended in its default position, so a new
// language never silently vanishes from the CMS list.
function sanitizeOrder(value) {
  const seen = new Set();
  const order = [];
  if (Array.isArray(value)) {
    for (const loc of value) {
      if (BUILT_LOCALES.includes(loc) && !seen.has(loc)) { seen.add(loc); order.push(loc); }
    }
  }
  for (const loc of BUILT_LOCALES) if (!seen.has(loc)) order.push(loc);
  return order;
}

// Reading is delegated to appSettings.js, which batches these two keys with
// every other public setting into ONE request per page load (this used to be
// its own separate round trip). Validation and the default-to-all-enabled
// behaviour below are unchanged.
async function readSettings() {
  const all = await getSettings();
  return {
    // Defaults to OFF: the switcher's target locale pages (formerly served by
    // frontend-next, see translatedRoutes.js) don't exist in this app yet.
    // Flip back on in the CMS once CRA-native /fi, /de routes actually ship.
    enabled: typeof all?.[KEY_ENABLED] === "boolean" ? all[KEY_ENABLED] : false,
    languages: sanitizeLanguages(all?.[KEY_LANGUAGES]),
    order: sanitizeOrder(all?.[KEY_ORDER]),
  };
}

export async function getLanguageOrder() {
  const { order } = await readSettings();
  return order;
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

export function getCachedLanguageOrder() {
  const all = getCachedSettings();
  return sanitizeOrder(all?.[KEY_ORDER]);
}

export async function setLanguageOrder(value, username = null) {
  const order = sanitizeOrder(value);
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY_ORDER, value: order, updated_by: username, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  primeSetting(KEY_ORDER, order);
  return order;
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
