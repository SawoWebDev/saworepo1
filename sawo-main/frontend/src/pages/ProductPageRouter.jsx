// src/pages/ProductPageRouter.jsx
// Decides whether to render ProductPage or AccessoriesPage based on product type

import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import DispProduct from "./IndividualDisplay/DispProduct";
import DispAccessories from "./IndividualDisplay/DispAccessories";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";
import { isPubliclyVisible } from "../local-storage/visibility";
import { useLocalizedPath } from "../i18n/LocaleContext";

export default function ProductPageRouter() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const localize = useLocalizedPath();
  const { products: localProds } = useLocalProducts();

  const product = useMemo(() => {
    if (!localProds.length) return null;
    return localProds.find(p => p.slug === slug && isPubliclyVisible(p)) || null;
  }, [localProds, slug]);

  // If product is an accessory, redirect to /accessories/:slug — must stay
  // on the current locale prefix (localize()), or a /zh visitor silently
  // gets bounced back to English the moment products finish loading and
  // this redirect fires (was hardcoded to the bare English path before).
  if (product && isAccessoryProduct(product)) {
    // Redirect to accessories route
    navigate(localize(`/accessories/${slug}`), { replace: true });
    return <DispAccessories />;
  }

  // Otherwise, render standard ProductPage
  return <DispProduct />;
}
