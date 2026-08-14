// src/i18n/LocaleRoute.jsx
//
// Wrapped around every route element in App.jsx (once per locale prefix).
// Provides the active locale via context (see LocaleContext.js — synchronous,
// not an effect-driven i18next.changeLanguage(), so first paint is correct
// under prerender) and sets <html lang> to match.
import { useEffect } from "react";
import { LocaleContext } from "./LocaleContext";

export default function LocaleRoute({ locale, children }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
