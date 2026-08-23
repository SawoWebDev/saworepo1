// src/pages/Steam/SteamGenerators.jsx

import React, { useMemo } from "react";
import ProductShowcase from "../../components/ProductShowcase";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import heroImg from "../../assets/Steam/Steam Generators/STN-S.webp";
import { useLocaleT } from "../../i18n/LocaleContext";

// The hero/intro/rows/CTA layout and its CSS moved to
// components/ProductShowcase so the infrared catalogue pages could reuse it
// instead of carrying a second copy. This page keeps what is actually its
// own: which products to show, and the copy around them (translated via
// steam.json's "generators" namespace — see README-i18n.md).
const SteamGenerators = () => {
  const { products: localProds, loading } = useLocalProducts();
  const t = useLocaleT("steam");

  const generators = useMemo(() => {
    const visible = localProds.filter(p => isPubliclyVisible(p));
    const filtered = visible.filter(p => (p.categories || []).includes("Steam Generators"));
    return [...filtered].sort((a, b) => {
      const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
      if (sA !== sB) return sA - sB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  return (
    <ProductShowcase
      seoTitle={t("generators.meta.title")}
      seoDescription={t("generators.meta.description")}
      seoPath="/steam/generators"
      seoHreflangAlternates={{ en: "/steam/generators", fi: "/fi/steam/generators" }}
      heroImage={heroImg}
      heroTitle={t("generators.hero.title")}
      introTitle={t("generators.intro.heading")}
      introText={t("generators.intro.desc")}
      products={generators}
      loading={loading}
      eyebrow={t("generators.cardEyebrow")}
      fallbackBlurb={t("generators.cardFallbackDesc")}
      emptyText={t("generators.empty")}
      loadingText={t("generators.loading")}
      ctaTitle={t("generators.cta.title")}
      ctaDescription={t("generators.cta.description")}
    />
  );
};

export default SteamGenerators;
