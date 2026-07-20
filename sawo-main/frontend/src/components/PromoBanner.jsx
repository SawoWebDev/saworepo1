import React from "react";

/**
 * Shared full-width promo banner. The background image and dark overlay live in
 * `.wm-banner` (heaters.css) so every banner stays in sync from one place;
 * pass `image` only when a page needs to override it.
 */
export default function PromoBanner({ title, subtitle, image }) {
  return (
    <section
      className="wm-banner"
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <div className="wm-banner-content">
        <h2 className="wm-banner-title">{title}</h2>
        {subtitle && <p className="wm-banner-sub">{subtitle}</p>}
      </div>
    </section>
  );
}
