import React from "react";
import { Link } from "react-router-dom";
import HeroWave from "./HeroWave";
import SEO from "./SEO";
import PageCTA from "./PageCTA";
import { useHeroLoaded } from "../utils/useHeroLoaded";
import { useLocalizedPath } from "../i18n/LocaleContext";

// Product showcase page — hero, intro, alternating image/text product rows,
// CTA. Extracted from SteamGenerators.jsx, which is now one of its callers,
// so the layout and its ~115 lines of CSS live in one place instead of being
// re-pasted for every catalogue page that wants this treatment.
//
// Callers supply the products; this component does not query for them.
// Different pages select differently — steam generators by category, the
// infrared pages by an explicit slug order — and baking either strategy in
// here would make the other awkward.

function localOrRemote(product, field) {
  return product?.["local_" + field] || product?.[field] || null;
}

export function getImageUrl(product, field) {
  return localOrRemote(product, field) || null;
}

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

// First sentence of the description, for the card blurb. Falls back to the
// first 20 words when the text has no sentence-ending punctuation.
export function getFirstSentence(text) {
  if (!text) return "";
  const cleaned = stripHtml(text).replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^[^.!?]*[.!?](?=\s+[A-Z]|\s*$)/);
  return match ? match[0] : cleaned.split(/\s+/).slice(0, 20).join(" ") + "...";
}

const ProductShowcase = ({
  seoTitle, seoRawTitle, seoDescription, seoPath, seoHreflangAlternates,
  heroImage, heroTitle,
  introTitle, introText,
  products, loading,
  eyebrow, fallbackBlurb,
  emptyText = "No products available yet.",
  loadingText = "Loading...",
  ctaTitle, ctaDescription,
}) => {
  const heroLoaded = useHeroLoaded(heroImage);
  const localize = useLocalizedPath();

  return (
    <div className="relative">
      <SEO
        title={seoTitle}
        rawTitle={seoRawTitle}
        description={seoDescription}
        path={seoPath}
        hreflangAlternates={seoHreflangAlternates}
      />

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="sg-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }} // warm-dark placeholder so it doesn't flash gray before the hero image decodes
      >
        {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(" + heroImage + ")",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />
        <div className="sg-hero-overlay" />
        <div className="sg-hero-content">
          <h1 className="sg-hero-title">{heroTitle}</h1>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* INTRO                 */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h2 className="sg-section-title">{introTitle}</h2>
        <p className="sg-section-desc">{introText}</p>
      </section>

      {/* ===================== */}
      {/* PRODUCTS              */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        {loading && <p style={{ textAlign: "center", color: "#999" }}>{loadingText}</p>}
        {!loading && products.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>{emptyText}</p>
        )}
        {!loading && products.length > 0 && (
          <div className="sg-grid">
            {products.map((product, i) => (
              <Link
                to={localize("/products/" + product.slug)}
                className={"sg-row " + (i % 2 === 1 ? "sg-row--reverse" : "")}
                key={product.id || product.slug}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {/* Image */}
                <div className="sg-image-wrap">
                  {getImageUrl(product, "thumbnail") ? (
                    <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="sg-image" />
                  ) : (
                    <div style={{ width: "100%", height: 380, display: "flex", alignItems: "center", justifyContent: "center", background: "#faf7f4", color: "#ccc" }}>
                      <i className="fas fa-image" style={{ fontSize: "48px" }} />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="sg-text">
                  <p className="sg-eyebrow">{eyebrow}</p>
                  <h3 className="sg-card-title">{product.name}</h3>
                  <p className="sg-card-desc">
                    {getFirstSentence(product.short_description) || getFirstSentence(product.description) || fallbackBlurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===================== */}
      {/* CTA                   */}
      {/* ===================== */}
      <PageCTA title={ctaTitle} description={ctaDescription} />

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`

        /* --- Hero --- */
        .sg-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .sg-hero-content {
          position: relative;
          z-index: 1;
        }
        .sg-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }

        /* --- Intro --- */
        .sg-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          line-height: 1.2;
        }
        .sg-section-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
          max-width: 820px;
          margin: 0 auto;
        }

        /* --- Generator rows --- */
        .sg-grid {
          display: flex;
          flex-direction: column;
          gap: 80px;
        }
        .sg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .sg-row--reverse {
          direction: rtl;
        }
        .sg-row--reverse > * {
          direction: ltr;
        }

        /* --- Image --- */
        .sg-image-wrap {
          border-radius: 16px;
          overflow: hidden;
          background: #faf7f4;
        }
        .sg-image {
          width: 100%;
          height: 380px;
          object-fit: contain;
          display: block;
          transition: transform 0.5s ease;
        }
        .sg-image-wrap:hover .sg-image {
          transform: scale(1.06);
        }

        /* --- Text --- */
        .sg-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: #AA8161;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .sg-card-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.9rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          line-height: 1.2;
        }
        .sg-card-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.98rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .sg-hero-title { font-size: 28px; line-height: 36px; }
          .sg-section-title { font-size: 1.7rem; }
          .sg-row {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .sg-row--reverse { direction: ltr; }
          .sg-image { height: 260px; }
          .sg-card-title { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default ProductShowcase;
