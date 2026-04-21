// src/pages/Sauna/heaters/WallMounted.jsx
// Dynamic products from Supabase, filtered by categories/tags, with search.

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVisibleProductsCached } from "../../../local-storage/supabaseReader";
import ButtonClear from "../../../components/Buttons/ButtonClear";
import CirclesInfo from "../../../components/CirclesInfo";
import heroImg from "../../../assets/Sauna/Sauna Heaters/wall-hero.webp";
import "./heaters.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ██  DISPLAY FILTER CONFIG — edit these arrays to control what shows up  ██
//
//  • DISPLAY_CATEGORIES — products whose `categories` array contains ANY of
//    these strings (case-insensitive) will be included.
//    Set to [] to skip category filtering entirely.
//
//  • DISPLAY_TAGS — products whose `tags` array contains ANY of these strings
//    (case-insensitive) will also be included.
//    Set to [] to skip tag filtering entirely.
//
//  If BOTH arrays are empty, ALL published+visible products are shown.
// ─────────────────────────────────────────────────────────────────────────────
const DISPLAY_CATEGORIES = [
  "Wall-Mounted",
  "Wall Mounted",
  // Add more category names here as needed, e.g.:
  // "Electric Heaters",
  // "Classic Series",
];

const DISPLAY_TAGS = [
  // Add tag names here to also include products by tag, e.g.:
  // "wall-mount",
  // "compact",
];

// ─── Grouping by product type (Nordex, Mini, Scandia, etc.) ──────────────────
const FIXED_ORDER = [
  "Nordex Mini Combi", "Nordex Combi", "Nordex Mini", "Nordex",
  "Mini Combi", "Mini X", "Mini",
  "Scandia Combi", "Scandia",
  "Krios", "Scandifire",
];

const GROUP_KEYWORDS = {
  "Nordex Mini Combi": ["Nordex Mini Combi", "NRMC"],
  "Nordex Combi":      ["Nordex Combi", "NRNC"],
  "Nordex Mini":       ["Nordex Mini", "NRM-"],
  "Nordex":            ["Nordex", "NRN-"],
  "Mini Combi":        ["Mini Combi", "MNC"],
  "Mini X":            ["Mini X", "MX "],
  "Mini":              ["Mini NB", "MN "],
  "Scandia Combi":     ["Scandia Combi", "SCAC"],
  "Scandia":           ["Scandia", "SCA-"],
  "Krios":             ["Krios", "KRI"],
  "Scandifire":        ["Scandifire"],
};

/** Group products by brand/type keywords */
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
    if (!assigned) {
      if (!groups["Other"]) groups["Other"] = [];
      groups["Other"].push(product);
    }
    return groups;
  }, {});
  return groupedProducts;
}

// ─────────────────────────────────────────────────────────────────────────────

/** Case-insensitive check: does `arr` contain any item from `targets`? */
function arrayMatchesAny(arr = [], targets = []) {
  if (!targets.length) return false;
  const lower = targets.map(t => t.toLowerCase());
  return arr.some(item => lower.includes(item.toLowerCase()));
}

