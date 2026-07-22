/**
 * translatedRoutes.js
 *
 * Hand-synced with the pages actually BUILT in
 * frontend-next/src/app/[locale]/ — NOT with the full `pathnames` list in
 * frontend-next/src/translation/routing.js, which also declares routes that
 * are planned but not yet ported (those would 404 under /fi or /de today).
 *
 * When a path is in this list, the language switcher mirrors it 1:1
 * (e.g. "/support" -> "/fi/support"). Otherwise it falls back to the
 * translated home page ("/fi", "/de"). Add to this list as pages are ported;
 * once every page is ported, the whitelist check can be removed entirely.
 */
export const TRANSLATED_PATHS = ["/"];

// Kept in sync by hand with frontend-next/src/translation/routing.js's
// `localeNames` and frontend/src/local-storage/languageSettings.js's
// BUILT_LOCALES.
export const LOCALES = [
  { code: "en", label: "English" },
  { code: "fi", label: "Suomi" },
  { code: "de", label: "Deutsch" },
];
