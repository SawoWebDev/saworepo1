// Dragonfire.jsx
// See WallMounted.jsx for how to use local product data instead of Supabase.

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../../Administrator/Local/useLocalProducts";
import ButtonClear from "../../../components/Buttons/ButtonClear";
import CirclesInfo from "../../../components/CirclesInfo";
import heroImg from "../../../assets/Sauna/Sauna Heaters/dragonfire-hero.webp";
import "./heaters.css";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field) {
  const path = localOrRemote(product, field);
  if (!path) return null;
  if (path.includes("://")) return path;
  return `${GITHUB_RAW}${path}`;
}

// ── Fixed group order ─────────────────────────────────────────────────
const FIXED_ORDER = ["Heaterking", "Fiberjungle", "Scandifire", "Minidragon"];

// ── Keywords to detect group membership ────────────────────────────────
const GROUP_KEYWORDS = {
  Heaterking: ["Heaterking"],
  Fiberjungle: ["Fiberjungle"],
  Scandifire: ["Scandifire"],
  Minidragon: ["Minidragon"],
};

// ── Filter Dragonfire products dynamically ────────────────────────────
function filterDragonfireProducts(allProducts) {
  return allProducts.filter(
    (p) =>
      p.categories?.includes("Dragonfire") ||
      p.name?.toLowerCase().includes("dragonfire") ||
      // Also include any product whose tags/name match one of the dragonfire group keywords
      Object.values(GROUP_KEYWORDS).flat().some(kw =>
        p.name?.toLowerCase().includes(kw.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(kw.toLowerCase()))
      )
  );
}

