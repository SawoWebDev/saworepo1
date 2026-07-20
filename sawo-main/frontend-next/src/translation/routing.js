import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'fi', 'de'];
export const defaultLocale = 'en';

// Human-readable names for the language switcher, each in its own language.
export const localeNames = {
  en: 'English',
  fi: 'Suomi',
  de: 'Deutsch',
};

// Every public route lives here. Adding a locale later means adding entries to
// `locales` above — the path strings themselves stay shared until we decide to
// translate slugs (a deliberate Phase 2+ call, see the plan).
//
// This replaces the old frontend/src/menuPaths.js: `paths` below mirrors that
// nested shape so ported components keep the same call sites.
export const pathnames = {
  '/': '/',
  '/sauna': '/sauna',
  '/sauna/heaters': '/sauna/heaters',
  '/sauna/heaters/wall-mounted': '/sauna/heaters/wall-mounted',
  '/sauna/heaters/tower': '/sauna/heaters/tower',
  '/sauna/heaters/stone': '/sauna/heaters/stone',
  '/sauna/heaters/floor': '/sauna/heaters/floor',
  '/sauna/heaters/combi': '/sauna/heaters/combi',
  '/sauna/heaters/dragonfire': '/sauna/heaters/dragonfire',
  '/sauna/controls': '/sauna/controls',
  '/sauna/accessories': '/sauna/accessories',
  '/sauna/accessories/accessory-sets': '/sauna/accessories/accessory-sets',
  '/sauna/accessories/pails-ladles': '/sauna/accessories/pails-ladles',
  '/sauna/accessories/thermometers': '/sauna/accessories/thermometers',
  '/sauna/accessories/clocks-sandtimers': '/sauna/accessories/clocks-sandtimers',
  '/sauna/accessories/lights-covers': '/sauna/accessories/lights-covers',
  '/sauna/accessories/headrests-backrests': '/sauna/accessories/headrests-backrests',
  '/sauna/accessories/doors-handles': '/sauna/accessories/doors-handles',
  '/sauna/accessories/benches-floor-tiles': '/sauna/accessories/benches-floor-tiles',
  '/sauna/accessories/kivistone': '/sauna/accessories/kivistone',
  '/sauna/accessories/ventilations-add-ons': '/sauna/accessories/ventilations-add-ons',
  '/sauna/rooms': '/sauna/rooms',
  '/sauna/rooms/interior-designs': '/sauna/rooms/interior-designs',
  '/sauna/rooms/wood-panels-timbers': '/sauna/rooms/wood-panels-timbers',
  '/sauna/rooms/[slug]': '/sauna/rooms/[slug]',
  '/steam': '/steam',
  '/steam/generators': '/steam/generators',
  '/steam/controls': '/steam/controls',
  '/steam/accessories': '/steam/accessories',
  '/infrared': '/infrared',
  '/support': '/support',
  '/support/faq': '/support/faq',
  '/support/sauna-calculator': '/support/sauna-calculator',
  '/support/manuals': '/support/manuals',
  '/support/catalogue': '/support/catalogue',
  '/contact': '/contact',
  '/about': '/about',
  '/about/news': '/about/news',
  '/about/sustainability': '/about/sustainability',
  '/careers': '/careers',
  '/privacy-policy': '/privacy-policy',
  '/sitemap': '/sitemap',
  '/products': '/products',
  '/products/[slug]': '/products/[slug]',
  '/sauna-accessories': '/sauna-accessories',
  '/accessories/[slug]': '/accessories/[slug]',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English keeps its current unprefixed URLs (/sauna/heaters), so existing
  // indexed pages and their SEO equity survive the migration untouched.
  // fi/de get /fi/... and /de/... prefixes.
  localePrefix: 'as-needed',
  // Only redirect based on Accept-Language when someone lands on the bare root.
  // Deep links must always resolve to the locale in the URL so crawlers can
  // reach every language variant directly.
  localeDetection: true,
  pathnames,
});

// Same nested shape as the old menuPaths.js so ported components read naturally.
const paths = {
  home: '/',

  sauna: {
    parent: '/sauna',
    heaters: {
      parent: '/sauna/heaters',
      wallMounted: '/sauna/heaters/wall-mounted',
      tower: '/sauna/heaters/tower',
      stone: '/sauna/heaters/stone',
      floor: '/sauna/heaters/floor',
      combi: '/sauna/heaters/combi',
      dragonfire: '/sauna/heaters/dragonfire',
    },
    controls: '/sauna/controls',
    accessories: {
      parent: '/sauna/accessories',
      accessorySets: '/sauna/accessories/accessory-sets',
      pailsLadles: '/sauna/accessories/pails-ladles',
      thermometers: '/sauna/accessories/thermometers',
      clocksSandtimers: '/sauna/accessories/clocks-sandtimers',
      lightsCovers: '/sauna/accessories/lights-covers',
      headrestsBackrests: '/sauna/accessories/headrests-backrests',
      doorsHandles: '/sauna/accessories/doors-handles',
      benches: '/sauna/accessories/benches-floor-tiles',
      kivistone: '/sauna/accessories/kivistone',
      ventilations: '/sauna/accessories/ventilations-add-ons',
    },
    rooms: '/sauna/rooms',
    interiorDesigns: '/sauna/rooms/interior-designs',
    woodPanels: '/sauna/rooms/wood-panels-timbers',
  },

  steam: {
    parent: '/steam',
    generators: '/steam/generators',
    controls: '/steam/controls',
    accessories: '/steam/accessories',
  },

  infrared: '/infrared',

  support: {
    parent: '/support',
    faq: '/support/faq',
    saunaCalculator: '/support/sauna-calculator',
    manuals: '/support/manuals',
    catalogue: '/support/catalogue',
  },

  contact: '/contact',

  about: {
    parent: '/about',
    news: '/about/news',
    sustainability: '/about/sustainability',
  },

  careers: '/careers',
  privacy: '/privacy-policy',
  sitemap: '/sitemap',
  products: '/products',
  accessories: '/sauna-accessories',
};

export default paths;
