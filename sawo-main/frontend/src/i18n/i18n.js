// src/i18n/i18n.js
//
// react-i18next setup. Catalogs are auto-discovered via require.context
// (bundled at build time, not fetched from a translation API — same "no
// network dependency for core content" principle as the rest of the site's
// prerender story) from src/i18n/locales/<locale>/<namespace>.json. Adding a
// new page's catalog file needs no edit here — it's picked up automatically.
// See frontend/README-i18n.md for the full workflow this serves
// (extract.js / inject.js / manifest.js).
//
// A locale directory does NOT need every namespace file to exist — a page
// not yet translated into a given locale (e.g. locales/fi/sauna.json before
// its Finnish translation is injected) simply has no resource for that
// locale, and i18next's fallbackLng below serves the English value for any
// key it can't find. This is deliberate: a page mirrored under /fi/* before
// translation should render in English, not throw or show blank keys.
//
// ENGLISH-ONLY MAIN BUNDLE: only `en` is eagerly bundled into the main chunk
// — every visitor needs it, /fi and /de visitors included, since fallbackLng
// is "en". fi/de/zh (~625KB of raw JSON combined, see LAZY_LOCALES below)
// are each their own webpack chunk, fetched only by loadLocale() when a
// visitor actually lands on that locale's routes (see LocaleRoute.jsx and
// LocaleContext.js's useLocaleT, which is what actually reacts to a locale
// finishing loading). Before this split, every locale shipped in main.js
// unconditionally, which doubled its gzipped size for every visitor
// regardless of language — see the 2026-09-24 go-live-readiness merge check.
//
// Adding a new locale: create its src/i18n/locales/<code>/ directory, add
// <code> to LAZY_LOCALES below, add one more require.context call alongside
// localeContexts', and add it to LOCALE_PREFIXES/LOCALES in
// translatedRoutes.js. No other code change needed.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const DEFAULT_LOCALE = "en";
const LAZY_LOCALES = ["fi", "de", "zh", "ja", "fr", "es", "th"];

const enContext = require.context("./locales/en", false, /\.json$/);
const resources = { en: {} };
const enNamespaces = [];

enContext.keys().forEach((key) => {
  const match = key.match(/^\.\/([^/]+)\.json$/);
  if (!match) return;
  const [, ns] = match;
  resources.en[ns] = enContext(key);
  enNamespaces.push(ns);
});

export const SUPPORTED_LOCALES = [DEFAULT_LOCALE, ...LAZY_LOCALES];
// English has every namespace that exists, since it's the source locale
// every string gets extracted from first (see README-i18n.md) — so its
// namespace list doubles as the full set i18next needs declared up front.
// A lazy locale's resource for a given namespace simply doesn't exist until
// loadLocale() adds it; fallbackLng covers the gap until then.
export const NAMESPACES = enNamespaces;

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

// One require.context per lazy locale, each in "lazy-once" mode: webpack
// groups every namespace file a context matches into a SINGLE chunk for
// that context, fetched once on the first `context(key)` call and reused
// for the rest. Three separate calls (rather than one context over
// "./locales" filtered by locale) is what keeps that grouping per-locale —
// a single shared context would bundle fi+de+zh namespaces together into
// one chunk, so a /fi visitor would download German and Chinese text too,
// the exact problem this split exists to avoid. Each call's directory must
// be a literal (webpack resolves require.context args at build time), so
// adding a locale means adding one more line here alongside its
// LAZY_LOCALES entry — still just the 2-line touch documented above.
const localeContexts = {
  fi: require.context("./locales/fi", false, /\.json$/, "lazy-once"),
  de: require.context("./locales/de", false, /\.json$/, "lazy-once"),
  zh: require.context("./locales/zh", false, /\.json$/, "lazy-once"),
  ja: require.context("./locales/ja", false, /\.json$/, "lazy-once"),
  fr: require.context("./locales/fr", false, /\.json$/, "lazy-once"),
  es: require.context("./locales/es", false, /\.json$/, "lazy-once"),
  th: require.context("./locales/th", false, /\.json$/, "lazy-once"),
};

const loadedLocales = new Set([DEFAULT_LOCALE]);
const inFlight = new Map();

// Tiny pub-sub so React components can react the instant a locale's
// resources land — see LocaleContext.js's useLocaleT, which subscribes via
// useSyncExternalStore. This exists because a plain "re-render the route
// wrapper" approach doesn't work here: App.jsx's PUBLIC_ROUTES builds each
// page's element once at module scope and reuses that exact object as
// children on every render, and React bails out of re-rendering a subtree
// when the children element it receives is referentially unchanged — so an
// ancestor re-rendering itself (e.g. from local state) never propagates
// down to the page. Every useLocaleT call site needs its own subscription
// instead of relying on one ancestor's re-render to reach it.
const listeners = new Set();
function notifyLocaleLoaded() {
  listeners.forEach((cb) => cb());
}
export function subscribeToLocaleLoads(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function isLocaleLoaded(locale) {
  return loadedLocales.has(locale);
}

// Fetches one non-English locale's catalogs — one HTTP request total, via
// the "lazy-once" grouping above (still a same-origin build artifact, not a
// runtime translation-API call) — and registers each namespace with
// i18next via addResourceBundle. Safe to call repeatedly / from multiple
// components mounting at once; the work only happens once per locale.
// Resolves once i18n has the locale's resources, so callers know it's safe
// to re-render and expect translated `t()` output. Also fires
// notifyLocaleLoaded() so useLocaleT-subscribed components pick it up even
// if they never awaited this promise themselves.
export function loadLocale(locale) {
  if (!LAZY_LOCALES.includes(locale) || loadedLocales.has(locale)) {
    return Promise.resolve();
  }
  if (inFlight.has(locale)) return inFlight.get(locale);

  const context = localeContexts[locale];
  const promise = Promise.all(
    context.keys().map((key) =>
      context(key).then((mod) => {
        const match = key.match(/^\.\/([^/]+)\.json$/);
        const data = mod && mod.default !== undefined ? mod.default : mod;
        return match ? [match[1], data] : null;
      })
    )
  )
    .then((entries) => {
      entries.filter(Boolean).forEach(([ns, data]) => {
        i18n.addResourceBundle(locale, ns, data, true, true);
      });
      loadedLocales.add(locale);
      notifyLocaleLoaded();
    })
    .catch((err) => {
      // Chunk fetch failed (offline, ad blocker, etc.) — fall back to
      // English rather than leaving the page stuck. Don't cache the
      // failure so a later retry (e.g. next navigation) tries again.
      console.error(`[i18n] Failed to load locale "${locale}":`, err);
    })
    .finally(() => {
      inFlight.delete(locale);
    });

  inFlight.set(locale, promise);
  return promise;
}

export default i18n;
