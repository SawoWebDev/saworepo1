import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";
import ScrollToTop from "../components/ScrollToTop";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

const HEATER_SECTIONS = [
  { label: "Wall-Mounted", id: "heater-wall-mounted", category: "wall-mounted" },
  { label: "Tower",        id: "heater-tower",        category: "tower" },
  { label: "Stone",        id: "heater-stone",        category: "stone" },
  { label: "Floor",        id: "heater-floor",        category: "floor" },
  { label: "Combi",        id: "heater-combi",        category: "combi" },
  { label: "Dragonfire",   id: "heater-dragonfire",   category: "dragonfire" },
];

const ROOM_SECTIONS = [
  { label: "Standard",    id: "room-standard",    match: p => p.room_type === "standard"    || p.room_type === "traditional" || (p.categories || []).some(c => c.toLowerCase() === "standard") },
  { label: "Glass Front", id: "room-glass-front", match: p => p.room_type === "glassfront"  || p.room_type === "glass-front"  || (p.categories || []).some(c => c.toLowerCase().replace(/\s+/g, "") === "glassfront") },
  { label: "Infrared",    id: "room-infrared",    match: p => p.room_type === "infrared"    || (p.categories || []).some(c => c.toLowerCase() === "infrared") },
];

const CATEGORY_SECTIONS = [
  { label: "Pails",                             id: "section-pails",             category: "pails" },
  { label: "Ladles",                            id: "section-ladles",            category: "ladles" },
  { label: "Pail Shower",                       id: "section-pail-shower",       category: "pail shower" },
  { label: "Thermometers & Combined Meters",    id: "section-meters",            category: "thermometers" },
  { label: "Clocks & Timers",                   id: "section-clock-timer",       category: "clocks & timers" },
  { label: "Sauna Lights",                      id: "section-sauna-lights",      category: "sauna lights" },
  { label: "Headrest & Backrests",              id: "section-headrest-backrest", category: "headrest & backrest" },
  { label: "Doors & Handles",                   id: "section-doors-handles",     category: "doors & handles" },
  { label: "Benches",                           id: "section-benches",           category: "benches" },
  { label: "Hangers & Hook Racks",              id: "section-cloth-hangers",     category: "cloth hangers" },
  { label: "Floor Mat Tiles",                   id: "section-wooden-floor-mats", category: "wooden floor mats" },
  { label: "Kivistone",                         id: "section-kivistone",         category: "kivistone" },
  { label: "Ventilations & Miscellaneous Items",id: "section-vent-misc",         category: "ventilation & miscellaneous" },
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
  const [imageSrc, setImageSrc] = React.useState(null);
  const [hovered, setHovered] = React.useState(false);
  const imgRef = React.useRef(null);
  const isAccessory = isAccessoryProduct(product);
  let link;
  if (isAccessory) {
    link = `/accessories/${product.slug}`;
  } else if (product.type === "room") {
    link = `/sauna/rooms/${product.slug}`;
  } else {
    link = `/products/${product.slug}`;
  }

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const fullUrl = getImageUrl(product);
            if (fullUrl) {
              setImageSrc(fullUrl);
              const img = new Image();
              img.onload = () => setImageLoaded(true);
              img.src = fullUrl;
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [product]);

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
        <div
          ref={imgRef}
          style={{
            width: "100%",
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
            background: "#fafaf8",
          }}
        >
          {imageSrc ? (
            <>
              {!imageLoaded && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite",
                  }}
                />
              )}
              <img
                src={imageSrc}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  opacity: imageLoaded ? 1 : 0.6,
                  filter: imageLoaded ? "blur(0px)" : "blur(8px)",
                  transition: "opacity 0.5s ease, filter 0.5s ease, transform 0.25s ease",
                  transform: hovered ? "scale(1.06)" : "scale(1)",
                }}
              />
            </>
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

