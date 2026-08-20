import React, { useMemo } from "react";
import ProductShowcase from "../../components/ProductShowcase";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import heroImg from "../../assets/Infrared/IR-CONTROL-New.webp";

// Slug-selected for the same reason as InfraredPanels — see the note there.
const CONTROL_SLUGS = [
  "infrared-2-0-user-interface",
  "infrared-2-0-power-controller",
  "infrared-2-0-built-in-control",
];

const InfraredControls = () => {
  const { products, loading } = useLocalProducts();

  const controls = useMemo(() => {
    const bySlug = new Map(
      products.filter(isPubliclyVisible).map((p) => [p.slug, p])
    );
    return CONTROL_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
  }, [products]);

  return (
    <ProductShowcase
      seoTitle="Infrared Controls"
      seoDescription="SAWO Infrared 2.0 controls — user interface, power controller, and built-in control for managing temperature, session time, lighting, and airflow."
      seoPath="/infrared/controls"
      heroImage={heroImg}
      heroTitle="INFRARED CONTROLS"
      introTitle="Introducing Our Infrared Controls"
      introText="One control runs the whole room — temperature, session length from 1 to 60 minutes, lighting, and the exhaust fan. The Infrared 2.0 range covers the user interface, the power controller behind it, and a built-in option for a cleaner cabin wall."
      products={controls}
      loading={loading}
      eyebrow="Infrared Control"
      fallbackBlurb="Premium SAWO infrared control built for simple, reliable everyday use."
      emptyText="No infrared controls available yet."
      loadingText="Loading infrared controls..."
      ctaTitle="Need Help Choosing a Control?"
      ctaDescription="Whether you want a surface-mounted interface or a built-in unit, our team can help you pick the right control for your infrared sauna."
    />
  );
};

export default InfraredControls;
