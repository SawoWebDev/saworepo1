import React from "react";
import { Link } from "react-router-dom";

/**
 * Shared full-width promo banner. The background image and dark overlay live in
 * `.wm-banner` (heaters.css) so every banner stays in sync from one place;
 * pass `image` only when a page needs to override it.
 *
 * ctaPrompt/ctaLabel/ctaTo are all optional and only render a button when
 * ctaLabel + ctaTo are both given — used by the 6 heater series pages to
 * point back at the full heaters catalog, without adding a button to the
 * ~10 other pages (accessories, Sauna Controls) that reuse this same
 * component and never pass those props.
 */
export default function PromoBanner({ title, subtitle, image, ctaPrompt, ctaLabel, ctaTo }) {
  return (
    <section
      className="wm-banner"
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <div className="wm-banner-content">
        <h2 className="wm-banner-title">{title}</h2>
        {subtitle && <p className="wm-banner-sub">{subtitle}</p>}
        {ctaLabel && ctaTo && (
          <div className="wm-banner-cta">
            {ctaPrompt && <p className="wm-banner-cta-prompt">{ctaPrompt}</p>}
            <Link to={ctaTo} className="wm-banner-btn">{ctaLabel}</Link>
          </div>
        )}
      </div>
    </section>
  );
}
