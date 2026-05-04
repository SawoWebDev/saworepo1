// src/pages/ProductPageRouter.jsx
// Decides whether to render ProductPage or AccessoriesPage based on product type

import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import ProductPage from "./ProductPage";
import AccessoriesPage from "./AccessoriesPage";

export default function ProductPageRouter() {
  const { slug } = useParams();
  const { products: localProds, loading } = useLocalProducts();

  const product = useMemo(() => {
    if (!localProds.length) return null;
    return localProds.find(p => p.slug === slug && p.status === "published" && p.visible !== false) || null;
  }, [localProds, slug]);

  // If product has variant_type set, render AccessoriesPage (variant selection UI)
  // Otherwise, render standard ProductPage
  if (product?.variant_type) {
    return <AccessoriesPage />;
  }

  return <ProductPage />;
}
