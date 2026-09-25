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
  "/": ["fi", "de", "zh"],
  "/sauna": ["fi", "zh", "de"],
  "/sauna/heaters": ["zh", "de"],
  "/sauna/heaters/wall-mounted": ["zh", "de"],
  "/sauna/heaters/tower": ["zh", "de"],
  "/sauna/heaters/stone": ["zh", "de"],
  "/sauna/heaters/floor": ["zh", "de"],
  "/sauna/heaters/combi": ["zh", "de"],
  "/sauna/heaters/dragonfire": ["zh", "de"],
  "/sauna/controls": ["zh", "de"],
  "/sauna/accessories": ["zh", "de"],
  "/sauna/accessories/accessory-sets": ["zh", "de"],
  "/sauna/accessories/pails-ladles": ["zh", "de"],
  "/sauna/accessories/thermometers": ["zh", "de"],
  "/sauna/accessories/clocks-sandtimers": ["zh", "de"],
  "/sauna/accessories/lights-covers": ["zh", "de"],
  "/sauna/accessories/headrests-backrests": ["zh", "de"],
  "/sauna/accessories/doors-handles": ["zh", "de"],
  "/sauna/accessories/benches-floor-tiles": ["zh", "de"],
  "/sauna/accessories/kivistone": ["zh", "de"],
  "/sauna/accessories/ventilations-add-ons": ["zh", "de"],
  "/sauna/rooms": ["zh", "de"],
  "/sauna/rooms/interior-designs": ["zh", "de"],
  "/sauna/rooms/wood-panels-timbers": ["zh", "de"],
  "/steam": ["zh", "de"],
  "/steam/generators": ["fi", "zh", "de"],
  "/steam/controls": ["zh", "de"],
  "/steam/accessories": ["zh", "de"],
  "/infrared": ["zh", "de"],
  "/support": ["zh", "de"],
  "/support/faq": ["zh", "de"],
  "/support/sauna-calculator": ["zh", "de"],
  "/support/manuals": ["zh", "de"],
  "/support/catalogue": ["zh", "de"],
  "/contact": ["zh", "de"],
  "/about": ["zh", "de"],
  "/about/news": ["zh", "de"],
  "/about/sustainability": ["zh", "de"],
  "/careers": ["zh", "de"],
  "/privacy-policy": ["zh", "de"],
  "/sitemap": ["zh", "de"],
  "/products": ["zh", "de"],
  "/sauna-accessories": ["zh", "de"],
  "/sauna-heaters": ["zh", "de"],
  "/infrared/saunas": ["zh", "de"],
  "/infrared/panels": ["zh", "de"],
  "/infrared/controls": ["zh", "de"],
};

// True if `path` has real, reviewed copy in `locale` — the single check
// both the language switcher (HeaderLanguageSwitcher.jsx) and SEO.jsx's
// hreflang gating should use, so the two can never drift apart.
export function isTranslated(path, locale) {
  return (TRANSLATED_PATHS[path] || []).includes(locale);
}

// Locale prefixes routed in App.jsx (English is unprefixed, "").
export const LOCALE_PREFIXES = ["", "fi", "de", "zh", "ja", "fr", "es", "th"];

// "zh" = Simplified Chinese specifically (not Traditional) — content lives
// in locales/zh/*.json. As of 2026-08-26, Home + global chrome + the /steam
// hub + /sauna/rooms + the full steam-category product catalog (all 17
// generator/control/accessory/spare-part products, via product_translations)
// are translated and spot-checked as natural/accurate (user-reviewed via
// screenshots) — added to TRANSLATED_PATHS above on that basis, same bar
// used for fi's reviewed pages. Everything else still renders English
// per-key for zh until it's translated and similarly checked.
//
// `ready: false` marks a locale whose routes and switcher slot exist but
// whose site-chrome catalogs (locales/<code>/*.json) are still empty — every
// string falls back to English per-key (see i18n.js). The admin CMS flags
// these so nobody switches one on in the public switcher by accident.
//
// This array's order is only the DEFAULT display order of the switcher; the
// live order is editable in the admin CMS (Settings > Language Switcher) and
// stored as the `language_order` app_setting, see local-storage/languageSettings.js.
export const LOCALES = [
  { code: "en", label: "English", ready: true },
  { code: "fi", label: "Suomi", ready: true },
  { code: "zh", label: "简体中文", ready: true },
  { code: "ja", label: "日本語", ready: true },
  { code: "de", label: "Deutsch", ready: true },
  { code: "fr", label: "Français", ready: true },
  { code: "es", label: "Español", ready: true },
  { code: "th", label: "ไทย", ready: true },
];
