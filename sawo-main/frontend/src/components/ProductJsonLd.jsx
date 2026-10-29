// Renders the product's JSON-LD into <head> via Helmet. Mirrors SEO.jsx: one
// per route-level page, fed the already-translated product (see
// utils/productJsonLd.js for how that makes it locale-aware).
import { Helmet } from "react-helmet-async";
import { buildProductJsonLd } from "../utils/productJsonLd";

export default function ProductJsonLd({ product, locale, path, image, images, itemCode }) {
  if (!product) return null;
  const ld = buildProductJsonLd(product, { locale, path, image, images, itemCode });
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(ld)}</script>
    </Helmet>
  );
}
