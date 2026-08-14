/**
 * translatedRoutes.js
 *
 * Every route is served in-app under /fi/* and /de/* (App.jsx mirrors the
 * whole English route tree per locale prefix, so nothing 404s). This list is
 * now about CONTENT, not existence: which paths have real, reviewed fi/de
 * copy (not English rendered under a locale prefix). The language switcher
 * only mirrors a path 1:1 (e.g. "/support" -> "/fi/support") when it's in
 * this list; otherwise it sends the visitor to the translated home page
 * ("/fi", "/de") rather than a technically-live-but-untranslated page. Add a
 * path here only once its catalog has real locale copy — this is also what
 * gates hreflang alternates (see SEO.jsx), since asserting a fi/de version
 * of a page that's still English is worse for SEO than not claiming one.
 */
export const TRANSLATED_PATHS = ["/"];

// Locale prefixes routed in App.jsx (English is unprefixed, "").
export const LOCALE_PREFIXES = ["", "fi", "de"];

export const LOCALES = [
  { code: "en", label: "English" },
  { code: "fi", label: "Suomi" },
  { code: "de", label: "Deutsch" },
];
