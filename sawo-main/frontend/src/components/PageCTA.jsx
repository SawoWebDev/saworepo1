// PageCTA.jsx
// Shared dark-wood "need help?" CTA card used at the bottom of product
// category pages (Sauna, Steam, Infrared, ...), above the footer.
// Change the background image, copy defaults, or styling here and every
// page that renders <PageCTA /> picks it up.

import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../menuPaths";
import woodBg from "../assets/SaunaCalculator-bg.webp";
import { useLocaleT, useLocalizedPath } from "../i18n/LocaleContext";

const PageCTA = ({
  title,
  description,
  primaryLabel,
  primaryTo = menuPaths.contact,
  secondaryLabel,
  secondaryTo = menuPaths.support.manuals,
  className = "",
}) => {
  // Callers passing a custom title/description (most product-category pages
  // do) win outright; anyone rendering <PageCTA /> bare gets the translated
  // generic default instead of the old hardcoded English.
  const t = useLocaleT("common");
  const localize = useLocalizedPath();
  const resolvedTitle = title ?? t("pageCTA.defaultTitle");
  const resolvedDescription = description ?? t("pageCTA.defaultDescription");
  const resolvedPrimaryLabel = primaryLabel ?? t("pageCTA.contactUs");
  const resolvedSecondaryLabel = secondaryLabel ?? t("pageCTA.viewManuals");

  return (
    <section className={`max-w-[1200px] mx-auto px-6 pb-20 ${className}`}>
      <div className="pcta-card">
        <h2 className="pcta-title">{resolvedTitle}</h2>
        <p className="pcta-desc">{resolvedDescription}</p>
        <div className="pcta-actions">
          {resolvedPrimaryLabel && primaryTo && (
            <Link to={localize(primaryTo)} className="pcta-btn pcta-btn--solid">
              {resolvedPrimaryLabel} <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.65rem" }} />
            </Link>
          )}
          {resolvedSecondaryLabel && secondaryTo && (
            <Link to={localize(secondaryTo)} className="pcta-btn pcta-btn--outline">
              {resolvedSecondaryLabel} <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.65rem" }} />
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .pcta-card {
          position: relative;
          background-color: #241c17;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='pctan'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23pctan)' opacity='0.05'/%3E%3C/svg%3E"),
            linear-gradient(rgba(18,12,7,0.82), rgba(18,12,7,0.82)),
            url('${woodBg}');
          background-size: auto, cover, cover;
          background-position: center, center, center bottom;
          border-radius: 20px;
          padding: 64px 40px;
          text-align: center;
          box-shadow: 0 16px 40px rgba(36,28,23,0.22);
        }
        .pcta-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 14px;
        }
        .pcta-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          font-weight: 300;
          color: rgba(255,255,255,0.88);
          margin: 0 auto;
          max-width: 560px;
          line-height: 1.7;
        }
        .pcta-actions {
          display: flex;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
          margin-top: 32px;
        }
        .pcta-btn {
          font-family: 'Montserrat', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 30px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .pcta-btn--solid {
          background: #AA8161;
          border: 2px solid #AA8161;
          color: #fff;
        }
        .pcta-btn--solid:hover {
          background: #96684b;
          border-color: #96684b;
        }
        .pcta-btn--outline {
          background: transparent;
          border: 2px solid #fff;
          color: #fff;
        }
        .pcta-btn--outline:hover {
          background: #fff;
          color: #8b5e3c;
        }

        @media (max-width: 768px) {
          .pcta-card { padding: 44px 24px; }
          .pcta-title { font-size: 22px; }
          .pcta-actions { flex-direction: column; align-items: stretch; }
          .pcta-btn { justify-content: center; }
        }
      `}</style>
    </section>
  );
};

export default PageCTA;
