'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter, getPathname } from '@/translation/navigation';
import { localeNames } from '@/translation/routing';

// English pages are served by the CRA app, not this Next app. Empty string in
// production means "same origin" (the CRA site proxies /fi and /de here, so a
// relative URL is correct); set locally in frontend-next/.env.local so the
// switcher can jump back to the CRA dev server on a different port.
const EN_ORIGIN = process.env.NEXT_PUBLIC_EN_SITE_ORIGIN || '';

// Inline SVG flags — emoji flags don't render on Windows/some browsers, so
// these are drawn by hand for consistent display everywhere. Rendered inside
// a circular frame (.header-lang-flag*) by the markup below.
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

// Header dropdown (right of Contact Us). Replaces the old floating bottom-left
// LanguageSwitcher. `locales` comes from the layout's CMS-driven settings
// (app_settings.enabled_languages) — omit/empty hides the switcher entirely.
// `variant="mobile"` renders a flat bordered row instead of a dropdown, for
// use inside the mobile slide-out menu.
export default function HeaderLanguageSwitcher({ locales, variant = 'desktop', onNavigate }) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (variant !== 'desktop') return undefined;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [variant]);

  if (!locales || locales.length === 0) return null;

  const switchTo = (loc) => {
    setOpen(false);
    onNavigate?.();
    if (loc === locale) return;
    if (loc === 'en') {
      window.location.href = EN_ORIGIN + getPathname({ href: { pathname, params }, locale: 'en' });
      return;
    }
    router.replace({ pathname, params }, { locale: loc });
  };

  if (variant === 'mobile') {
    return (
      <div className="header-lang-mobile">
        <span className="header-lang-mobile-label">
          <span className="header-lang-flag"><Flag code={locale} /></span> {t('language.label')}
        </span>
        <div className="header-lang-mobile-options">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchTo(loc)}
              className={`header-lang-option${loc === locale ? ' is-active' : ''}`}
            >
              <span className="header-lang-flag-sm"><Flag code={loc} /></span>
              {localeNames[loc]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="header-lang" ref={ref}>
      <button
        type="button"
        className="header-lang-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.switchTo')}
        title={t('language.switchTo')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="header-lang-flag"><Flag code={locale} /></span>
        <span className="header-lang-code">{locale.toUpperCase()}</span>
        <i className="fa-solid fa-chevron-down text-[10px]" aria-hidden="true"></i>
      </button>

      {open && (
        <ul className="header-lang-menu" role="listbox" aria-label={t('language.label')}>
          {locales.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                onClick={() => switchTo(loc)}
                className={`header-lang-option${loc === locale ? ' is-active' : ''}`}
                role="option"
                aria-selected={loc === locale}
              >
                <span className="header-lang-flag-sm"><Flag code={loc} /></span>
                {localeNames[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
