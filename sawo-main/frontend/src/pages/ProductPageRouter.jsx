// src/pages/ProductPageRouter.jsx
// Decides whether to render ProductPage or AccessoriesPage based on product type

import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import DispProduct from "./IndividualDisplay/DispProduct";
import DispAccessories from "./IndividualDisplay/DispAccessories";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";

export default function ProductPageRouter() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products: localProds } = useLocalProducts();

  const product = useMemo(() => {
    if (!localProds.length) return null;
    return localProds.find(p => p.slug === slug && p.status === "published" && p.visible !== false) || null;
  }, [localProds, slug]);

  // If product is an accessory, redirect to /accessories/:slug
  if (product && isAccessoryProduct(product)) {
    // Redirect to accessories route
    navigate(`/accessories/${slug}`, { replace: true });
    return <DispAccessories />;
  }

  // Otherwise, render standard ProductPage
  return <DispProduct />;
}