export default function AllProducts() {
  const { products: localProds, loading } = useLocalProducts();
  const { rooms: localRooms, loading: roomsLoading } = useLocalSaunaRooms();
  const [activeTab, setActiveTab] = useState("heaters");
  const [activeHeaterSection, setActiveHeaterSection] = useState(HEATER_SECTIONS[0].id);
  const [activeRoomSection, setActiveRoomSection] = useState(ROOM_SECTIONS[0].id);
  const [activeCategoryAccessories, setActiveCategoryAccessories] = useState("section-pails");

  const saunaHeaters = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => !isAccessoryProduct(p) && p.type !== "room" && p.status === "published" && p.visible !== false);
  }, [localProds]);

  const productsByHeaterSection = useMemo(() => {
    const grouped = {};
    HEATER_SECTIONS.forEach(section => {
      grouped[section.id] = saunaHeaters.filter(p =>
        p.categories?.some(c => c.toLowerCase().includes(section.category))
      );
    });
    return grouped;
  }, [saunaHeaters]);

  const saunaRooms = useMemo(() => {
    if (!localRooms.length) return [];
    return localRooms.filter(r => r.status === "published" && r.visible !== false);
  }, [localRooms]);

  const productsByRoomSection = useMemo(() => {
    const grouped = {};
    ROOM_SECTIONS.forEach(section => {
      grouped[section.id] = saunaRooms.filter(section.match);
    });
    return grouped;
  }, [saunaRooms]);

  const accessories = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isAccessoryProduct(p) && p.status === "published" && p.visible !== false);
  }, [localProds]);

  const productsByAccessoryCategory = useMemo(() => {
    const grouped = {};
    CATEGORY_SECTIONS.forEach(section => {
      grouped[section.id] = accessories.filter(p =>
        p.categories?.some(c => c.toLowerCase() === section.category)
      );
    });
    return grouped;
  }, [accessories]);

  // Scroll spy for rooms sidebar
  useEffect(() => {
    if (activeTab !== "rooms") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      ROOM_SECTIONS.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = section.id;
        }
      });
      if (closest) setActiveRoomSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // Scroll spy for heaters sidebar
  useEffect(() => {
    if (activeTab !== "heaters") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      HEATER_SECTIONS.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = section.id;
        }
      });
      if (closest) setActiveHeaterSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // Scroll spy for accessories sidebar
  useEffect(() => {
    if (activeTab !== "accessories") return;
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
      if (closestSection) setActiveCategoryAccessories(closestSection);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  const handleRoomClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveRoomSection(sectionId);
    }
  };

  const handleHeaterClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeaterSection(sectionId);
    }
  };

  const handleAccessoriesClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveCategoryAccessories(sectionId);
    }
  };

  if (loading || roomsLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 120 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
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

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .tabs-container {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 24px 40px;
          border-bottom: 1px solid #edddd0;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tab-btn {
          padding: 10px 24px;
          border: 2px solid #d9c4b0;
          background: #fff;
          color: #5a4030;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Montserrat', sans-serif;
        }

        .tab-btn:hover {
          border-color: #a67853;
          color: #a67853;
        }

        .tab-btn.active {
          background: #a67853;
          border-color: #a67853;
          color: white;
        }

        .products-wrapper {
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
          .products-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media screen and (max-width: 1100px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media screen and (max-width: 1024px) {
          .products-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }
          .category-buttons-sidebar { display: none; }
          .products-grid { grid-template-columns: repeat(4, 1fr); gap: 20px 14px; }
        }

        @media screen and (max-width: 768px) {
          .products-wrapper { padding: 40px 24px 40px; }
          .products-grid { grid-template-columns: repeat(3, 1fr); gap: 16px 12px; }
        }

        @media screen and (max-width: 480px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); gap: 14px 10px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        <div style={{
          width: "100%",
          padding: "80px 60px 40px",
          background: "#af8564",
          borderBottom: "1px solid #9d7554",
          marginTop: 60,
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <p style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.75)",
                margin: "0 0 8px",
              }}>
                Complete Collection
              </p>
              <h1 style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#ffffff",
                margin: 0,
                lineHeight: 1.2,
              }}>
                All Products
              </h1>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}>
              {[
                { id: "heaters", label: "Sauna Heaters", desc: "Premium heating solutions" },
                { id: "rooms", label: "Sauna Rooms", desc: "Complete sauna packages" },
                { id: "accessories", label: "Accessories", desc: "Premium finishing touches" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "14px 16px",
                    border: "2px solid #ffffff",
                    background: activeTab === tab.id ? "rgb(159 112 84)" : "transparent",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                    transition: "all 0.25s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgb(159 112 84)";
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab === tab.id) {
                      e.currentTarget.style.background = "rgb(159 112 84)";
                    } else {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <h3 style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    margin: "0 0 3px 0",
                    letterSpacing: "0.01em",
                    transition: "color 0.25s ease",
                  }}>
                    {tab.label}
                  </h3>
                  <p style={{
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.85)",
                    margin: 0,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    transition: "color 0.25s ease",
                  }}>
                    {tab.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── HEATERS ── */}
        {activeTab === "heaters" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {HEATER_SECTIONS.map(section => {
                  const count = (productsByHeaterSection[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeHeaterSection === section.id ? "active" : ""}`}
                      onClick={() => handleHeaterClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {HEATER_SECTIONS.map(section => {
                const products = productsByHeaterSection[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
                    </div>
                    <div className="products-grid">
                      {products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {saunaHeaters.length === 0 && (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No sauna heaters available</p>
              )}
            </div>
          </div>
        )}

        {/* ── ROOMS ── */}
        {activeTab === "rooms" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {ROOM_SECTIONS.map(section => {
                  const count = (productsByRoomSection[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeRoomSection === section.id ? "active" : ""}`}
                      onClick={() => handleRoomClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {ROOM_SECTIONS.map(section => {
                const products = productsByRoomSection[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
                    </div>
                    <div className="products-grid">
                      {products.map(product => (
                        <ProductCard key={product.id || product.slug} product={{ ...product, type: "room" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {saunaRooms.length === 0 && (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No sauna rooms available</p>
              )}
            </div>
          </div>
        )}

        {/* ── ACCESSORIES ── */}
        {activeTab === "accessories" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Categories</p>
              </div>
              <div className="sidebar-scroll">
                {CATEGORY_SECTIONS.map(section => {
                  const count = (productsByAccessoryCategory[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeCategoryAccessories === section.id ? "active" : ""}`}
                      onClick={() => handleAccessoriesClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {CATEGORY_SECTIONS.map(section => {
                const products = productsByAccessoryCategory[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
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
        )}
      </div>
      <ScrollToTop />
    </>
  );
}
