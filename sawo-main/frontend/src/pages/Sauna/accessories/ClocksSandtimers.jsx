import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../../Administrator/Local/useLocalProducts";
import ButtonClear from "../../../components/Buttons/ButtonClear";
import CirclesInfo from "../../../components/CirclesInfo";
import heroImg from "../../../assets/sand-timer-copy-new.webp";
import "../heaters/heaters.css";

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

const DISPLAY_CATEGORIES = ["Clocks", "Sand Timers", "Clocks & Timers"];
const DISPLAY_TAGS       = ["Clocks & Timers"];

const FIXED_ORDER = ["Clocks", "Sand Timers"];
const GROUP_KEYWORDS = {
  "Clocks":       ["Clock"],
  "Sand Timers":  ["Sand Timer", "Sandtimer", "Timer"],
};

function arrayMatchesAny(arr = [], targets = []) {
  if (!targets.length) return false;
  const lower = targets.map(t => t.toLowerCase());
  return arr.some(item => lower.includes(item.toLowerCase()));
}
function applyDisplayFilter(products) {
  const noCat = DISPLAY_CATEGORIES.length === 0;
  const noTag = DISPLAY_TAGS.length === 0;
  if (noCat && noTag) return products;
  return products.filter(p =>
    arrayMatchesAny(p.categories, DISPLAY_CATEGORIES) ||
    arrayMatchesAny(p.tags, DISPLAY_TAGS)
  );
}
function groupProducts(products) {
  return products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(GROUP_KEYWORDS)) {
      for (const kw of keywords) {
        const nameMatch = product.name?.toLowerCase().includes(kw.toLowerCase());
        const tagMatch  = product.tags?.some(t => t.toLowerCase().includes(kw.toLowerCase()));
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

function SkeletonCard() {
  return (
    <div className="wm-product-item" style={{ opacity: 0.45 }}>
      <div className="wm-product-img-wrap" style={{ background: "linear-gradient(90deg,#f0ebe3 25%,#faf8f5 50%,#f0ebe3 75%)", backgroundSize: "200% 100%", animation: "wm-shimmer 1.5s infinite", borderRadius: 8 }} />
      <div style={{ height: 10, background: "#f0ebe3", borderRadius: 4, marginTop: 8, width: "70%", animation: "wm-shimmer 1.5s infinite" }} />
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.slug}`} className="wm-product-item" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", cursor: "pointer" }}>
      <div className="wm-product-img-wrap" style={{ transition: "transform 0.3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        {getImageUrl(product, "thumbnail")
          ? <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="wm-product-img" onError={e => { e.currentTarget.style.display = "none"; }} />
          : <div className="wm-product-img-placeholder"><i className="fas fa-image" /></div>
        }
      </div>
      <p className="wm-product-name" style={{ color: "#2c1f13" }}>{product.name}</p>
    </Link>
  );
}

export default function ClocksSandtimers() {
  const { products: localProds, loading } = useLocalProducts();
  const [search, setSearch]           = useState("");
  const [activeGroup, setActiveGroup] = useState(null);

  const allProducts = useMemo(() => {
    const visible  = localProds.filter(p => p.status === "published" && p.visible !== false);
    const filtered = applyDisplayFilter(visible);
    return [...filtered].sort((a, b) => {
      const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
      if (sA !== sB) return sA - sB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  const groupedProducts = useMemo(() => groupProducts(allProducts), [allProducts]);
  const groupNames      = useMemo(() => FIXED_ORDER.filter(g => groupedProducts[g]), [groupedProducts]);
  const visibleGroups   = useMemo(() => activeGroup ? groupNames.filter(g => g === activeGroup) : groupNames, [activeGroup, groupNames]);

  const searchCount = useMemo(() => {
    if (!search) return 0;
    const q = search.trim().toLowerCase();
    return visibleGroups.flatMap(g => (groupedProducts[g] || []).filter(p =>
      p.name?.toLowerCase().includes(q) ||
      (p.categories || []).some(c => c.toLowerCase().includes(q)) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    )).length;
  }, [search, visibleGroups, groupedProducts]);

  return (
    <div className="relative">
      <style>{`
        @keyframes wm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .wm-search-wrap { display: flex; align-items: center; gap: 10px; max-width: 420px; margin: 0 auto 32px; background: #fff; border: 1.5px solid #e0cfc0; border-radius: 40px; padding: 9px 18px; box-shadow: 0 2px 12px rgba(139,94,60,0.07); transition: border-color 0.2s, box-shadow 0.2s; }
        .wm-search-wrap:focus-within { border-color: #a67853; box-shadow: 0 2px 18px rgba(139,94,60,0.13); }
        .wm-search-icon { color: #a67853; font-size: 0.85rem; flex-shrink: 0; }
        .wm-search-input { border: none; outline: none; background: transparent; font-family: 'Montserrat', sans-serif; font-size: 0.84rem; color: #2c1a0e; width: 100%; }
        .wm-search-input::placeholder { color: #c4a882; }
        .wm-search-clear { background: none; border: none; cursor: pointer; color: #c4a882; font-size: 0.75rem; padding: 0; line-height: 1; flex-shrink: 0; transition: color 0.15s; }
        .wm-search-clear:hover { color: #8b5e3c; }
        .wm-search-count { text-align: center; font-family: 'Montserrat', sans-serif; font-size: 0.72rem; color: #a67853; margin-bottom: 16px; }
      `}</style>

      <section className="relative min-h-[95vh] flex flex-col justify-center items-center text-center px-6">
        <img src={heroImg} alt="Clocks and Sand Timers" className="absolute inset-0 w-full h-full object-cover object-center -z-10" loading="eager" fetchPriority="high" decoding="sync" />
        <div className="absolute inset-0 bg-black/50 -z-10" />
        <div className="relative z-10">
          <h1 className="wm-hero-title">CLOCKS & SANDTIMERS</h1>
          <p className="wm-hero-subtitle">Track your sauna session in style</p>
          <div style={{ marginTop: "32px" }}>
            <ButtonClear text="VIEW BROCHURE" href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf" download />
          </div>
        </div>
      </section>

      <section className="wm-section">
        <div className="wm-container text-center">
          <h2 className="wm-products-title">Sauna Clocks & Sand Timers</h2>
          <p className="wm-products-desc">Want to see who lasts the longest in the sauna? Our 15-minute sand timers are perfect for creating conversation or for those new to Finnish sauna. Complement your sauna with elegant wooden clocks.</p>
        </div>
      </section>

      {!loading && allProducts.length > 0 && (
        <section className="wm-section wm-section--flush-bottom">
          <div className="wm-container">
            <div className="wm-filter-search-row">
              <div className="wm-filter-pills-group">
                <button className={`wm-filter-btn ${activeGroup === null ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(null)}>All</button>
                {groupNames.map(g => (
                  <button key={g} className={`wm-filter-btn ${activeGroup === g ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(g)}>{g}</button>
                ))}
              </div>
              <div className="wm-search-wrap wm-search-bar-fixed">
                <i className="fa-solid fa-magnifying-glass wm-search-icon" />
                <input className="wm-search-input" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clocks & timers..." />
                {search && <button className="wm-search-clear" onClick={() => setSearch("")}><i className="fa-solid fa-xmark" /></button>}
              </div>
            </div>
            {search && <p className="wm-search-count">{searchCount === 0 ? `No results for "${search}"` : `${searchCount} result${searchCount !== 1 ? "s" : ""} for "${search}"`}</p>}
          </div>
        </section>
      )}

      <section className="wm-section wm-section--flush-top">
        <div className="wm-container">
          {loading && <div className="wm-products-grid">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>}
          {!loading && allProducts.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Montserrat', sans-serif", color: "#888" }}><p>No products available yet.</p></div>}
          {!loading && allProducts.length > 0 && (
            <>
              {visibleGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Montserrat', sans-serif", color: "#a67853" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "1.8rem", opacity: 0.35, display: "block", marginBottom: 10 }} />
                  <p style={{ margin: 0 }}>No products match "<strong>{search}</strong>"</p>
                  <button onClick={() => setSearch("")} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "#8b5e3c", fontFamily: "'Montserrat', sans-serif", fontSize: "0.8rem", textDecoration: "underline" }}>Clear search</button>
                </div>
              ) : (
                visibleGroups.map(group => {
                  const q = search.trim().toLowerCase();
                  const items = (groupedProducts[group] || []).filter(p => !q || p.name?.toLowerCase().includes(q) || (p.categories || []).some(c => c.toLowerCase().includes(q)) || (p.tags || []).some(t => t.toLowerCase().includes(q)));
                  if (items.length === 0) return null;
                  return (
                    <div className="wm-group" key={group}>
                      <h3 className="wm-group-title">{group.toUpperCase()}</h3>
                      <div className="wm-products-grid">{items.map(product => <ProductCard key={product.id || product.slug} product={product} />)}</div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </section>

      <section className="wm-section">
        <div className="wm-container">
          <div className="wm-why-grid">
            <div className="wm-why-left">
              <p className="wm-eyebrow">SAWO ACCESSORIES</p>
              <h2 className="wm-why-title">Why Choose SAWO Clocks & Timers</h2>
              <p className="wm-why-desc">SAWO clocks and sand timers are crafted from natural wood for an authentic sauna aesthetic. Durable, heat-resistant, and beautifully designed to complement any sauna interior.</p>
              <div style={{ marginTop: "20px" }}>
                <a href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf" target="_blank" rel="noopener noreferrer" className="wm-brochure-btn">VIEW BROCHURE</a>
              </div>
            </div>
            <div className="wm-why-right"><CirclesInfo /></div>
          </div>
        </div>
      </section>

      <section className="wm-banner">
        <div className="wm-banner-content">
          <h2 className="wm-banner-title">Complete Your Sauna Experience</h2>
          <p className="wm-banner-sub">Explore our full range of authentic Finnish sauna accessories</p>
        </div>
      </section>
    </div>
  );
}
