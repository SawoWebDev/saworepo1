// src/pages/Steam/SteamGenerators.jsx

import React, { useMemo } from "react";
import ProductShowcase from "../../components/ProductShowcase";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import heroImg from "../../assets/Steam/Steam Generators/STN-S.webp";

// The hero/intro/rows/CTA layout and its CSS moved to
// components/ProductShowcase so the infrared catalogue pages could reuse it
// instead of carrying a second copy. This page keeps what is actually its
// own: which products to show, and the copy around them.
const SteamGenerators = () => {
  const { products: localProds, loading } = useLocalProducts();

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
      seoTitle="Steam Generators"
      seoDescription="SAWO steam generators deliver the luxury of tailored steam from advanced generators with customized settings for exceptional spa-like performance."
      seoPath="/steam/generators"
      heroImage={heroImg}
      heroTitle="STEAM GENERATORS"
      introTitle="Introducing Our Steam Generators"
      introText="Experience the luxury of tailored steam with our advanced steam generators, providing reliable performance, customizable settings, and rejuvenating warmth for any space."
      products={generators}
      loading={loading}
      eyebrow="Steam Generator"
      fallbackBlurb="Premium SAWO steam generator built for reliable, everyday performance."
      emptyText="No steam generators available yet."
      loadingText="Loading generators..."
      ctaTitle="Need Help Sizing a Generator?"
      ctaDescription="From compact residential units to large commercial installations, our team can help you find the right steam generator for your space."
    />
  );
};

export default SteamGenerators;
