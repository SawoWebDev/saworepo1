// SaunaRooms.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVisibleProductsCached } from "../../local-storage/supabaseReader";
import ButtonClear from "../../components/Buttons/ButtonClear";
import CirclesInfo from "../../components/CirclesInfo";
import saunaRoomsHero from "../../assets/Sauna/Sauna Rooms/1620ML_scene1.webp";
import "./heaters/heaters.css";

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

const FIXED_ORDER = ["Interior Design", "Wood Panels"];

const GROUP_KEYWORDS = {
  "Interior Design": ["Interior Design", "InteriorDesign"],
  "Wood Panels": ["Wood Panels", "Wood Panel", "WoodPanel", "Timber"],
};

function filterRoomProducts(allProducts) {
  return allProducts.filter(
    (p) =>
      p.categories?.some(c => c.includes("Room") || c.includes("Interior") || c.includes("Wood"))
  );
}

function groupProducts(products) {
  return products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(GROUP_KEYWORDS)) {
      for (const kw of keywords) {
        if (product.name?.toLowerCase().includes(kw.toLowerCase())) {
          if (!groups[group]) groups[group] = [];
          groups[group].push(product);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }
    if (!assigned) {
      if (!groups["Other"]) groups["Other"] = [];
      groups["Other"].push(product);
    }
    return groups;
  }, {});
}

function SkeletonCard() {
  return (
    <div className="wm-product-item" style={{ opacity: 0.45 }}>
      <div
        className="wm-product-img-wrap"
        style={{
          background: "linear-gradient(90deg,#f0ebe3 25%,#faf8f5 50%,#f0ebe3 75%)",
          backgroundSize: "200% 100%",
          animation: "wm-shimmer 1.5s infinite",
          borderRadius: 8,
        }}
      />
      <div style={{ height: 10, background: "#f0ebe3", borderRadius: 4, marginTop: 8, width: "70%" }} />
    </div>
  );
}

function getPower(tags) {
  if (!tags) return "";
  return tags.find((t) => /\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\s*kW/i.test(t)) || "";
}

function ProductCard({ product }) {
  const power = getPower(product.tags);
  return (
    <Link
      to={`/products/${product.slug}`}
      className="wm-product-item"
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer" }}
    >
      <div className="wm-product-img-wrap" style={{ transition: "transform 0.3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        {localOrRemote(product, 'thumbnail') ? (
          <img src={localOrRemote(product, 'thumbnail')} alt={product.name} className="wm-product-img" onError={e => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="wm-product-img-placeholder"><i className="fas fa-image" /></div>
        )}
      </div>
      <p className="wm-product-name" style={{ color: "#2c1f13" }}>{product.name}</p>
      {power && <p className="wm-product-power">{power}</p>}
    </Link>
  );
}

const SaunaRooms = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getVisibleProductsCached();
        setAllProducts(filterRoomProducts(data));
      } catch (err) {
        console.error("SaunaRooms: fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groupedProducts = useMemo(() => groupProducts(allProducts), [allProducts]);
  const groupNames = useMemo(() => FIXED_ORDER.filter((g) => groupedProducts[g]), [groupedProducts]);
  const visibleGroups = activeGroup ? groupNames.filter((g) => g === activeGroup) : groupNames;

  return (
    <div className="relative">
      <style>{`
        @keyframes wm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .sr-hero-img { width: 100%; height: 95vh; object-fit: cover; object-position: center; display: block; }
      `}</style>

      {/* HERO — OPTIMIZED FOR FAST LOAD */}
      <section className="relative min-h-[95vh] flex flex-col justify-center items-center text-center px-6">
        <img
          src={saunaRoomsHero}
          alt="Sauna Rooms Collection"
          className="sr-hero-img absolute inset-0 -z-10"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-black/40 -z-10" />
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white mb-6">SAUNA ROOMS</h1>
          <p className="text-xl text-white/90 mb-8">Premium finishes, layouts & customizations</p>
          <ButtonClear text="VIEW CATALOGUE" href="https://heyzine.com/flip-book/524075b3c1.html" />
        </div>
      </section>

      {/* INTRO */}
      <section className="wm-section">
        <div className="wm-container text-center">
          <h2 className="wm-products-title">Complete Sauna Room Solutions</h2>
          <p className="wm-products-desc">
            From sleek modern designs to classic Finnish aesthetics, our sauna rooms combine premium materials,
            expert craftsmanship, and thoughtful layouts. Customize your sanctuary with wood paneling,
            lighting, benches, and accessories tailored to your space.
          </p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="wm-section wm-section--flush-top">
        <div className="wm-container">
          {/* Filters */}
          {!loading && groupNames.length > 0 && (
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
              <button className={`wm-filter-btn ${activeGroup === null ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(null)}>All</button>
              {groupNames.map((g) => (
                <button key={g} className={`wm-filter-btn ${activeGroup === g ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(g)}>
                  {g}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="wm-products-grid">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visibleGroups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>
              <p>No sauna room products available.</p>
            </div>
          ) : (
            visibleGroups.map((brand, gi) => (
              <div className="wm-group" key={gi}>
                <h3 className="wm-group-title">{brand.toUpperCase()}</h3>
                <div className="wm-products-grid">
                  {(groupedProducts[brand] || []).map((product, ii) => (
                    <ProductCard key={product.id || ii} product={product} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* WHY SAWO */}
      <section className="wm-section">
        <div className="wm-container">
          <div className="wm-why-grid">
            <div className="wm-why-left">
              <p className="wm-eyebrow">SAUNA ROOMS</p>
              <h2 className="wm-why-title">Why Choose SAWO Rooms</h2>
              <p className="wm-why-desc">
                SAWO sauna rooms combine durability, aesthetic beauty, and modern comfort. Built with premium materials
                and expert installation options, each room delivers an authentic, luxurious sauna experience.
              </p>
              <div style={{ marginTop: "20px" }}>
                <a
                  href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wm-brochure-btn"
                >
                  VIEW BROCHURE
                </a>
              </div>
            </div>
            <div className="wm-why-right"><CirclesInfo /></div>
          </div>
        </div>
      </section>

      {/* BANNER */}
      <section className="wm-banner">
        <div className="wm-banner-content">
          <h2 className="wm-banner-title">Transform Your Space</h2>
          <p className="wm-banner-sub">Create the perfect sauna retreat with SAWO's complete room solutions</p>
        </div>
      </section>
    </div>
  );
};

export default SaunaRooms;