/** Filter the full product list to only those matching DISPLAY_CATEGORIES / DISPLAY_TAGS */
function applyDisplayFilter(products) {
  const noCatFilter = DISPLAY_CATEGORIES.length === 0;
  const noTagFilter = DISPLAY_TAGS.length === 0;

  // No filters at all → show everything
  if (noCatFilter && noTagFilter) return products;

  return products.filter(p =>
    arrayMatchesAny(p.categories, DISPLAY_CATEGORIES) ||
    arrayMatchesAny(p.tags, DISPLAY_TAGS)
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
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

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  // Look for a kW power range tag (e.g. "3.5 – 9 kW")
  const power = (product.tags || []).find(t => /\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\s*kW/i.test(t)) || "";

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

// ─── Main component ───────────────────────────────────────────────────────────
export default function WallMounted() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [offline,  setOffline]  = useState(!navigator.onLine);

  // Search query for the displayed grid
  const [search, setSearch] = useState("");

  // Grouping by product type
  const [activeGroup, setActiveGroup] = useState(null);

  // ── Online/offline listeners ────────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => { setOffline(false); fetchProducts(true); };
    const onOffline = () => setOffline(true);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => { fetchProducts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch from Supabase with smart caching ──────────────────────────────
  async function fetchProducts() {
    try {
      let data = await getVisibleProductsCached();
      // Sort by sort_order first, then by created_at descending
      data.sort((a, b) => {
        const sortA = a.sort_order ?? 999;
        const sortB = b.sort_order ?? 999;
        if (sortA !== sortB) return sortA - sortB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAllProducts(applyDisplayFilter(data));
    } catch (err) {
      console.error("WallMounted: fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Group and filter products ────────────────────────────────────────────
  const groupedProducts = useMemo(() => groupProducts(allProducts), [allProducts]);
  const groupNames = useMemo(() => FIXED_ORDER.filter((g) => groupedProducts[g]), [groupedProducts]);
  const visibleGroups = useMemo(
    () => (activeGroup ? groupNames.filter((g) => g === activeGroup) : groupNames),
    [activeGroup, groupNames]
  );


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
          max-width: 420px;
          margin: 0 auto 32px;
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

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex flex-col justify-center items-center text-center px-6">
        <img
          src={heroImg}
          alt="Wall-Mounted Sauna Heaters"
          className="absolute inset-0 w-full h-full object-cover object-center -z-10"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-black/40 -z-10" />
        <div className="relative z-10">
          <h1 className="wm-hero-title">WALL-MOUNTED SAUNA HEATERS</h1>
          <p className="wm-hero-subtitle">Space-saving sleek modern designs</p>
          <div style={{ marginTop: "32px" }}>
            <ButtonClear text="EXPLORE HEATERS" href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/sauna-products/" />
          </div>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────────────── */}
      <section className="wm-section">
        <div className="wm-container text-center">
          <h2 className="wm-products-title">Introducing Our Premium Wall Mounted Heaters</h2>
          <p className="wm-products-desc">
            Our wall-mounted heaters are crafted for those who love the traditional dry and hot sauna experience.
            This series of classic heaters boasts of robust, space-saving models for small and medium-sized saunas.
          </p>
        </div>
      </section>

      {/* ── Status banners ───────────────────────────────────────────────── */}
      {offline && (
        <div style={{ background: "#FEF5EC", borderTop: "1px solid #F5D5A0", borderBottom: "1px solid #F5D5A0", padding: "8px 24px", textAlign: "center", fontFamily: "'Montserrat', sans-serif", fontSize: "0.78rem", color: "#9C6A10" }}>
          <i className="fa-solid fa-wifi" style={{ marginRight: 6, opacity: 0.6 }} />
          You are offline — showing last saved data
        </div>
      )}

      {/* ── FILTER + SEARCH ───────────────────────────────────────────────── */}
      {!loading && allProducts.length > 0 && (
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
                  return p.name?.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q)) || (p.tags || []).some(t => t.toLowerCase().includes(q));
                })).length === 0
                  ? `No results for "${search}"`
                  : `${visibleGroups.flatMap(g => (groupedProducts[g] || []).filter(p => {
                    const q = search.trim().toLowerCase();
                    return p.name?.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q)) || (p.tags || []).some(t => t.toLowerCase().includes(q));
                  })).length} result${visibleGroups.flatMap(g => (groupedProducts[g] || []).filter(p => {
                    const q = search.trim().toLowerCase();
                    return p.name?.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q)) || (p.tags || []).some(t => t.toLowerCase().includes(q));
                  })).length !== 1 ? "s" : ""} for "${search}"`
                }
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── PRODUCTS GRID ────────────────────────────────────────────────── */}
      <section className="wm-section wm-section--flush-top">
        <div className="wm-container">

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="wm-products-grid">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── Empty states ── */}
          {!loading && allProducts.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Montserrat', sans-serif", color: "#888" }}>
              <p>No products available yet.{offline ? " Connect to the internet to load products." : ""}</p>
            </div>
          )}

          {/* ── Grouped products ── */}
          {!loading && allProducts.length > 0 && (
            <>
              {visibleGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Montserrat', sans-serif", color: "#a67853" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "1.8rem", opacity: 0.35, display: "block", marginBottom: 10 }} />
                  <p style={{ margin: 0 }}>No heaters match "<strong>{search}</strong>"</p>
                  <button onClick={() => setSearch("")} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "#8b5e3c", fontFamily: "'Montserrat', sans-serif", fontSize: "0.8rem", textDecoration: "underline" }}>
                    Clear search
                  </button>
                </div>
              ) : (
                visibleGroups.map((brand) => {
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
                    <div className="wm-group" key={brand}>
                      <h3 className="wm-group-title">{brand.toUpperCase()}</h3>
                      <div className="wm-products-grid">
                        {items.map((product) => (
                          <ProductCard key={product.id || product.slug} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>
      </section>

      {/* ── WHY SAWO ─────────────────────────────────────────────────────── */}
      <section className="wm-section">
        <div className="wm-container">
          <div className="wm-why-grid">
            <div className="wm-why-left">
              <p className="wm-eyebrow">SAWO HEATERS</p>
              <h2 className="wm-why-title">Why Choose SAWO Heaters</h2>
              <p className="wm-why-desc">
                SAWO heaters combine durability, energy efficiency, and modern design,
                offering consistent performance for a reliable, superior sauna experience every time.
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

      {/* ── BANNER ───────────────────────────────────────────────────────── */}
      <section className="wm-banner">
        <div className="wm-banner-content">
          <h2 className="wm-banner-title">Experience Ultimate Relaxation</h2>
          <p className="wm-banner-sub">Find your source of serenity from over 100 heater models</p>
        </div>
      </section>
    </div>
  );
}