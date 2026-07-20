import { routing, pathnames } from '@/translation/routing';
import { getPathname } from '@/translation/navigation';
import { SITE_URL } from '@/lib/seo/alternates';

// Static routes only for now — product/accessory/sauna-room slugs get added
// once the Supabase-backed [slug] pages exist (see Phase 0 remaining work).
export default function sitemap() {
  const staticPaths = Object.keys(pathnames).filter((p) => !p.includes('['));

  return staticPaths.map((pathname) => {
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
