import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { isAccessoryProduct } from "./AccessoriesPage";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

const CATEGORY_SECTIONS = [
  { label: "Pails", id: "section-pails", category: "pails" },
  { label: "Ladles", id: "section-ladles", category: "ladles" },
  { label: "Pail Shower", id: "section-pail-shower", category: "pail shower" },
  { label: "Thermometers & Combined Meters", id: "section-meters", category: "thermometers" },
  { label: "Clocks & Timers", id: "section-clock-timer", category: "clocks & timers" },
  { label: "Sauna Lights", id: "section-sauna-lights", category: "sauna lights" },
  { label: "Headrest & Backrests", id: "section-headrest-backrest", category: "headrest & backrest" },
  { label: "Doors & Handles", id: "section-doors-handles", category: "doors & handles" },
  { label: "Benches", id: "section-benches", category: "benches" },
  { label: "Hangers & Hook Racks", id: "section-cloth-hangers", category: "cloth hangers" },
  { label: "Floor Mat Tiles", id: "section-wooden-floor-mats", category: "wooden floor mats" },
  { label: "Kivistone", id: "section-kivistone", category: "kivistone" },
  { label: "Ventilations & Miscellaneous Items", id: "section-vent-misc", category: "ventilation & miscellaneous" },
];

function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (String(pathOrUrl).includes("://")) return pathOrUrl;
  return `${GITHUB_RAW}${pathOrUrl}`;
}

function getImageUrl(product) {
  const local = product?.local_thumbnail;
  const remote = product?.thumbnail;
  const path = local || remote;
  return resolveUrl(path);
}

function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      to={`/accessories/${product.slug}`}
      style={{ textDecoration: "none" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "12px 8px",
          borderRadius: 10,
          transition: "transform 0.25s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          cursor: "pointer",
        }}
      >
        {/* Image */}
        <div style={{
          width: "100%",
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          {getImageUrl(product) ? (
            <img
              src={getImageUrl(product)}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease, transform 0.25s ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            />
          ) : (
            <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
          )}
        </div>

        {/* Title */}
        <p style={{
          fontWeight: 600,
          fontSize: "0.78rem",
          color: hovered ? "#a67853" : "#af8564",
          margin: 0,
          lineHeight: 1.4,
          textAlign: "center",
          transition: "color 0.2s ease",
        }}>
          {product.name}
        </p>
      </div>
    </Link>
  );
}

export default function AccessoriesCatalog() {
  const { products: localProds, loading } = useLocalProducts();
  const [activeCategory, setActiveCategory] = useState("section-pails");

  const accessories = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(
      p =>
        isAccessoryProduct(p) &&
        p.status === "published" &&
        p.visible !== false
    );
  }, [localProds]);

  const productsByCategory = useMemo(() => {
    const grouped = {};
    CATEGORY_SECTIONS.forEach(section => {
      grouped[section.id] = accessories.filter(p =>
        p.categories?.some(c => c.toLowerCase() === section.category)
      );
    });
    return grouped;
  }, [accessories]);

  // Scroll tracking for sidebar
  useEffect(() => {
    const handleScroll = () => {
      let closestSection = null;
      let closestOffset = Infinity;

      CATEGORY_SECTIONS.forEach(section => {
        const element = document.getElementById(section.id);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const offset = Math.abs(rect.top);

        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closestSection = section.id;
        }
      });

      if (closestSection) {
        setActiveCategory(closestSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSidebarClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveCategory(sectionId);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 120 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <div style={{
            height: 40,
            width: 200,
            background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
            backgroundSize: "200% 100%",
            animation: "skS 1.4s infinite",
            borderRadius: 6,
            margin: "0 auto 40px",
          }} />
          <p style={{ color: "#a67853" }}>Loading accessories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes skS {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .accessories-wrapper {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 60px;
          width: 100%;
          padding: 60px 60px 40px;
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

        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #e4d0bf;
          border-radius: 4px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #b5886b;
        }

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

        .sidebar-btn:hover {
          background: #faf4ef;
          color: #af8564;
        }

        .sidebar-btn:hover::before {
          transform: translateY(-50%) scaleY(0.6);
        }

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
          transition: background 0.18s ease, color 0.18s ease;
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
        }

        .category-section-title .underline {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, #d9c4b0 0%, #d1bda6 100%);
          border-radius: 3px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px 16px;
        }

        @media screen and (max-width: 1400px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media screen and (max-width: 1100px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media screen and (max-width: 1024px) {
          .accessories-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }

          .category-buttons-sidebar {
            display: none;
          }

          .products-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px 14px;
          }
        }

        @media screen and (max-width: 768px) {
          .accessories-wrapper {
            padding: 40px 24px 40px;
          }

          .products-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px 12px;
          }
        }

        @media screen and (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px 10px;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        {/* Header Section */}
        <div style={{
          width: "100%",
          padding: "140px 60px 60px",
          textAlign: "center",
          borderBottom: "1px solid #edddd0",
        }}>
          <p style={{
            fontSize: "0.67rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#a67853",
            margin: "0 0 12px",
          }}>
            Premium Collection
          </p>
          <h1 style={{
            fontSize: "2.4rem",
            fontWeight: 700,
            color: "#af8564",
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}>
            Sauna & Steam Accessories
          </h1>
          <p style={{
            fontSize: "1rem",
            color: "#5a4030",
            margin: "0 auto 12px",
            maxWidth: 700,
            lineHeight: 1.6,
            textAlign: "center",
          }}>
            Discover our complete range of premium sauna and steam accessories designed to enhance your wellness experience. Browse through our carefully curated selection of high-quality products.
          </p>
        </div>

        {/* Main Grid with Sidebar */}
        <div className="accessories-wrapper">
          {/* Sidebar */}
          <div className="category-buttons-sidebar">
            <div className="sidebar-header">
              <p className="sidebar-header-label">Browse by</p>
              <p className="sidebar-header-title">Categories</p>
            </div>
            <div className="sidebar-scroll">
              {CATEGORY_SECTIONS.map(section => {
                const count = (productsByCategory[section.id] || []).length;
                if (count === 0) return null;
                return (
                  <button
                    key={section.id}
                    className={`sidebar-btn ${activeCategory === section.id ? "active" : ""}`}
                    onClick={() => handleSidebarClick(section.id)}
                  >
                    <span>{section.label}</span>
                    <span className="sidebar-btn-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {CATEGORY_SECTIONS.map(section => {
              const products = productsByCategory[section.id] || [];
              if (products.length === 0) return null;

              return (
                <div key={section.id} id={section.id} className="category-section">
                  {/* Category Title */}
                  <div className="category-section-title">
                    <h2>{section.label}</h2>
                  </div>

                  {/* Products Grid */}
                  <div className="products-grid">
                    {products.map(product => (
                      <ProductCard key={product.id || product.slug} product={product} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
