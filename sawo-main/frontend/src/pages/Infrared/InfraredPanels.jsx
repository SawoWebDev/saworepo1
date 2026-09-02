import React, { useMemo } from "react";
import ProductShowcase from "../../components/ProductShowcase";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import { useLocale, useLocaleT } from "../../i18n/LocaleContext";
import heroImg from "../../assets/Infrared/ir-panels-hero.webp";

// Selected by slug, not by category: every infrared product carries the
// single category "Infrared", so a category filter (the way
// SteamGenerators selects) cannot separate panels from controls. The list
// is also the display order, which a category filter could not express
// either. Re-categorising these in the CMS as "Infrared Panels" /
// "Infrared Controls" would let both pages become data-driven — worth doing
// if this range grows, but it is a content change, not a code one.
export const PANEL_SLUGS = ["infrared-panels", "infrared-backrest", "interface-holder"];

const InfraredPanels = () => {
  const locale = useLocale();
  const t = useLocaleT("infrared");
  const { products, loading } = useLocalProducts();

  const panels = useMemo(() => {
    const bySlug = new Map(
      products.filter(isPubliclyVisible).map((p) => [p.slug, p])
    );
    return PANEL_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
  }, [products]);

  return (
    <ProductShowcase
      seoTitle={t("panels.meta.title")}
      seoDescription={t("panels.meta.description")}
      seoPath={locale === "en" ? "/infrared/panels" : `/${locale}/infrared/panels`}
      seoHreflangAlternates={{ en: "/infrared/panels", fi: "/fi/infrared/panels", zh: "/zh/infrared/panels" }}
      heroImage={heroImg}
      heroTitle={t("panels.hero.title")}
      introTitle={t("panels.intro.title")}
      introText={t("panels.intro.text")}
      products={panels}
      loading={loading}
      eyebrow={t("panels.eyebrow")}
      fallbackBlurb={t("panels.fallbackBlurb")}
      emptyText={t("panels.emptyText")}
      loadingText={t("panels.loadingText")}
      ctaTitle={t("panels.cta.title")}
      ctaDescription={t("panels.cta.description")}
    />
  );
};

export default InfraredPanels;
