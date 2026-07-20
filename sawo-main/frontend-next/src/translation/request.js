import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Message catalogs are split per namespace so a page only ever loads the
// namespaces it uses. Server Components render translations to HTML with zero
// client bytes; only Client Components receive a picked subset (see layout).
const NAMESPACES = ['common', 'nav', 'footer', 'home', 'seo'];

async function loadMessages(locale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`./languages/${locale}/${ns}.json`);
        return [ns, mod.default];
      } catch {
        // A namespace missing for a locale is expected mid-translation:
        // fall back to English rather than failing the render.
        const fallback = await import(`./languages/${routing.defaultLocale}/${ns}.json`);
        return [ns, fallback.default];
      }
    })
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
