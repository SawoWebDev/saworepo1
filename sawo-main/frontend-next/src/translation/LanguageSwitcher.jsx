'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from './navigation';
import { routing, localeNames } from './routing';
import Flag from './flags/Flag';

// Floating language switcher, pinned bottom-left. Shows the current locale's
// flag; clicking opens a small popup listing the other languages. Styles live
// in globals.css (.lang-switcher*) so every page shares them — no per-page CSS.
export default function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const switchTo = (loc) => {
    router.replace({ pathname, params }, { locale: loc });
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={ref}>
      {open && (
        <ul className="lang-switcher-menu" role="listbox" aria-label={t('language.label')}>
          {routing.locales.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                onClick={() => switchTo(loc)}
                className={`lang-switcher-option${loc === locale ? ' is-active' : ''}`}
                role="option"
                aria-selected={loc === locale}
              >
                <span className="lang-flag">
                  <Flag code={loc} />
                </span>
                <span className="lang-name">{localeNames[loc]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="lang-switcher-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.switchTo')}
        title={t('language.switchTo')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lang-flag">
          <Flag code={locale} />
        </span>
        <span className="lang-code">{locale.toUpperCase()}</span>
      </button>
    </div>
  );
}
