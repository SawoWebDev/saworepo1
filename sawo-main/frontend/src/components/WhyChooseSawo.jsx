import React from "react";
import CirclesInfo from "./CirclesInfo";

const DEFAULT_BROCHURE =
  "https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf";

export default function WhyChooseSawo({
  eyebrow = "SAWO ACCESSORIES",
  title,
  description,
  brochureHref = DEFAULT_BROCHURE,
  brochureLabel = "VIEW BROCHURE",
}) {
  return (
    <section className="wm-section wm-section--why">
      <div className="wm-container">
        <div className="wm-why-grid">
          <div className="wm-why-left">
            <p className="wm-eyebrow">{eyebrow}</p>
            <h2 className="wm-why-title">{title}</h2>
            <p className="wm-why-desc">{description}</p>
            {brochureHref && (
              <div style={{ marginTop: "20px" }}>
                <a
                  href={brochureHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wm-brochure-btn"
                >
                  {brochureLabel}
                </a>
              </div>
            )}
          </div>
          <div className="wm-why-right"><CirclesInfo /></div>
        </div>
      </div>
    </section>
  );
}
