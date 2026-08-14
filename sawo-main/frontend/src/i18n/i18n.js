// src/i18n/i18n.js
//
// react-i18next setup. Catalogs are auto-discovered via require.context
// (bundled at build time, not fetched — same "no network dependency for
// core content" principle as the rest of the site's prerender story) from
// src/i18n/locales/<locale>/<namespace>.json. Adding a new page's catalog
// file, or a new locale directory, needs no edit here — it's picked up
// automatically. See frontend/README-i18n.md for the full workflow this
// serves (extract.js / inject.js / manifest.js).
//
// A locale directory does NOT need every namespace file to exist — a page
// not yet translated into a given locale (e.g. locales/fi/sauna.json before
// its Finnish translation is injected) simply has no resource for that
// locale, and i18next's fallbackLng below serves the English value for any
// key it can't find. This is deliberate: a page mirrored under /fi/* before
// translation should render in English, not throw or show blank keys.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const DEFAULT_LOCALE = "en";

const context = require.context("./locales", true, /\.json$/);
const resources = {};
const namespacesByLocale = {};

context.keys().forEach((key) => {
  const match = key.match(/^\.\/([^/]+)\/([^/]+)\.json$/);
  if (!match) return;
  const [, locale, ns] = match;
  resources[locale] = resources[locale] || {};
  resources[locale][ns] = context(key);
  namespacesByLocale[locale] = namespacesByLocale[locale] || [];
  namespacesByLocale[locale].push(ns);
});

export const SUPPORTED_LOCALES = Object.keys(resources);
// Union of every namespace that exists for ANY locale — i18next needs a
// namespace declared here to look it up at all, even if a given locale's
// resource for it doesn't exist yet (that's exactly the fallback case).
export const NAMESPACES = [...new Set(Object.values(namespacesByLocale).flat())];

i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  ns: NAMESPACES,
  defaultNS: "common",
  interpolation: { escapeValue: false }, // React already escapes
  resources,
  react: { useSuspense: false },
});

export default i18n;
