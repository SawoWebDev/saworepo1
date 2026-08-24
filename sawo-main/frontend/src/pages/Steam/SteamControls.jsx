// SteamControls.jsx

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import PageCTA from "../../components/PageCTA";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import { isPubliclyVisible } from "../../local-storage/visibility";

// Served from /public (not webpack-bundled) so its URL is stable at build time —
// public/index.html preloads this exact path for this route, so by the time
// this component mounts and applies it, the browser already has it cached.
const heroBg = "/hero/steam-controls.webp";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field) {
  return localOrRemote(product, field) || null;
}

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function getFirstSentence(text) {
  if (!text) return "";
  const cleaned = stripHtml(text).replace(/\s+/g, " ").trim();
  // Lookahead requires the punctuation to be followed by a space + capital
  // letter (or the end of the string) so it doesn't stop early on periods
  // inside things like "2.0" or abbreviations like "STE." mid-sentence.
  const match = cleaned.match(/^[^.!?]*[.!?](?=\s+[A-Z]|\s*$)/);
  return match ? match[0] : cleaned.split(/\s+/).slice(0, 20).join(" ") + "...";
}

// Model number lives as a "(STP-INFACE-V2)"-style tag rather than its own field.
function getModelTag(product) {
  const tag = (product.tags || []).find(t => /^\(.+\)$/.test(t));
  return tag ? tag.slice(1, -1) : "";
}

const DISPLAY_CATEGORIES = ["Steam Controls"];

