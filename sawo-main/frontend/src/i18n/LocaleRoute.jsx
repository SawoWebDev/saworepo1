// src/i18n/LocaleRoute.jsx
//
// Wrapped around every route element in App.jsx (once per locale prefix).
// Provides the active locale via context (see LocaleContext.js — synchronous,
// not an effect-driven i18next.changeLanguage(), so first paint is correct
// under prerender) and sets <html lang> to match.
//
// Also kicks off loadLocale() (i18n.js) for non-English locales, since fi/de/
// zh catalogs are no longer bundled eagerly (see i18n.js's header comment).
// This component does NOT need to re-render itself once that finishes —
// useLocaleT (LocaleContext.js) subscribes independently via
// useSyncExternalStore, so every page using it re-renders on its own the
// moment the locale's resources land. Until then, children render with
// fallbackLng ("en") text, same as any not-yet-translated page already does
// deliberately (see i18n.js) — no blank keys, no thrown errors, just a brief
// English flash on first visit to a /fi, /de or /zh page that a repeat visit
// (locale now cached in loadLocale's `loadedLocales`) won't repeat.
import { useEffect } from "react";
import { LocaleContext } from "./LocaleContext";
import { loadLocale } from "./i18n";

export default function LocaleRoute({ locale, children }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    loadLocale(locale);
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
