// src/i18n/i18n.js
//
// react-i18next setup. Catalogs are statically imported (not fetched) so
// they're bundled and available synchronously — same "no network dependency
// for core content" principle as the rest of the site's prerender story.
// Namespace files under src/i18n/locales/<locale>/<namespace>.json were
// carried over verbatim from the retired frontend-next app's
// src/translation/languages/ — same 5-namespace shape (common, footer,
// home, nav, seo), same real (not placeholder) fi/de copy.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enFooter from "./locales/en/footer.json";
import enHome from "./locales/en/home.json";
import enNav from "./locales/en/nav.json";
import enSeo from "./locales/en/seo.json";

import fiCommon from "./locales/fi/common.json";
import fiFooter from "./locales/fi/footer.json";
import fiHome from "./locales/fi/home.json";
import fiNav from "./locales/fi/nav.json";
import fiSeo from "./locales/fi/seo.json";

import deCommon from "./locales/de/common.json";
import deFooter from "./locales/de/footer.json";
import deHome from "./locales/de/home.json";
import deNav from "./locales/de/nav.json";
import deSeo from "./locales/de/seo.json";

export const NAMESPACES = ["common", "footer", "home", "nav", "seo"];
export const SUPPORTED_LOCALES = ["en", "fi", "de"];
export const DEFAULT_LOCALE = "en";

i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  ns: NAMESPACES,
  defaultNS: "common",
  interpolation: { escapeValue: false }, // React already escapes
  resources: {
    en: { common: enCommon, footer: enFooter, home: enHome, nav: enNav, seo: enSeo },
    fi: { common: fiCommon, footer: fiFooter, home: fiHome, nav: fiNav, seo: fiSeo },
    de: { common: deCommon, footer: deFooter, home: deHome, nav: deNav, seo: deSeo },
  },
  react: { useSuspense: false },
});

export default i18n;
