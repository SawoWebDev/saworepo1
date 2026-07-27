import { routing } from '@/translation/routing';
import { getPathname } from '@/translation/navigation';
import { SITE_URL } from '@/lib/seo/alternates';
import { BUILT_ROUTES } from '@/lib/routes/built';

// Only routes with an actual page.jsx (BUILT_ROUTES) — routing.js `pathnames`
// declares ~40 routes for the whole eventual site, most not built yet;
// enumerating all of them here would emit sitemap URLs that 404.
// Product/accessory/sauna-room slugs get added once those [slug] pages exist.
export default function sitemap() {
  return BUILT_ROUTES.map((pathname) => {
    const languages = {};
    for (const locale of routing.locales) {
      languages[locale] = `${SITE_URL}${getPathname({ locale, href: pathname })}`;
    }
    return {
      url: languages[routing.defaultLocale],
      alternates: { languages },
      changeFrequency: 'weekly',
      priority: pathname === '/' ? 1 : 0.7,
    };
  });
}
