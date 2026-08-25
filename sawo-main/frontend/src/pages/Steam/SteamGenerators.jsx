// src/pages/Steam/SteamGenerators.jsx
//
// Used to render via the shared components/ProductShowcase.jsx (alternating
// image/text rows). Given its own hero + grid here instead, matching
// /products, /sauna-heaters, /sauna/controls, and /steam/controls — so it's
// no longer coupled to ProductShowcase, which the Infrared pages still use
// and which this page's redesign shouldn't touch.

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import CategoryHero from "../../components/CategoryHero";
import SEO from "../../components/SEO";
import PageCTA from "../../components/PageCTA";
import heroImg from "../../assets/Steam/Steam Generators/STN-S.webp";
import { useLocaleT } from "../../i18n/LocaleContext";

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field) {
  return localOrRemote(product, field) || null;
}

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

const SteamGenerators = () => {
  const { products: localProds, loading } = useLocalProducts();
  const t = useLocaleT("steam");

  const generators = useMemo(() => {
    const visible = localProds.filter(p => isPubliclyVisible(p));
    const filtered = visible.filter(p => (p.categories || []).includes("Steam Generators"));
    return [...filtered].sort((a, b) => {
      const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
      if (sA !== sB) return sA - sB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  return (
    <div className="relative">
      <SEO
        title={t("generators.meta.title")}
        description={t("generators.meta.description")}
        path="/steam/generators"
      />

      <CategoryHero
        heroImg={heroImg}
        title={t("generators.hero.title")}
        description={t("generators.intro.desc")}
      />

      <section className="sg2-intro">
        <div className="sg2-container" style={{ textAlign: "center" }}>
          <h2 className="sg2-title">{t("generators.intro.heading")}</h2>
          <p className="sg2-desc">{t("generators.intro.desc")}</p>
        </div>
      </section>

      <section className="sg2-section">
        <div className="sg2-container">
          {loading && <p style={{ textAlign: "center", color: "#999" }}>{t("generators.loading")}</p>}
          {!loading && generators.length === 0 && (
            <p style={{ textAlign: "center", color: "#999" }}>{t("generators.empty")}</p>
          )}
          {!loading && generators.length > 0 && (
            <div className="products-grid">
              {generators.map(product => (
                <ProductCard key={product.id || product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <PageCTA
        title={t("generators.cta.title")}
        description={t("generators.cta.description")}
      />

      <style>{`
        .sg2-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .sg2-intro {
          padding: 72px 0 0;
        }
        .sg2-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem; font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px; line-height: 1.2;
        }
        .sg2-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem; font-weight: 400;
          color: #555; line-height: 1.8;
          max-width: 680px; margin: 0 auto;
        }
        .sg2-section {
          padding: 48px 0 80px;
        }

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

        @media (max-width: 768px) {
          .sg2-title { font-size: 1.7rem; }
          .sg2-intro { padding: 48px 0 0; }
          .sg2-section { padding: 32px 0 60px; }
          .products-grid { grid-template-columns: repeat(3, 1fr); gap: 16px 12px; }
        }
      `}</style>
    </div>
  );
};

export default SteamGenerators;
