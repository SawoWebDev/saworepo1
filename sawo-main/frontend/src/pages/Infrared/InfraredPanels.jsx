import React, { useMemo } from "react";
import ProductShowcase from "../../components/ProductShowcase";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
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
  const { products, loading } = useLocalProducts();

  const panels = useMemo(() => {
    const bySlug = new Map(
      products.filter(isPubliclyVisible).map((p) => [p.slug, p])
    );
    return PANEL_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
  }, [products]);

  return (
    <ProductShowcase
      seoTitle="Infrared Panels"
      seoDescription="SAWO infrared panels and accessories — fiber-coated far infrared panels at 170W each, backrests, and interface holders for your infrared room."
      seoPath="/infrared/panels"
      heroImage={heroImg}
      heroTitle="INFRARED PANELS"
      introTitle="Introducing Our Infrared Panels"
      introText="Fiber-coated far infrared panels warm the body directly rather than heating the air around it, so sessions stay comfortable at a much lower room temperature. Each panel draws 170W and is built to sit flush within the cabin, alongside the backrests and interface holders that complete the room."
      products={panels}
      loading={loading}
      eyebrow="Infrared Panel"
      fallbackBlurb="Premium SAWO infrared component built for gentle, everyday warmth."
      emptyText="No infrared panels available yet."
      loadingText="Loading infrared panels..."
      ctaTitle="Not Sure Which Panel You Need?"
      ctaDescription="Panel count and placement depend on the size of your infrared room. Our team can help you work out the right configuration for your space."
    />
  );
};

export default InfraredPanels;
