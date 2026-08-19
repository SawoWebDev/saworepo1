/**
 * translatedRoutes.js
 *
 * Every route is served in-app under /fi/* and /de/* (App.jsx mirrors the
 * whole English route tree per locale prefix, so nothing 404s). This map is
 * about CONTENT, not existence: which paths have real, reviewed copy PER
 * LOCALE (not English rendered under a locale prefix). Keyed by path, each
 * value is the array of locale codes that path genuinely has real content
 * in — e.g. Sauna is translated into Finnish but not German yet, so
 * `"/sauna": ["fi"]`, not both. The language switcher only mirrors a path
 * 1:1 (e.g. "/sauna" -> "/fi/sauna") when the TARGET locale is listed for
 * that path; otherwise it sends the visitor to that locale's home page
 * instead of a technically-live-but-untranslated page. This is also what
 * gates hreflang alternates (see SEO.jsx) — asserting a translated version
 * of a page that's still English is worse for SEO than not claiming one,
 * and that risk is per-locale, not per-page, which is exactly why this
 * can't be a flat path list (a flat list can't say "yes for fi, no for
 * de" for the same path).
 *
 * Add a path here only once ITS CATALOG has real copy for that specific
 * locale — matches the old plan's BUILT_ROUTES-as-locale-map idea (see
 * docs/🔴 GO-LIVE/CRA-I18N-TRANSLATIONS-PLAN.md §3.2), re-homed to CRA.
 */
export const TRANSLATED_PATHS = {
  "/": ["fi", "de"],
  "/sauna": ["fi"],
  "/steam/generators": ["fi"],
};

// True if `path` has real, reviewed copy in `locale` — the single check
// both the language switcher (HeaderLanguageSwitcher.jsx) and SEO.jsx's
// hreflang gating should use, so the two can never drift apart.
export function isTranslated(path, locale) {
  return (TRANSLATED_PATHS[path] || []).includes(locale);
}

// Locale prefixes routed in App.jsx (English is unprefixed, "").
export const LOCALE_PREFIXES = ["", "fi", "de"];

export const LOCALES = [
  { code: "en", label: "English" },
  { code: "fi", label: "Suomi" },
  { code: "de", label: "Deutsch" },
];
