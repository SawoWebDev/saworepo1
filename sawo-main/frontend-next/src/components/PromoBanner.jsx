// Shared full-width promo banner. Background image/overlay live in
// .wm-banner (globals.css) so every banner stays in sync from one place;
// pass `image` only when a page needs to override it.
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
