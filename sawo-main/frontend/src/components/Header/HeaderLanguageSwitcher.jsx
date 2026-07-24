import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TRANSLATED_PATHS, LOCALES } from "../../i18n/translatedRoutes";
import { afterPageLoad } from "../../utils/afterPageLoad";

// Inline SVG flags — kept in sync by hand with
// frontend-next/src/components/Header/HeaderLanguageSwitcher.jsx's flag set.
// Emoji flags don't render on Windows/some browsers, so these are drawn by
// hand. Rendered inside a circular frame (.header-lang-flag*) below.
function FlagEn(props) {
  return (
    <svg viewBox="0 0 60 30" {...props}>
      <clipPath id="uk-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="uk-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#uk-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
function FlagFi(props) {
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="36" fill="#fff" />
      <rect x="16" width="10" height="36" fill="#003580" />
      <rect y="13" width="60" height="10" fill="#003580" />
    </svg>
  );
}
function FlagDe(props) {
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="12" y="0" fill="#000" />
      <rect width="60" height="12" y="12" fill="#DD0000" />
      <rect width="60" height="12" y="24" fill="#FFCE00" />
    </svg>
  );
}
const FLAGS = { en: FlagEn, fi: FlagFi, de: FlagDe };

function Flag({ code, className }) {
  const Svg = FLAGS[code] || FlagEn;
  return <Svg className={className} preserveAspectRatio="xMidYMid slice" />;
}

// Header globe dropdown, right of "Contact Us". First render is fully static
// (closed, "EN") so it's identical in the prerendered snapshot — no layout
// shift during the paint/LCP window Lighthouse measures. The CMS-driven
// enabled-languages setting used to be read lazily on first click only,
// which meant disabling the switcher in the CMS never took effect until a
// visitor happened to hover/click it (and even then it would visibly vanish
// mid-interaction). It's now also loaded once via afterPageLoad — same
// deferred-until-idle pattern as HeroWave — so a disabled switcher actually
// disappears shortly after the page settles, without reintroducing it into
// the critical rendering path.
export default function HeaderLanguageSwitcher({ variant = "desktop", onNavigate }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [langs, setLangs] = useState(LOCALES.map((l) => l.code));
  const [enabled, setEnabled] = useState(true);
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
      Promise.all([m.getLanguageSwitcherEnabled(), m.getEnabledLanguages()])
        .then(([e, l]) => {
          setEnabled(e);
          setLangs(l);
        })
        .catch(() => {});
    });
  };

  useEffect(() => afterPageLoad(loadSettings), []);

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

  const go = (code) => {
    setOpen(false);
    onNavigate?.();
    if (code === "en") return;
    const path = TRANSLATED_PATHS.includes(location.pathname) && location.pathname !== "/"
      ? location.pathname
      : "";
    window.location.href = `/${code}${path}`;
  };

  if (!enabled) return null;

  const visibleLocales = LOCALES.filter((l) => langs.includes(l.code));

  if (variant === "mobile") {
    return (
      <div className="header-lang-mobile">
        <span className="header-lang-mobile-label">
          <span className="header-lang-flag"><Flag code="en" /></span> Language
        </span>
        <div className="header-lang-mobile-options">
          {visibleLocales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => go(l.code)}
              className={`header-lang-option${l.code === "en" ? " is-active" : ""}`}
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
        <span className="header-lang-flag"><Flag code="en" /></span>
        <span className="header-lang-code">EN</span>
        <i className="fa-solid fa-chevron-down text-[10px]" aria-hidden="true"></i>
      </button>

      {open && (
        <ul className="header-lang-menu" role="listbox" aria-label="Language">
          {visibleLocales.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => go(l.code)}
                className={`header-lang-option${l.code === "en" ? " is-active" : ""}`}
                role="option"
                aria-selected={l.code === "en"}
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
