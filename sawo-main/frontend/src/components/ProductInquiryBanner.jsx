// ProductInquiryBanner.jsx
// Shared "Inquire about this product" CTA strip for product detail pages.
// The button links to the Contact page with ?product=<name>, which opens the
// General Inquiry form with the subject pre-filled (see Contact.jsx), so the
// inquiry arrives already naming the product. Every product page renders
// this, so copy/styling changes here apply everywhere.

import React from "react";
import ButtonClear from "./Buttons/ButtonClear";
import menuPaths from "../menuPaths";
import { useLocaleT, useLocalizedPath } from "../i18n/LocaleContext";

const ProductInquiryBanner = ({
  productName,
  eyebrow,
  title,
  body,
  buttonLabel,
  to = menuPaths.contact,
  className = "",
}) => {
  const t = useLocaleT("product");
  const localize = useLocalizedPath();

  const href = productName
    ? `${localize(to)}?product=${encodeURIComponent(productName)}`
    : localize(to);

  return (
    <div className={`pib-wrap ${className}`}>
      <div className="pib-card">
        <div className="pib-text">
          <div className="pib-eyebrow">{eyebrow ?? t("inquire.eyebrow")}</div>
          <h3 className="pib-title">
            {title ?? (productName ? t("inquire.title", { name: productName }) : t("inquire.titleGeneric"))}
          </h3>
          <p className="pib-body">{body ?? t("inquire.body")}</p>
        </div>
        <div className="pib-action">
          <ButtonClear solid to={href} text={buttonLabel ?? t("inquire.button")} />
        </div>
      </div>

      <style>{`
        .pib-wrap {
          max-width: 1140px;
          margin: 0 auto;
          padding: 12px 8px;
        }
        .pib-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: 28px 32px;
          border-radius: 14px;
          background: linear-gradient(135deg, #8b5e3c, #a67853);
          color: #fff;
          font-family: 'Montserrat', sans-serif;
        }
        .pib-text { flex: 1 1 320px; min-width: 0; }
        .pib-eyebrow {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.85;
          margin-bottom: 6px;
        }
        .pib-title {
          margin: 0 0 6px;
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.3;
          color: #fff;
        }
        .pib-body {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.6;
          opacity: 0.92;
        }
        .pib-action { flex-shrink: 0; }

        @media (max-width: 600px) {
          .pib-card { padding: 24px 20px; }
          .pib-action, .pib-action a { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default ProductInquiryBanner;