const SteamControls = () => {
  const { products: localProds, loading } = useLocalProducts();
  const heroLoaded = useHeroLoaded(heroBg);

  const controls = useMemo(() => {
    const visible = localProds.filter(p => isPubliclyVisible(p));
    const filtered = visible.filter(p =>
      (p.categories || []).some(c => DISPLAY_CATEGORIES.includes(c))
    );
    return [...filtered].sort((a, b) => {
      const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
      if (sA !== sB) return sA - sB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  return (
  <div className="relative">
      <SEO
        title="Steam Controls"
        description="Precision steam control from SAWO, with the Saunova and Innova control series for effortless operation and a personalized sauna experience."
        path="/steam/controls"
      />

    {/* ===================== */}
    {/* HERO                  */}
    {/* ===================== */}
    <section
      className="sc-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
      style={{ backgroundColor: "#241c17" }} // warm-dark placeholder so it doesn't flash gray before the hero image decodes
    >
      {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: heroLoaded ? 1 : 0,
          transition: "opacity 0.6s ease",
          zIndex: 0,
        }}
      />
      <div className="sc-hero-overlay" />
      <div className="sc-hero-content">
        <h1 className="sc-hero-title">STEAM CONTROLS</h1>
        <p className="sc-hero-subtitle">
          Precision and ease, take full control of your steam experience
        </p>
      </div>
    <HeroWave />
    </section>

    {/* ===================== */}
    {/* INTRO                 */}
    {/* ===================== */}
    <section className="sc-intro-section">
      <div className="sc-container text-center">
        <h2 className="sc-section-title">Introducing Our Steam Controls</h2>
        <p className="sc-section-desc">
          Experience precise steam settings and effortless operation with the
          Saunova and Innova series for a personalized sauna experience.
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* CONTROLS              */}
    {/* ===================== */}
    <section className="sc-section">
      <div className="sc-container">
        {loading && <p style={{ textAlign: "center", color: "#999" }}>Loading controls...</p>}
        {!loading && controls.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>No steam controls available yet.</p>
        )}
        {!loading && controls.length > 0 && (
          <div className="sc-grid">
            {controls.map(product => (
              <Link to={`/products/${product.slug}`} key={product.id || product.slug} className="sc-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="sc-img-wrap">
                  {getImageUrl(product, "thumbnail") ? (
                    <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="sc-img" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", color: "#ccc" }}>
                      <i className="fas fa-image" style={{ fontSize: "32px" }} />
                    </div>
                  )}
                </div>
                <div className="sc-text">
                  {getModelTag(product) && <p className="sc-eyebrow">{getModelTag(product)}</p>}
                  <h3 className="sc-card-title">{product.name}</h3>
                  <p className="sc-card-desc">
                    {getFirstSentence(product.short_description) || getFirstSentence(product.description) || "Precision steam control for a personalized sauna experience."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* ===================== */}
    {/* PRECAUTION NOTICE     */}
    {/* ===================== */}
    <section className="sc-notice-section">
      <div className="sc-container">
        <div className="sfw-notice-wrap">
          <div className="sfw-notice-card">
            <span className="sfw-notice-tab">Precaution Notice</span>
            <div className="sfw-notice-body">
              <p>Only a qualified electrician is allowed to make electrical connections and repairs on the unit. Use original parts only.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ===================== */}
    {/* CTA                   */}
    {/* ===================== */}
    <PageCTA
      title="Need Help Choosing a Control?"
      description="Pair the right control panel with your steam generator for precise, effortless operation. Our team is here to help."
    />

    {/* ===================== */}
    {/* STYLES                */}
    {/* ===================== */}
    <style>{`

      /* ---- Hero ---- */
      .sc-hero-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.48);
        z-index: 0;
      }
      .sc-hero-content {
        position: relative; z-index: 1;
        display: flex; flex-direction: column;
        align-items: center; gap: 10px;
      }
      .sc-hero-eyebrow {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem; font-weight: 600;
        letter-spacing: 4px; color: rgba(255,255,255,0.7);
        text-transform: uppercase; margin: 0;
      }
      .sc-hero-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 45px; line-height: 52px;
        font-weight: 700; color: #fff; margin: 0;
      }
      .sc-hero-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 20px; font-weight: 300;
        color: rgba(255,255,255,0.88);
        line-height: 1.6; max-width: 540px;
        margin: 4px 0 0;
      }

      /* ---- Layout ---- */
      .sc-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .sc-intro-section {
        padding: 72px 0 0;
      }
      .sc-section {
        padding: 48px 0 80px;
      }
      .sc-section-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.2rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sc-section-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.05rem; font-weight: 400;
        color: #555; line-height: 1.8;
        max-width: 680px; margin: 0 auto;
      }

      /* ---- Control cards ---- */
      .sc-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px;
      }
      .sc-card {
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #ede5db;
        background: #fff;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .sc-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 40px rgba(170,129,97,0.15);
      }

      /* ---- Image ---- */
      .sc-img-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        height: 220px;
        overflow: hidden;
      }
      .sc-img {
        max-width: 100%;
        max-height: 160px;
        object-fit: contain;
        display: block;
        transition: transform 0.5s ease;
      }
      .sc-card:hover .sc-img {
        transform: scale(1.06);
      }

      /* ---- Text ---- */
      .sc-text {
        padding: 16px 20px 22px;
        border-top: 1px solid #ede5db;
        flex: 1;
      }
      .sc-eyebrow {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem; font-weight: 600;
        letter-spacing: 2.5px; color: #AA8161;
        text-transform: uppercase; margin-bottom: 8px;
      }
      .sc-card-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.9rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sc-card-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem; font-weight: 400;
        color: #444; line-height: 1.8;
      }

      /* ---- Responsive ---- */
      @media (max-width: 768px) {
        .sc-hero-title   { font-size: 28px; line-height: 36px; }
        .sc-hero-subtitle { font-size: 16px; }
        .sc-section-title { font-size: 1.7rem; }
        .sc-grid { grid-template-columns: 1fr; }
        .sc-intro-section { padding: 48px 0 0; }
        .sc-section { padding: 32px 0 60px; }
      }
      @media (max-width: 1024px) and (min-width: 769px) {
        .sc-grid { grid-template-columns: repeat(2, 1fr); }
      }

      /* ---- Precaution notice ---- */
      .sc-notice-section {
        padding: 0 0 56px;
      }
      .sfw-notice-wrap {
        width: 100%;
        margin: 0;
        padding: 0;
        font-family: 'Montserrat', sans-serif;
        box-sizing: border-box;
      }
      .sfw-notice-card {
        position: relative;
        width: 100%;
        background: #fdfaf7;
        border: 2px solid #A67853;
        border-radius: 10px;
        padding: 30px 36px 30px 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        overflow: hidden;
        box-shadow: 0 6px 16px rgba(139, 94, 60, 0.1);
        box-sizing: border-box;
      }
      .sfw-notice-tab {
        position: absolute;
        top: 0;
        left: 0;
        background: #8B5E3C;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 6px 18px 6px 14px;
        border-bottom-right-radius: 10px;
      }
      .sfw-notice-body {
        margin-top: 14px;
        flex: 1 1 auto;
        text-align: center;
      }
      .sfw-notice-body p {
        margin: 0;
        font-size: 1.12rem;
        font-weight: 300;
        line-height: 1.6;
        color: #3a2c22;
      }
      @media (max-width: 768px) {
        .sc-notice-section { padding: 0 0 40px; }
        .sfw-notice-card {
          flex-direction: column;
          align-items: center;
          padding: 34px 24px 26px;
          gap: 14px;
        }
        .sfw-notice-body {
          margin-top: 0;
        }
        .sfw-notice-body p {
          font-size: 1.02rem;
        }
      }
    `}</style>

  </div>
  );
};

export default SteamControls;