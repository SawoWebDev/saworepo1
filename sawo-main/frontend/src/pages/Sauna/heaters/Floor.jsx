// Floor.jsx
// See WallMounted.jsx for how to use local product data instead of Supabase.
//
// ═══════════════════════════════════════════════════════════════════════════════
// EDITOR GUIDE — Floor-Mounted Heaters page
// ═══════════════════════════════════════════════════════════════════════════════
//
// This page displays floor-mounted sauna heaters (Taurus D, Helius, Krios,
// Savonia, and Nordex families). Products are loaded from the local CMS and
// grouped automatically.
//
// ── STEP 1: Open the CMS ────────────────────────────────────────────────────
//   Go to /admin → Products → click "Add Product" (or open an existing one).
//
// ── STEP 2: Fill in the required fields ─────────────────────────────────────
//   • Name       — Product name (see group rules below)
//   • Category   — MUST include "Floor"   ← this routes the product to this page
//                  Alternatively, add the tag "floor" (lowercase) — either works.
//   • Status     — Set to "published"
//   • Visible    — Must be ON (true)
//   • Thumbnail  — Upload the product image or paste its URL
//   • Slug       — URL-friendly ID, e.g. "nordex-pro-ns" (auto-generated if blank)
//
// ── STEP 3: Naming rules — which group the product lands in ─────────────────
//   The product name determines which labelled group it appears under:
//
//   Name contains…          → Group shown on page
//   ──────────────────────────────────────────────
//   "Taurus D" or "Taurus"  → Taurus D
//   "Helius"                → HELIUS
//   "Krios Floor" or "Krios"→ Krios
//   "Savonia"               → Savonia
//   "Nordex"                → Nordex
//
//   Groups are checked in that exact order — the first match wins.
//   Example: "Krios Floor NS" matches "Krios Floor" and lands in Krios.
//
// ── STEP 4: Save and verify ─────────────────────────────────────────────────
//   After saving in the CMS, reload this page in the browser.
//   The product card will appear in the correct group section.
//   If it doesn't show: check that Status = published, Visible = ON,
//   and that Category = "Floor" OR the Tags field contains "floor".
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../../Administrator/Local/useLocalProducts";
import BrochureDropdownButton from "../../../components/Buttons/BrochureDropdownButton";
import CirclesInfo from "../../../components/CirclesInfo";
import menuPaths from "../../../menuPaths";
import heroImg from "../../../assets/Sauna/Sauna Heaters/floor-hero.webp";
import bannerImg from "../../../assets/Sauna/Sauna Heaters/heater-banner.webp";
import "./heaters.css";
import PromoBanner from "../../../components/PromoBanner";
import HeroWave from "../../../components/HeroWave";
import SEO from "../../../components/SEO";
import { isPubliclyVisible } from "../../../local-storage/visibility";
import { getPowerRange } from "../../../utils/productPower";
import { isHeaterProduct } from "../../../utils/isHeaterProduct";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field) {
  const path = localOrRemote(product, field);
  if (!path) return null;
  return path;
}

// ── Fixed group order ───────────────────────────────────────────────
// Krios is intentionally excluded — Floor Series no longer displays it.
const FIXED_ORDER = ["Helius", "Taurus D", "Savonia", "Nordex"];

// ── Keywords to detect group membership ────────────────────────────
const GROUP_KEYWORDS = {
  "Taurus D": ["Taurus D", "Taurus"],
  Helius: ["Helius", "HELIUS"],
  Krios: ["Krios Floor", "Krios"],
  Savonia: ["Savonia"],
  Nordex: ["Nordex"],
};

// ── Filter Floor products dynamically ───────────────────────────────
function filterFloorProducts(allProducts) {
  return allProducts.filter((p) => {
    // Admission gate first — category alone decides whether this is a
    // heater at all, before the looser name/tag keyword check below runs.
    if (!isHeaterProduct(p)) return false;
    return (
      p.categories?.includes("Floor") ||
      p.tags?.some(t => t.toLowerCase() === "floor")
    );
  });
}

// ── Group products dynamically ──────────────────────────────────────
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

// ── Skeleton card ────────────────────────────────────────────────────
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


