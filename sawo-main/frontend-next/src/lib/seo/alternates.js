import { routing } from '@/translation/routing';
import { getPathname } from '@/translation/navigation';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sawo.com';

/**
 * Builds the canonical URL + hreflang alternates map for a given internal
 * pathname (the key from translation/routing.js `pathnames`, e.g. "/sauna/heaters").
 * Every generateMetadata() call should go through this so no page can ever
 * omit or mismatch a language variant.
 */
export function buildAlternates(pathname, locale, params) {
  const languages = {};

  for (const loc of routing.locales) {
    const localizedPath = getPathname({ locale: loc, href: params ? { pathname, params } : pathname });
    languages[loc] = `${SITE_URL}${localizedPath}`;
  }
  // x-default points at the unprefixed default-locale URL — the version
  // shown to users/crawlers whose language doesn't match any locale we ship.
  languages['x-default'] = languages[routing.defaultLocale];

  return {
    canonical: languages[locale],
    languages,
  };
}