// ── Group products dynamically ───────────────────────────────────────
function groupProducts(products) {
  return products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(GROUP_KEYWORDS)) {
      for (const kw of keywords) {
        const nameMatch = product.name?.toLowerCase().includes(kw.toLowerCase());
        const tagMatch = product.tags?.some((t) => t.toLowerCase().includes(kw.toLowerCase()));
        if (nameMatch || tagMatch) {
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

// ── Skeleton card ────────────────────────────────────────────────────────
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
      <div style={{ height: 10, background: "#f0ebe3", borderRadius: 4, marginTop: 8, width: "70%", animation: "wm-shimmer 1.5s infinite" }} />
    </div>
  );
}

// ── Extract power range from tags ─────────────────────────────────────
function getPower(tags) {
  if (!tags) return "";
  return tags.find((t) => /\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\s*kW/i.test(t)) || "";
}

// ── Product card component ───────────────────────────────────────────
function ProductCard({ product }) {
  const power = getPower(product.tags);

  return (
    <Link
      to={`/products/${product.slug}`}
      className="wm-product-item"
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer" }}
    >
      <div
        className="wm-product-img-wrap"
        style={{ transition: "transform 0.3s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {getImageUrl(product, 'thumbnail') ? (
          <img
            src={getImageUrl(product, 'thumbnail')}
            alt={product.name}
            className="wm-product-img"
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="wm-product-img-placeholder"><i className="fas fa-image" /></div>
        )}
      </div>
      <p className="wm-product-name" style={{ color: "#2c1f13" }}>{product.name}</p>
      {power && <p className="wm-product-power">{power}</p>}
    </Link>
  );
}

// ── Dragonfire page ──────────────────────────────────────────────────
const Dragonfire = () => {
  const { products: localProds, loading } = useLocalProducts();
  const [activeGroup, setActiveGroup] = useState(null);
  const [search, setSearch] = useState("");

  const allProducts = useMemo(() => {
    const visible = localProds.filter(p => p.status === "published" && p.visible !== false);
    return filterDragonfireProducts(visible);
  }, [localProds]);

  const groupedProducts = useMemo(() => groupProducts(allProducts), [allProducts]);
  const groupNames = useMemo(() => FIXED_ORDER.filter((g) => groupedProducts[g]), [groupedProducts]);

  const visibleGroups = activeGroup
    ? groupNames.filter((g) => g === activeGroup)
    : groupNames;

  return (
    <div className="relative">
      <style>{`
        @keyframes wm-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .wm-search-wrap { display: flex; align-items: center; gap: 10px; background: #fff; border: 1.5px solid #e0cfc0; border-radius: 40px; padding: 9px 18px; box-shadow: 0 2px 12px rgba(139,94,60,0.07); transition: border-color 0.2s, box-shadow 0.2s; }
        .wm-search-wrap:focus-within { border-color: #a67853; box-shadow: 0 2px 18px rgba(139,94,60,0.13); }
        .wm-search-icon { color: #a67853; font-size: 0.85rem; flex-shrink: 0; }
        .wm-search-input { border: none; outline: none; background: transparent; font-family: 'Montserrat', sans-serif; font-size: 0.84rem; color: #2c1a0e; width: 100%; }
        .wm-search-input::placeholder { color: #c4a882; }
        .wm-search-clear { background: none; border: none; cursor: pointer; color: #c4a882; font-size: 0.75rem; padding: 0; line-height: 1; flex-shrink: 0; transition: color 0.15s; }
        .wm-search-clear:hover { color: #8b5e3c; }
      `}</style>

      {/* HERO */}
      <section className="relative min-h-[95vh] flex flex-col justify-center items-center text-center px-6">
        <img
          src={heroImg}
          alt="Dragonfire Sauna Heaters"
          className="absolute inset-0 w-full h-full object-cover object-center -z-10"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-black/40 -z-10" />
        <div className="relative z-10">
          <h1 className="wm-hero-title">DRAGONFIRE SAUNA HEATERS</h1>
          <p className="wm-hero-subtitle">Artistic Flair Meets Cutting-Edge Technology</p>
          <div style={{ marginTop: "32px" }}>
            <ButtonClear
              text="EXPLORE HEATERS"
              href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/sauna-products/"
            />
          </div>
        </div>
      </section>

      {/* INTRODUCING */}
      <section className="wm-section">
        <div className="wm-container text-center">
          <h2 className="wm-products-title">Introducing Our Premium Sauna Dragonfire Series</h2>
          <p className="wm-products-desc">
            Dragonfire heaters are a refined blend of artistic flair and cutting-edge technology,
            as envisioned by renowned Finnish designer Stefan Lindfors. Every Dragonfire heater
            boasts a stylishly elegant jungle-fire pattern and delivers powerful, consistent
            heat and energy efficiency. Choose from Floor, Wall and Corner models, as well as
            Mini heaters.
          </p>
        </div>
      </section>

      {/* FILTER + SEARCH */}
      <section className="wm-section wm-section--flush-bottom">
        <div className="wm-container">
          <div className="wm-filter-search-row">
            <div className="wm-filter-pills-group">
              <button className={`wm-filter-btn ${activeGroup === null ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(null)}>All</button>
              {groupNames.map((g) => (
                <button key={g} className={`wm-filter-btn ${activeGroup === g ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(g)}>
                  {g}
                </button>
              ))}
            </div>

            <div className="wm-search-wrap wm-search-bar-fixed">
              <i className="fa-solid fa-magnifying-glass wm-search-icon" />
              <input
                className="wm-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search heaters..."
              />
              {search && (
                <button className="wm-search-clear" onClick={() => setSearch("")} title="Clear search">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="wm-section wm-section--flush-top">
        <div className="wm-container">
          {loading ? (
            <div className="wm-products-grid">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visibleGroups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Montserrat', sans-serif", color: "#888" }}>
              <p>No Dragonfire heaters available.</p>
            </div>
          ) : (
            visibleGroups.map((brand, gi) => {
              const q = search.trim().toLowerCase();
              const items = (groupedProducts[brand] || []).filter(p =>
                !q ||
                p.name?.toLowerCase().includes(q) ||
                p.short_description?.toLowerCase().includes(q) ||
                (p.categories || []).some(c => c.toLowerCase().includes(q)) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q))
              );
              if (items.length === 0) return null;
              return (
                <div className="wm-group" key={gi}>
                  <h3 className="wm-group-title">{brand.toUpperCase()}</h3>
                  <div className="wm-products-grid">
                    {items.map((product, ii) => (
                      <ProductCard key={product.id || ii} product={product} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* WHY SAWO */}
      <section className="wm-section">
        <div className="wm-container">
          <div className="wm-why-grid">
            <div className="wm-why-left">
              <p className="wm-eyebrow">SAWO HEATERS</p>
              <h2 className="wm-why-title">Why Choose SAWO Heaters</h2>
              <p className="wm-why-desc">SAWO heaters combine durability, energy efficiency, and modern design, offering consistent performance for a reliable, superior sauna experience every time.</p>
              <p className="wm-why-desc">User-Friendly Controls — Easily adjust temperature and time settings for your perfect sauna experience.</p>
              <div style={{ marginTop: "20px" }}>
                <a href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf" target="_blank" rel="noopener noreferrer" className="wm-brochure-btn">VIEW BROCHURE</a>
              </div>
            </div>
            <div className="wm-why-right"><CirclesInfo /></div>
          </div>
        </div>
      </section>

      {/* BANNER */}
      <section className="wm-banner">
        <div className="wm-banner-content">
          <h2 className="wm-banner-title">Experience Ultimate Relaxation</h2>
          <p className="wm-banner-sub">Find your source of serenity from over 100 heater models</p>
        </div>
      </section>
    </div>
  );
};

export default Dragonfire;
