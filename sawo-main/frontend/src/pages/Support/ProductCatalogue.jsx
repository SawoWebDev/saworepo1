import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isAccessoryProduct } from "../IndividualDisplay/DispAccessories";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

const PRODUCT_TYPES = [
  { label: "Sauna Heaters", id: "heaters", type: "heater" },
  { label: "Sauna Rooms", id: "rooms", type: "room" },
  { label: "Accessories", id: "accessories", type: "accessory" },
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isAccessory = isAccessoryProduct(product);
  let link;
  if (isAccessory) {
    link = `/accessories/${product.slug}`;
  } else if (product.type === "room") {
    link = `/sauna/rooms/${product.slug}`;
  } else {
    link = `/products/${product.slug}`;
  }

  return (
    <Link to={link} style={{ textDecoration: "none" }}>
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

function ProductCatalogue() {
  const { products: localProds, loading } = useLocalProducts();
  const [activeType, setActiveType] = useState("heaters");

  const publishedProducts = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => p.status === "published" && p.visible !== false);
  }, [localProds]);

  const productsByType = useMemo(() => {
    const grouped = {};
    PRODUCT_TYPES.forEach(pt => {
      if (pt.type === "heater") {
        grouped[pt.id] = publishedProducts.filter(p => !isAccessoryProduct(p) && p.type !== "room");
      } else if (pt.type === "room") {
        grouped[pt.id] = publishedProducts.filter(p => p.type === "room");
      } else {
        grouped[pt.id] = publishedProducts.filter(p => isAccessoryProduct(p));
      }
    });
    return grouped;
  }, [publishedProducts]);

  useEffect(() => {
    const handleScroll = () => {
      let closestType = null;
      let closestOffset = Infinity;

      PRODUCT_TYPES.forEach(pt => {
        const element = document.getElementById(`section-${pt.id}`);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closestType = pt.id;
        }
      });

      if (closestType) setActiveType(closestType);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSidebarClick = (typeId) => {
    const element = document.getElementById(`section-${typeId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveType(typeId);
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
          <p style={{ color: "#a67853" }}>Loading products...</p>
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

        .catalogue-wrapper {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 60px;
          width: 100%;
          padding: 60px 60px 40px;
          min-height: 100vh;
        }

        .type-buttons-sidebar {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.07);
          border: 1px solid #edddd0;
          height: fit-content;
          position: sticky;
          top: 160px;
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

        .type-section {
          scroll-margin-top: 160px;
        }

        .type-section-title {
          margin-bottom: 40px;
        }

        .type-section-title h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #af8564;
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .type-section-title .underline {
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
          .catalogue-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }

          .type-buttons-sidebar {
            display: none;
          }

          .products-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px 14px;
          }
        }

        @media screen and (max-width: 768px) {
          .catalogue-wrapper {
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
            Complete Collection
          </p>
          <h1 style={{
            fontSize: "2.4rem",
            fontWeight: 700,
            color: "#af8564",
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}>
            All Products
          </h1>
          <p style={{
            fontSize: "1rem",
            color: "#5a4030",
            margin: "0 auto 12px",
            maxWidth: 700,
            lineHeight: 1.6,
            textAlign: "center",
          }}>
            Browse our complete range of sauna heaters, rooms, and accessories designed to enhance your wellness experience.
          </p>
        </div>

        <div className="catalogue-wrapper">
          <div className="type-buttons-sidebar">
            <div className="sidebar-header">
              <p className="sidebar-header-label">Browse by</p>
              <p className="sidebar-header-title">Type</p>
            </div>
            <div className="sidebar-scroll">
              {PRODUCT_TYPES.map(pt => {
                const count = (productsByType[pt.id] || []).length;
                if (count === 0) return null;
                return (
                  <button
                    key={pt.id}
                    className={`sidebar-btn ${activeType === pt.id ? "active" : ""}`}
                    onClick={() => handleSidebarClick(pt.id)}
                  >
                    <span>{pt.label}</span>
                    <span className="sidebar-btn-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="main-content">
            {PRODUCT_TYPES.map(pt => {
              const products = productsByType[pt.id] || [];
              if (products.length === 0) return null;

              return (
                <div key={pt.id} id={`section-${pt.id}`} className="type-section">
                  <div className="type-section-title">
                    <h2>{pt.label}</h2>
                    <div className="underline" />
                  </div>

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

export default ProductCatalogue;
