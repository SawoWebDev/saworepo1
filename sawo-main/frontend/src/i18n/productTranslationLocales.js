// src/i18n/productTranslationLocales.js
//
// Locales the Translation CMS manages product-translation DATA for.
// Deliberately separate from translatedRoutes.js's LOCALES/LOCALE_PREFIXES
// (site chrome i18n, tied to which /<locale>/* routes actually exist and
// serve real content). Product translation work can — and here, does —
// get ahead of public routing: a product can be fully translated into
// Japanese in product_translations long before /ja/* exists as a route.
// A locale listed here is not a claim that it's live on the public site.
export const PRODUCT_TRANSLATION_LOCALES = [
  { code: "fi", label: "Suomi" },
  { code: "zh", label: "简体中文" },
  { code: "ja", label: "日本語" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "th", label: "ไทย" },
];
