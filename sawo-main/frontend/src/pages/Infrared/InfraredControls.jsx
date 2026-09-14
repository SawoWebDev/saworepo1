import React, { useMemo } from "react";
import ProductShowcase from "../../components/ProductShowcase";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import { useLocale, useLocaleT } from "../../i18n/LocaleContext";
import { CONTROL_SLUGS } from "./infraredClassification";
import heroImg from "../../assets/Infrared/IR-CONTROL-New.webp";

// Slug-selected for the same reason as InfraredPanels — see the note there.
// List lives in infraredClassification.js, re-exported here for callers
// that only need this page's list (e.g. AllProducts.jsx). Unclassified
// fallback products intentionally surface on the Panels page only (see
// getUnclassifiedInfraredProducts) — not duplicated here.
export { CONTROL_SLUGS };

const InfraredControls = () => {
  const locale = useLocale();
  const t = useLocaleT("infrared");
  const { products, loading } = useLocalProducts();

  const controls = useMemo(() => {
    const bySlug = new Map(
      products.filter(isPubliclyVisible).map((p) => [p.slug, p])
    );
    return CONTROL_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
  }, [products]);

  return (
    <ProductShowcase
      seoTitle={t("controls.meta.title")}
      seoDescription={t("controls.meta.description")}
      seoPath={locale === "en" ? "/infrared/controls" : `/${locale}/infrared/controls`}
      seoHreflangAlternates={{ en: "/infrared/controls", fi: "/fi/infrared/controls", zh: "/zh/infrared/controls" }}
      heroImage={heroImg}
      heroTitle={t("controls.hero.title")}
      introTitle={t("controls.intro.title")}
      introText={t("controls.intro.text")}
      products={controls}
      loading={loading}
      eyebrow={t("controls.eyebrow")}
      fallbackBlurb={t("controls.fallbackBlurb")}
      emptyText={t("controls.emptyText")}
      loadingText={t("controls.loadingText")}
      ctaTitle={t("controls.cta.title")}
      ctaDescription={t("controls.cta.description")}
    />
  );
};

export default InfraredControls;
