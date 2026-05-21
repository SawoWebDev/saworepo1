// SteamAccessories.jsx

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import heroBg from "../../assets/Steam/hero.webp";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

function getImageUrl(product, field) {
  const path = localOrRemote(product, field);
  if (!path) return null;
  if (path.includes("://")) return path;
  return `${GITHUB_RAW}${path}`;
}

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function getFirstSentence(text) {
  if (!text) return "";
  const cleaned = stripHtml(text).trim();
  const match = cleaned.match(/^[^.!?]*[.!?]/);
  return match ? match[0] : cleaned.split(/\s+/).slice(0, 20).join(" ") + "...";
}

// ─── Display filter config ────────────────────────────────────────────────────
const DISPLAY_CATEGORIES = ["Steam Accessories"];
const DISPLAY_TAGS = ["Steam Accessories"];

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

const SteamAccessories = () => {
  const { products: localProds, loading } = useLocalProducts();

  const accessories = useMemo(() => {
    const visible = localProds.filter(p => p.status === "published" && p.visible !== false);
    const filtered = applyDisplayFilter(visible);
    return [...filtered].sort((a, b) => {
      const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
      if (sA !== sB) return sA - sB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  return (
  <div className="relative">

    {/* ===================== */}
    {/* HERO                  */}
    {/* ===================== */}
    <section
      className="sa-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="sa-hero-overlay" />
      <div className="sa-hero-content">
        <h1 className="sa-hero-title">STEAM ACCESSORIES</h1>
        <p className="sa-hero-subtitle">
          Complete your steam setup with premium accessories
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* INTRO                 */}
    {/* ===================== */}
    <section className="sa-intro-section">
      <div className="sa-container text-center">
        <h2 className="sa-section-title">Introducing Our Steam Accessories</h2>
        <p className="sa-section-desc">
          Enhance your sauna with our premium steam accessories, designed to
          optimize comfort, boost functionality, and elevate your relaxation
          experience.
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* ACCESSORIES GRID      */}
    {/* ===================== */}
    <section className="sa-section">
      <div className="sa-container">
        {loading && <p style={{ textAlign: "center", color: "#999" }}>Loading accessories...</p>}
        {!loading && accessories.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>No steam accessories available yet.</p>
        )}
        {!loading && accessories.length > 0 && (
          <div className="sa-grid">
            {accessories.map((product) => (
              <Link
                key={product.id || product.slug}
                to={`/products/${product.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div className="sa-card">
                  <div className="sa-img-wrap">
                    {getImageUrl(product, "thumbnail") ? (
                      <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="sa-img" />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px", color: "#ccc" }}>
                        <i className="fas fa-image" style={{ fontSize: "32px" }} />
                      </div>
                    )}
                  </div>
                  <div className="sa-card-body">
                    <h3 className="sa-card-title">{product.name}</h3>
                    <p className="sa-card-desc">
                      {getFirstSentence(product.short_description) || getFirstSentence(product.description) || "Premium steam accessory for optimal performance."}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* ===================== */}
    {/* STYLES                */}
    {/* ===================== */}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

      /* ---- Hero ---- */
      .sa-hero-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.48);
        z-index: 0;
      }
      .sa-hero-content {
        position: relative; z-index: 1;
        display: flex; flex-direction: column;
        align-items: center; gap: 10px;
      }
      .sa-hero-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 45px; line-height: 52px;
        font-weight: 700; color: #fff; margin: 0;
      }
      .sa-hero-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 20px; font-weight: 300;
        color: rgba(255,255,255,0.88);
        line-height: 1.6; max-width: 540px; margin: 0;
      }

      /* ---- Layout ---- */
      .sa-container {
        max-width: 1200px; margin: 0 auto; padding: 0 24px;
      }
      .sa-intro-section { padding: 72px 0 0; }
      .sa-section       { padding: 48px 0 80px; }

      .sa-section-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.2rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sa-section-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.05rem; font-weight: 400;
        color: #555; line-height: 1.8;
        max-width: 680px; margin: 0 auto;
      }

      /* ---- Accessories grid ---- */
      .sa-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        grid-auto-rows: 1fr;
      }
      .sa-card {
        display: flex; flex-direction: column;
        border-radius: 16px; overflow: hidden;
        background: #fff;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-align: center;
        cursor: pointer;
        height: 100%;
        box-shadow: 0 8px 24px rgba(170,129,97,0.12);
      }
      .sa-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 48px rgba(170,129,97,0.22);
      }
      .sa-img-wrap {
        display: flex; align-items: center; justify-content: center;
        padding: 28px 20px; height: 160px; overflow: hidden;
      }
      .sa-img {
        max-height: 120px; max-width: 100%;
        object-fit: contain; display: block;
        transition: transform 0.4s ease;
      }
      .sa-card:hover .sa-img { transform: scale(1.08); }
      .sa-card-body {
        padding: 18px 18px 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .sa-card-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem; font-weight: 700;
        color: #AA8161; margin: 0 0 10px 0;
        min-height: 24px;
      }
      .sa-card-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.83rem; font-weight: 400;
        color: #666; line-height: 1.6; margin: 0;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* ---- Responsive ---- */
      @media (max-width: 1024px) {
        .sa-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (max-width: 768px) {
        .sa-hero-title    { font-size: 28px; line-height: 36px; }
        .sa-hero-subtitle { font-size: 16px; }
        .sa-section-title { font-size: 1.7rem; }
        .sa-grid          { grid-template-columns: repeat(2, 1fr); }
        .sa-intro-section { padding: 48px 0 0; }
        .sa-section       { padding: 32px 0 60px; }
      }
      @media (max-width: 480px) {
        .sa-grid { grid-template-columns: 1fr; }
      }
    `}</style>

  </div>
  );
};

export default SteamAccessories;