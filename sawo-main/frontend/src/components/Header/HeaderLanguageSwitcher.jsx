import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LOCALES, LOCALE_PREFIXES } from "../../i18n/translatedRoutes";
import Flag from "./LanguageFlag";
import { afterPageLoad } from "../../utils/afterPageLoad";
import { getCachedLanguageSwitcherEnabled, getCachedEnabledLanguages, getCachedLanguageOrder } from "../../local-storage/languageSettings";
import { subscribeToSettings } from "../../local-storage/appSettings";

// Built from LOCALE_PREFIXES, not hand-typed — a hardcoded `(fi|de)` here
// silently stops matching every route the day a new locale prefix is added
// to LOCALE_PREFIXES elsewhere (shipped once already: adding "zh" without
// updating this regex left the switcher unable to detect it was on a /zh
// page at all). Non-empty prefixes only ("" = English, unprefixed).
const LOCALE_PREFIX_PATTERN = LOCALE_PREFIXES.filter(Boolean).join("|");

// Splits a pathname like "/fi/sauna" into its locale ("fi") and the
// unprefixed path ("/sauna"). Unprefixed paths (English) return locale "en".
function splitLocale(pathname) {
  const match = new RegExp(`^/(${LOCALE_PREFIX_PATTERN})(/.*)?$`).exec(pathname);
  if (!match) return { locale: "en", path: pathname };
  return { locale: match[1], path: match[2] || "/" };
}

// Header globe dropdown, right of "Contact Us". Initial state comes from
// getCachedLanguageSwitcherEnabled()/getCachedEnabledLanguages() — a
// SYNCHRONOUS localStorage read, not a hardcoded default — so a repeat
// visitor (or same-session remount) paints the CORRECT enabled/disabled
// state on first render, no flash. Only a genuine first-ever visit (or a
// prerender snapshot, where the network fetch is deliberately blocked)
// has no cached answer; those start hidden and pop in once afterPageLoad's
// live fetch resolves, rather than the old behavior of starting shown and
// vanishing if the CMS toggle turns out to be off — see
// local-storage/languageSettings.js's comment for why that direction was
// chosen. This is also why the switcher was pulled from Header.jsx
// entirely for a while (see git history) rather than just left disabled —
// re-mounted now that the actual flash source is fixed at the root, not
// papered over.
export default function HeaderLanguageSwitcher({ variant = "desktop", onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale: currentLocale, path: basePath } = splitLocale(location.pathname);
  const [open, setOpen] = useState(false);
  const [langs, setLangs] = useState(() => getCachedEnabledLanguages());
  const [order, setOrder] = useState(() => getCachedLanguageOrder());
  const [enabled, setEnabled] = useState(() => getCachedLanguageSwitcherEnabled());
  const ref = useRef(null);
  const hoverTimeout = useRef(null);

  useEffect(() => {
    if (variant !== "desktop") return undefined;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [variant]);

  const loadSettings = () => {
    import("../../local-storage/languageSettings").then((m) => {
      Promise.all([m.getLanguageSwitcherEnabled(), m.getEnabledLanguages(), m.getLanguageOrder()])
        .then(([e, l, o]) => {
          setEnabled(e);
          setLangs(l);
          setOrder(o);
        })
        .catch(() => {});
    });
  };

  useEffect(() => afterPageLoad(loadSettings), []);

  // Re-read the (already-updated) cache whenever the settings change under
  // us: the CMS saving in another tab of this browser, or a revalidation
  // finishing. Cache-only and synchronous, so no request is made.
  useEffect(
    () => subscribeToSettings(() => {
      setEnabled(getCachedLanguageSwitcherEnabled());
      setLangs(getCachedEnabledLanguages());
      setOrder(getCachedLanguageOrder());
    }),
    []
  );

  // Coming back to a tab that sat in the background: revalidate (still
  // bounded by the 30s TTL in appSettings, so this is at most one small
  // request) instead of showing whatever was true when the tab was left.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadSettings();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const toggleOpen = () => {
    setOpen((v) => {
      if (!v) loadSettings();
      return !v;
    });
  };

  // Hover open/close — same delayed-close pattern as the other nav dropdowns
  // (Header.jsx's handleMouseEnterMenu/handleMouseLeaveMenu), so this behaves
  // identically to Sauna/Steam/Support/About Us on hover.
  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpen((v) => {
      if (!v) loadSettings();
      return true;
    });
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setOpen(false), 200);
  };

  // Routes internally (in-app, no full reload — every path is a real route
  // under every locale prefix, see App.jsx's PUBLIC_ROUTES x LOCALE_PREFIXES).
  // Always mirrors the current path 1:1, both directions — switching
  // language is not a "go to that locale's home" action, it's "show me
  // this same page in another language", full stop, even for a page that's
  // only partially translated (untranslated strings fall back to English
  // per-key, see i18n.js's fallbackLng comment — better than bouncing the
  // visitor back to home and losing their place). translatedRoutes.js's
  // isTranslated()/TRANSLATED_PATHS still exists for a separate, narrower
  // question — whether a given page should assert itself to search engines
  // as a genuinely reviewed translation via hreflangAlternates (passed
  // page-by-page to <SEO>, see README-i18n.md) — just not for routing here.
  const go = (code) => {
    setOpen(false);
    onNavigate?.();
    if (code === currentLocale) return;
    navigate(code === "en" ? basePath : `/${code}${basePath === "/" ? "" : basePath}`);
  };

  if (!enabled) return null;

  // Order comes from the CMS (Settings > Language Switcher, drag to reorder).
  // The language the visitor is already on is left out of the list — it's
  // shown on the toggle button itself, so listing it again is just noise.
  // With nothing else to switch to, the whole control is hidden.
  const visibleLocales = order
    .map((code) => LOCALES.find((l) => l.code === code))
    .filter((l) => l && langs.includes(l.code) && l.code !== currentLocale);
  if (visibleLocales.length === 0) return null;

  if (variant === "mobile") {
    return (
      <div className="header-lang-mobile">
        <span className="header-lang-mobile-label">
          <span className="header-lang-flag"><Flag code={currentLocale} /></span> Language
        </span>
        <div className="header-lang-mobile-options">
          {visibleLocales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => go(l.code)}
              className={`header-lang-option${l.code === currentLocale ? " is-active" : ""}`}
            >
              <span className="header-lang-flag-sm"><Flag code={l.code} /></span>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="header-lang"
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="header-lang-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
        title="Switch language"
        onClick={toggleOpen}
      >
        <span className="header-lang-flag"><Flag code={currentLocale} /></span>
        <span className="header-lang-code">{currentLocale.toUpperCase()}</span>
        <i className="fa-solid fa-chevron-down text-[10px]" aria-hidden="true"></i>
      </button>

      {open && (
        <ul className="header-lang-menu" role="listbox" aria-label="Language">
          {visibleLocales.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => go(l.code)}
                className={`header-lang-option${l.code === currentLocale ? " is-active" : ""}`}
                role="option"
                aria-selected={l.code === currentLocale}
              >
                <span className="header-lang-flag-sm"><Flag code={l.code} /></span>
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
