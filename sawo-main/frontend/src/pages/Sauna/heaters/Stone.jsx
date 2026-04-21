// Stone.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVisibleProductsCached } from "../../../local-storage/supabaseReader";
import ButtonClear from "../../../components/Buttons/ButtonClear";
import CirclesInfo from "../../../components/CirclesInfo";
import heroImg from "../../../assets/Sauna/Sauna Heaters/stone-hero.webp";
import "./heaters.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

// ── Fixed group order ─────────────────────────────────────────────────
const FIXED_ORDER = ["Cumulus", "Nimbus"];

// ── Keywords to detect group membership ───────────────────────────────
const GROUP_KEYWORDS = {
  Cumulus: ["Cumulus"],
  Nimbus: ["Nimbus"],
};

// ── Filter Stone products dynamically ────────────────────────────────
function filterStoneProducts(allProducts) {
  return allProducts.filter(
    (p) =>
      p.categories?.includes("Stone") || // category contains Stone
      p.name?.toLowerCase().includes("stone") // name contains "stone"
  );
}

// ── Group products dynamically ───────────────────────────────────────
function groupProducts(products) {
  const groupedProducts = products.reduce((groups, product) => {
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

    // If no match, assign to Other
    if (!assigned) {
      if (!groups["Other"]) groups["Other"] = [];
      groups["Other"].push(product);
    }

    return groups;
  }, {});

  return groupedProducts;
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
        {localOrRemote(product, 'thumbnail') ? (
          <img
            src={localOrRemote(product, 'thumbnail')}
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

// ── Stone page ───────────────────────────────────────────────────────
const Stone = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [search, setSearch] = useState("");

  // ── Fetch products from Supabase ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getVisibleProductsCached();
        const stoneProducts = filterStoneProducts(data);
        setAllProducts(stoneProducts);
      } catch (err) {
        console.error("Stone: fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Group and filter products ───────────────────────────────────────────
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

        /* ── Search bar styles ── */
        .wm-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1.5px solid #e0cfc0;
          border-radius: 40px;
          padding: 9px 18px;
          box-shadow: 0 2px 12px rgba(139,94,60,0.07);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .wm-search-wrap:focus-within {
          border-color: #a67853;
          box-shadow: 0 2px 18px rgba(139,94,60,0.13);
        }
        .wm-search-icon {
          color: #a67853;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .wm-search-input {
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.84rem;
          color: #2c1a0e;
          width: 100%;
        }
        .wm-search-input::placeholder {
          color: #c4a882;
        }
        .wm-search-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: #c4a882;
          font-size: 0.75rem;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .wm-search-clear:hover { color: #8b5e3c; }
        .wm-search-count {
          text-align: center;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem;
          color: #a67853;
          margin-bottom: 16px;
        }
      `}</style>

      {/* HERO */}
      <section className="relative min-h-[95vh] flex flex-col justify-center items-center text-center px-6">
        <img
          src={heroImg}
          alt="Sauna Stone Series"
          className="absolute inset-0 w-full h-full object-cover object-center -z-10"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-black/40 -z-10" />
        <div className="relative z-10">
          <h1 className="wm-hero-title">SAUNA STONE SERIES</h1>
          <p className="wm-hero-subtitle">Efficient, Sleek, Wellness-Focused Saunas.</p>
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
          <h2 className="wm-products-title">Introducing Our Premium Sauna Stone Series</h2>
          <p className="wm-products-desc">
            Indulge in modern, energy-efficient saunas designed for relaxation and wellness, with sleek
            aesthetics and superior comfort. Our Stone Heaters are made from all stone or a combination
            of stainless steel and stone. You get excellent heat conduction from Finnish soapstone,
            which enhances your sauna experience and dries your sauna room faster after use.
          </p>
        </div>
      </section>

      {/* FILTER + SEARCH */}
      <section className="wm-section wm-section--flush-bottom">
        <div className="wm-container">
          <div className="wm-filter-search-row">
            {/* ── Filter pills ── */}
            <div className="wm-filter-pills-group">
              <button className={`wm-filter-btn ${activeGroup === null ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(null)}>All</button>
              {groupNames.map((g) => (
                <button key={g} className={`wm-filter-btn ${activeGroup === g ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(g)}>
                  {g}
                </button>
              ))}
            </div>

            {/* ── Search bar ── */}
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
          {search && (
            <p className="wm-search-count">
              {visibleGroups.flatMap(g => (groupedProducts[g] || []).filter(p => {
                const q = search.trim().toLowerCase();
                return p.name?.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q));
              })).length === 0
                ? `No results for "${search}"`
                : `${visibleGroups.flatMap(g => (groupedProducts[g] || []).filter(p => {
                  const q = search.trim().toLowerCase();
                  return p.name?.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q));
                })).length} result${visibleGroups.flatMap(g => (groupedProducts[g] || []).filter(p => {
                  const q = search.trim().toLowerCase();
                  return p.name?.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q));
                })).length !== 1 ? "s" : ""} for "${search}"`
              }
            </p>
          )}
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
              <p>No Stone heaters available.</p>
            </div>
          ) : (
            visibleGroups.map((brand, gi) => {
              const q = search.trim().toLowerCase();
              const items = (groupedProducts[brand] || []).filter(p =>
                !q ||
                p.name?.toLowerCase().includes(q) ||
                p.short_description?.toLowerCase().includes(q) ||
                (p.categories || []).some(c => c.toLowerCase().includes(q))
              );
              if (items.length === 0) return null;
              return (
                <div className="wm-group" key={gi}>
                  <h3 className="wm-group-title">{brand.toUpperCase()}</h3>
                  <div className="wm-products-grid">
                    {items.map((product, ii) => (
                      <ProductCard key={ii} product={product} />
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
              <p className="wm-why-desc">Durable Construction — High-quality materials ensure long-lasting performance.</p>
              <div style={{ marginTop: "20px" }}>
                <a href="https://www.sawo.com/wp-content/uploads/2025/12/Stone-SeriesRV1_compressed.pdf" target="_blank" rel="noopener noreferrer" className="wm-brochure-btn">VIEW BROCHURE</a>
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

export default Stone;