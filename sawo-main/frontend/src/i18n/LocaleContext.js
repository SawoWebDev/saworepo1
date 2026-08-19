// src/i18n/LocaleContext.js
//
// Locale is threaded through React context rather than mutating i18next's
// global `i18n.language` from an effect. A global mutation only takes effect
// after mount (useEffect fires after first paint), which would make the
// homepage's very first render/prerender snapshot briefly show the wrong
// locale before "catching up" — unacceptable for the prerender script's
// pristine-snapshot invariant (scripts/prerender/pages/*.js). Context value
// is available synchronously on first render instead.
import { createContext, useContext } from "react";
import i18n from "./i18n";
import { LOCALE_PREFIXES } from "./translatedRoutes";

export const LocaleContext = createContext("en");

export const useLocale = () => useContext(LocaleContext);

// Returns a `t` function fixed to the current route's locale + namespace(s),
// independent of i18next's global language state.
export function useLocaleT(ns) {
  const locale = useLocale();
  return i18n.getFixedT(locale, ns);
}

// Every page has a live route under /fi and /de (App.jsx mirrors the whole
// tree — see translatedRoutes.js), even before that specific page has real
// translated copy. Without this, an internal <Link to={menuPaths.x}> built
// from the plain (English) path would silently drop a /fi visitor back to
// English the moment they clicked anything — the URL is the only thing
// that "remembers" the chosen locale across navigations, since locale isn't
// otherwise persisted (no cookie/localStorage — see HeaderLanguageSwitcher).
// Leaves external links (no leading "/") and already-English untouched.
export function withLocalePrefix(path, locale) {
  if (!path || typeof path !== "string" || !path.startsWith("/")) return path;
  if (!locale || locale === "en" || !LOCALE_PREFIXES.includes(locale)) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

// Returns a function that prefixes a plain (English) path with the current
// route's locale, so internal links built from menuPaths stay on /fi or /de
// instead of reverting to English on the next click.
export function useLocalizedPath() {
  const locale = useLocale();
  return (path) => withLocalePrefix(path, locale);
}