// ── Product card component ───────────────────────────────────────────
function ProductCard({ product }) {
  const power = getPowerRange(product.tags);
  const localize = useLocalizedPath();

  return (
    <Link
      to={localize(`/products/${product.slug}`)}
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

// ── Floor page ───────────────────────────────────────────────────────
const Floor = () => {
  const { products: localProds, loading } = useLocalProducts();
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();
  const [activeGroup, setActiveGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [heroLoaded, setHeroLoaded] = useState(false);

  const allProducts = useMemo(() => {
    const visible = localProds.filter(p => isPubliclyVisible(p));
    return filterFloorProducts(visible);
  }, [localProds]);

  const groupedProducts = useMemo(() => groupProducts(allProducts), [allProducts]);
  const groupNames = useMemo(() => FIXED_ORDER.filter((g) => groupedProducts[g]), [groupedProducts]);

  const visibleGroups = activeGroup
    ? groupNames.filter((g) => g === activeGroup)
    : groupNames;

  return (
    <div className="relative">
      <SEO
        title={t("floorPage.meta.title")}
        description={t("floorPage.meta.description")}
        path={localize("/sauna/heaters/floor")}
        hreflangAlternates={{ en: "/sauna/heaters/floor", zh: "/zh/sauna/heaters/floor" }}
      />
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
      <section className="relative isolate min-h-[95vh] flex flex-col justify-center items-center text-center px-6" style={{ backgroundColor: "#241c17" }}>
        <img
          src={heroImg}
          alt={t("floorPage.hero.alt")}
          className="absolute inset-0 w-full h-full object-cover object-center -z-10"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          onLoad={() => setHeroLoaded(true)}
          onError={() => setHeroLoaded(true)}
          style={{ opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}
        />
        <div className="absolute inset-0 bg-black/40 -z-10" />
        <div className="relative z-10">
          <h1 className="wm-hero-title">{t("floorPage.hero.title")}</h1>
          <p className="wm-hero-subtitle">{t("floorPage.hero.subtitle")}</p>
          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text={t("floorPage.hero.exploreButton")}
              href={menuPaths.sauna.heaters.parent}
              redirect
            />
          </div>
        </div>
      <HeroWave />
      </section>

      {/* INTRODUCING */}
      <section className="wm-section">
        <div className="wm-container text-center">
          <h2 className="wm-products-title">{t("floorPage.intro.title")}</h2>
          <p className="wm-products-desc">
            {t("floorPage.intro.desc")}
          </p>
        </div>
      </section>

      {/* FILTER + SEARCH */}
      <section className="wm-section wm-section--flush-bottom">
        <div className="wm-container">
          <div className="wm-filter-search-row">
            <div className="wm-filter-pills-group">
              <button className={`wm-filter-btn ${activeGroup === null ? "wm-filter-btn--active" : ""}`} onClick={() => setActiveGroup(null)}>{tc("catalogFilter.all")}</button>
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
                placeholder={tc("catalogFilter.searchPlaceholder", { category: t("floorPage.meta.title") })}
              />
              {search && (
                <button className="wm-search-clear" onClick={() => setSearch("")} title={tc("catalogFilter.clearSearch")}>
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
              <p>{t("floorPage.empty")}</p>
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

      {/* ── VIEW ALL HEATERS ────────────────────────────────────────────── */}
      <section className="wm-section" style={{ textAlign: "center" }}>
        <Link to={localize(menuPaths.heaters)} className="wm-brochure-btn">{t("heatersPage.viewAll")}</Link>
      </section>

      {/* WHY SAWO + CIRCLES */}
      <section className="wm-section">
        <div className="wm-container">
          <div className="wm-why-grid">
            <div className="wm-why-left">
              <p className="wm-eyebrow">{t("floorPage.why.eyebrow")}</p>
              <h2 className="wm-why-title">{t("floorPage.why.title")}</h2>
              <p className="wm-why-desc">
                {t("floorPage.why.desc")}
              </p>
              <div style={{ marginTop: "24px" }}>
                <a
                  href="https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Floor-Series-2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wm-brochure-btn"
                >
                  {tc("viewBrochure")}
                </a>
              </div>
            </div>
            <div className="wm-why-right">
              <CirclesInfo />
            </div>
          </div>
        </div>
      </section>

      <PromoBanner
        title={t("floorPage.promo.title")}
        subtitle={t("floorPage.promo.subtitle")}
        image={bannerImg}
      />
    </div>
  );
};

export default Floor;
