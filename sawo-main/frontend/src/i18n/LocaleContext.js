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

export const LocaleContext = createContext("en");

export const useLocale = () => useContext(LocaleContext);

// Returns a `t` function fixed to the current route's locale + namespace(s),
// independent of i18next's global language state.
export function useLocaleT(ns) {
  const locale = useLocale();
  return i18n.getFixedT(locale, ns);
}
