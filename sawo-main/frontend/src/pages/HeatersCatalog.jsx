// HeatersCatalog.jsx — "/sauna-heaters"
// Full sidebar-navigable heaters catalog, structurally identical to
// AccessoriesCatalog.jsx ("/sauna-accessories") — hero + sticky category
// sidebar + one flat grid per series. This is the "View All Heaters"
// destination linked from SaunaHeaters.jsx and each individual heater
// series page, mirroring how AccessoriesCatalog.jsx is the "View All
// Accessories" destination for SaunaAccessories.jsx and its series pages.
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { isHeaterProduct } from "../utils/isHeaterProduct";
import SEO from "../components/SEO";
import { isPubliclyVisible } from "../local-storage/visibility";
import heroImg from "../assets/NRM-NB-BL1.webp";
import bannerImg from "../assets/Sauna/Sauna Heaters/heater-banner.webp";
import CategoryHero from "../components/CategoryHero";
import BrochureDropdownButton from "../components/Buttons/BrochureDropdownButton";
import menuPaths from "../menuPaths";
import { WALL_MOUNTED_FIXED_ORDER, groupWallMountedProducts } from "../utils/wallMountedGroups";

function getImageUrl(product, field) {
  const path = product?.[`local_${field}`] || product?.[field] || null;
  if (!path) return null;
  return path;
}

// Series groups — same category keys AllProducts.jsx already uses for its
// heater sidebar sections, kept lowercase/substring-matched so this reads
// whatever the CMS "categories" field already carries per product.
const HEATER_GROUPS = [
  { id: "section-wall-mounted", label: "Wall-Mounted Series", category: "wall-mounted" },
  { id: "section-tower",        label: "Tower Series",        category: "tower" },
  { id: "section-stone",        label: "Stone Series",        category: "stone" },
  { id: "section-floor",        label: "Floor Series",        category: "floor" },
  { id: "section-combi",        label: "Combi Series",        category: "combi" },
  { id: "section-dragonfire",   label: "Dragonfire Series",   category: "dragonfire" },
];

function HeaterCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const image = getImageUrl(product, "thumbnail");

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
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              style={{
                maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                transition: "transform 0.25s ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            />
          ) : (
            <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
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

function CategorySection({ group, productsByGroup }) {
  const products = productsByGroup[group.id] || [];

  // The Wall-Mounted series has well-defined brand families (Nordex, Mini,
  // Scandia, Krios, Scandifire) — organize it the same way the dedicated
  // Wall-Mounted heaters page does, instead of one flat grid.
  if (group.category === "wall-mounted") {
    const brandGroups = groupWallMountedProducts(products);
    const brandNames = WALL_MOUNTED_FIXED_ORDER.filter(g => brandGroups[g]?.length);

    return (
      <div id={group.id} className="category-section">
        <div className="category-section-title">
          <h2>{group.label}</h2>
        </div>
        <div className="hc-brand-groups">
          {brandNames.map(brand => (
            <div className="hc-brand-group" key={brand}>
              <h3 className="hc-brand-title">{brand.toUpperCase()}</h3>
              <div className="products-grid">
                {brandGroups[brand].map(product => (
                  <HeaterCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sorted = products
    .slice()
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div id={group.id} className="category-section">
      <div className="category-section-title">
        <h2>{group.label}</h2>
      </div>
      <div className="products-grid">
        {sorted.map(product => (
          <HeaterCard key={product.id || product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

export default function HeatersCatalog({ showHero = true } = {}) {
  const { products: localProds, loading } = useLocalProducts();
  const [activeSection, setActiveSection] = useState(HEATER_GROUPS[0].id);

  const heaters = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isHeaterProduct(p) && isPubliclyVisible(p));
  }, [localProds]);

  const productsByGroup = useMemo(() => {
    const grouped = {};
    HEATER_GROUPS.forEach(group => {
      grouped[group.id] = heaters.filter(p =>
        p.categories?.some(c => c.toLowerCase().includes(group.category))
      );
    });
    return grouped;
  }, [heaters]);

  const groupCounts = useMemo(() => {
    const counts = {};
    HEATER_GROUPS.forEach(group => { counts[group.id] = (productsByGroup[group.id] || []).length; });
    return counts;
  }, [productsByGroup]);

  useEffect(() => {
    const handleScroll = () => {
      let closestSection = null;
      let closestOffset = Infinity;

      HEATER_GROUPS.forEach(group => {
        const element = document.getElementById(group.id);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closestSection = group.id;
        }
      });

      if (closestSection) setActiveSection(closestSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSidebarClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 120 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <div style={{
            height: 40, width: 200,
            background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
            backgroundSize: "200% 100%", animation: "hcSkeleton 1.4s infinite",
            borderRadius: 6, margin: "0 auto 40px",
          }} />
          <p style={{ color: "#a67853" }}>Loading heaters...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Sauna Heaters"
        description="Browse the full SAWO heaters catalog: Tower, Wall-Mounted, Stone, Floor, Combi, and Dragonfire series for every sauna size and style."
        path="/sauna-heaters"
      />
      <style>{`
        @keyframes hcSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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

        .heaters-wrapper {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 70px;
          width: 100%;
          padding: 50px 60px 40px;
          min-height: 100vh;
        }

        .category-buttons-sidebar {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.07);
          border: 1px solid #edddd0;
          height: fit-content;
          position: sticky;
          top: 160px;
          max-height: calc(100vh - 180px);
          overflow: hidden;
        }

        .sidebar-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f0e8df;
        }

        .sidebar-header-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a67853;
          font-family: 'Montserrat', sans-serif;
          margin: 0 0 2px;
        }

        .sidebar-header-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #af8564;
          font-family: 'Montserrat', sans-serif;
          margin: 0;
        }

        .sidebar-scroll {
          overflow-y: auto;
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e4d0bf; border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #b5886b; }

        .sidebar-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 9px 12px 9px 14px;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: left;
          border-radius: 8px;
          border: none;
          color: #5a4030;
          background: transparent;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
          font-family: 'Montserrat', sans-serif;
          line-height: 1.35;
          gap: 8px;
        }

        .sidebar-btn::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 3px;
          height: 60%;
          background: #a67853;
          border-radius: 0 3px 3px 0;
          transition: transform 0.2s ease;
        }

        .sidebar-btn:hover { background: #faf4ef; color: #af8564; }
        .sidebar-btn:hover::before { transform: translateY(-50%) scaleY(0.6); }

        .sidebar-btn.active {
          background: #af8564;
          color: #ffffff;
          font-weight: 700;
        }

        .sidebar-btn.active::before {
          transform: translateY(-50%) scaleY(1);
          background: #d9c4b0;
        }

        .sidebar-btn-count {
          font-size: 0.65rem;
          font-weight: 600;
          color: #c4a882;
          background: #f5ede3;
          padding: 2px 7px;
          border-radius: 10px;
          flex-shrink: 0;
          font-family: 'Montserrat', sans-serif;
        }

        .sidebar-btn.active .sidebar-btn-count {
          background: rgba(255,255,255,0.15);
          color: #f0e0cc;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .category-section {
          scroll-margin-top: 160px;
        }

        .category-section-title {
          margin-bottom: 40px;
        }

        .category-section-title h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #af8564;
          margin: 0 0 8px;
          line-height: 1.2;
          font-family: 'Montserrat', sans-serif;
        }

        .category-section-title .underline {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, #d9c4b0 0%, #d1bda6 100%);
          border-radius: 3px;
        }

        .hc-brand-groups {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .hc-brand-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.04em;
          color: #2c1a0e;
          margin: 0 0 18px;
          padding-bottom: 10px;
          border-bottom: 1px solid #edddd0;
        }

        .hc-cta {
          position: relative;
          margin-top: 20px;
          background-color: #1a1512;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          padding: 100px 24px;
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .hc-cta-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 100%);
        }
        .hc-cta-content { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; }
        .hc-cta-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 14px;
          line-height: 1.2;
        }
        .hc-cta-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 300;
          color: rgba(255,255,255,0.9);
          margin: 0 0 8px;
          line-height: 1.6;
        }
        .hc-cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        @media screen and (max-width: 1024px) {
          .heaters-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }
          .category-buttons-sidebar { display: none; }
          .products-grid { grid-template-columns: repeat(4, 1fr); gap: 20px 14px; }
        }

        @media screen and (max-width: 768px) {
          .heaters-wrapper { padding: 40px 24px 40px; }
          .products-grid { grid-template-columns: repeat(3, 1fr); gap: 16px 12px; }
          .hc-cta { padding: 64px 20px; min-height: 300px; }
          .hc-cta-title { font-size: 1.5rem; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        {showHero && (
          <CategoryHero
            heroImg={heroImg}
            title="Sauna Heaters"
            description="Discover our complete range of premium sauna heaters designed for every sauna size
                and style. Browse through our carefully curated Tower, Wall-Mounted, Stone, Floor,
                Combi, and Dragonfire series."
          />
        )}

        <div className="heaters-wrapper" style={!showHero ? { paddingTop: 140 } : undefined}>
          <div className="category-buttons-sidebar">
            <div className="sidebar-header">
              <p className="sidebar-header-label">Browse by</p>
              <p className="sidebar-header-title">Series</p>
            </div>
            <div className="sidebar-scroll">
              {HEATER_GROUPS.map(group => {
                const count = groupCounts[group.id] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={group.id}
                    className={`sidebar-btn ${activeSection === group.id ? "active" : ""}`}
                    onClick={() => handleSidebarClick(group.id)}
                  >
                    <span>{group.label}</span>
                    <span className="sidebar-btn-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="main-content">
            {HEATER_GROUPS.map(group => {
              if ((groupCounts[group.id] || 0) === 0) return null;
              return (
                <CategorySection key={group.id} group={group} productsByGroup={productsByGroup} />
              );
            })}
          </div>
        </div>

        <section
          className="hc-cta"
          style={{ backgroundImage: `url(${bannerImg})` }}
        >
          <div className="hc-cta-overlay" />
          <div className="hc-cta-content">
            <h2 className="hc-cta-title">Need Help Choosing the Right Heater?</h2>
            <p className="hc-cta-desc">
              Our team can help you match power, size, and style to your sauna —
              or browse full specs in our product catalogue.
            </p>
            <div className="hc-cta-actions">
              <BrochureDropdownButton text="CONTACT US" href={menuPaths.contact} redirect />
              <BrochureDropdownButton
                text="DOWNLOAD CATALOGUE"
                href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
