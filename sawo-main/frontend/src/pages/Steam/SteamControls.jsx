// SteamControls.jsx

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import CategoryHero from "../../components/CategoryHero";
import SEO from "../../components/SEO";
import PageCTA from "../../components/PageCTA";
import { isPubliclyVisible } from "../../local-storage/visibility";

// Served from /public (not webpack-bundled) so its URL is stable at build time —
// public/index.html preloads this exact path for this route, so by the time
// this component mounts and applies it, the browser already has it cached.
const heroBg = "/hero/steam-controls.webp";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field) {
  return localOrRemote(product, field) || null;
}

const DISPLAY_CATEGORIES = ["Steam Controls"];

// ─── Product card (matches /products) ──────────────────────────────────────────
function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={`/products/${product.slug}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          padding: "12px 8px", borderRadius: 10, transition: "transform 0.25s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)", cursor: "pointer",
        }}
      >
        <div style={{
          width: "100%", height: 200, display: "flex", alignItems: "center",
          justifyContent: "center", overflow: "hidden", background: "transparent",
        }}>
          {getImageUrl(product, "thumbnail") ? (
            <img
              src={getImageUrl(product, "thumbnail")}
              alt={product.name}
              style={{
                maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                transition: "transform 0.25s ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            />
          ) : (
            <i className="fas fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
          )}
        </div>
        <p style={{
          fontWeight: 600, fontSize: "0.78rem", color: hovered ? "#a67853" : "#af8564",
          margin: 0, lineHeight: 1.4, textAlign: "center", transition: "color 0.2s ease",
        }}>
          {product.name}
        </p>
      </div>
    </Link>
  );
}

const SteamControls = () => {
  const { products: localProds, loading } = useLocalProducts();

  const controls = useMemo(() => {
    const visible = localProds.filter(p => isPubliclyVisible(p));
    const filtered = visible.filter(p =>
      (p.categories || []).some(c => DISPLAY_CATEGORIES.includes(c))
    );
    return [...filtered].sort((a, b) => {
      const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
      if (sA !== sB) return sA - sB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  return (
  <div className="relative">
      <SEO
        title="Steam Controls"
        description="Precision steam control from SAWO, with the Saunova and Innova control series for effortless operation and a personalized sauna experience."
        path="/steam/controls"
      />

    {/* ===================== */}
    {/* HERO                  */}
    {/* ===================== */}
    <CategoryHero
      heroImg={heroBg}
      title="Steam Controls"
      description="Precision and ease — take full control of your steam experience with SAWO's Saunova and Innova control series."
    />

    {/* ===================== */}
    {/* INTRO                 */}
    {/* ===================== */}
    <section className="sc-intro-section">
      <div className="sc-container text-center">
        <h2 className="sc-section-title">Introducing Our Steam Controls</h2>
        <p className="sc-section-desc">
          Experience precise steam settings and effortless operation with the
          Saunova and Innova series for a personalized sauna experience.
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* CONTROLS              */}
    {/* ===================== */}
    <section className="sc-section">
      <div className="sc-container">
        {loading && <p style={{ textAlign: "center", color: "#999" }}>Loading controls...</p>}
        {!loading && controls.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>No steam controls available yet.</p>
        )}
        {!loading && controls.length > 0 && (
          <div className="products-grid">
            {controls.map(product => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>

    {/* ===================== */}
    {/* PRECAUTION NOTICE     */}
    {/* ===================== */}
    <section className="sc-notice-section">
      <div className="sc-container">
        <div className="sfw-notice-wrap">
          <div className="sfw-notice-card">
            <span className="sfw-notice-tab">Precaution Notice</span>
            <div className="sfw-notice-body">
              <p>Only a qualified electrician is allowed to make electrical connections and repairs on the unit. Use original parts only.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ===================== */}
    {/* CTA                   */}
    {/* ===================== */}
    <PageCTA
      title="Need Help Choosing a Control?"
      description="Pair the right control panel with your steam generator for precise, effortless operation. Our team is here to help."
    />

    {/* ===================== */}
    {/* STYLES                */}
    {/* ===================== */}
    <style>{`

      /* ---- Layout ---- */
      .sc-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .sc-intro-section {
        padding: 72px 0 0;
      }
      .sc-section {
        padding: 48px 0 80px;
      }
      .sc-section-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.2rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sc-section-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.05rem; font-weight: 400;
        color: #555; line-height: 1.8;
        max-width: 680px; margin: 0 auto;
      }

      /* ---- Product grid (matches /products) ---- */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 24px 16px;
      }
      @media screen and (max-width: 1400px) {
        .products-grid { grid-template-columns: repeat(4, 1fr); }
      }
      @media screen and (max-width: 1100px) {
        .products-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media screen and (max-width: 480px) {
        .products-grid { grid-template-columns: repeat(2, 1fr); }
      }

      /* ---- Responsive ---- */
      @media (max-width: 768px) {
        .sc-section-title { font-size: 1.7rem; }
        .products-grid { grid-template-columns: repeat(3, 1fr); gap: 16px 12px; }
        .sc-intro-section { padding: 48px 0 0; }
        .sc-section { padding: 32px 0 60px; }
      }

      /* ---- Precaution notice ---- */
      .sc-notice-section {
        padding: 0 0 56px;
      }
      .sfw-notice-wrap {
        width: 100%;
        margin: 0;
        padding: 0;
        font-family: 'Montserrat', sans-serif;
        box-sizing: border-box;
      }
      .sfw-notice-card {
        position: relative;
        width: 100%;
        background: #fdfaf7;
        border: 2px solid #A67853;
        border-radius: 10px;
        padding: 30px 36px 30px 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        overflow: hidden;
        box-shadow: 0 6px 16px rgba(139, 94, 60, 0.1);
        box-sizing: border-box;
      }
      .sfw-notice-tab {
        position: absolute;
        top: 0;
        left: 0;
        background: #8B5E3C;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 6px 18px 6px 14px;
        border-bottom-right-radius: 10px;
      }
      .sfw-notice-body {
        margin-top: 14px;
        flex: 1 1 auto;
        text-align: center;
      }
      .sfw-notice-body p {
        margin: 0;
        font-size: 1.12rem;
        font-weight: 300;
        line-height: 1.6;
        color: #3a2c22;
      }
      @media (max-width: 768px) {
        .sc-notice-section { padding: 0 0 40px; }
        .sfw-notice-card {
          flex-direction: column;
          align-items: center;
          padding: 34px 24px 26px;
          gap: 14px;
        }
        .sfw-notice-body {
          margin-top: 0;
        }
        .sfw-notice-body p {
          font-size: 1.02rem;
        }
      }
    `}</style>

  </div>
  );
};

export default SteamControls;