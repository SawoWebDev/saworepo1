// Steam.jsx

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { isPubliclyVisible } from "../../local-storage/visibility";
import heroBg from "../../assets/Steam/hero.webp";
import HeroWave from "../../components/HeroWave";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import SEO from "../../components/SEO";
import PageCTA from "../../components/PageCTA";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import menuPaths from "../../menuPaths";

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

function byCategory(products, category) {
  const visible = products.filter(p => isPubliclyVisible(p));
  const filtered = visible.filter(p => (p.categories || []).includes(category));
  return [...filtered].sort((a, b) => {
    const sA = a.sort_order ?? 999, sB = b.sort_order ?? 999;
    if (sA !== sB) return sA - sB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

const Steam = () => {
  const { products: localProds, loading } = useLocalProducts();
  const heroLoaded = useHeroLoaded(heroBg);

  const generators = useMemo(() => byCategory(localProds, "Steam Generators"), [localProds]);
  const controls = useMemo(() => byCategory(localProds, "Steam Controls"), [localProds]);
  const accessories = useMemo(() => byCategory(localProds, "Steam Accessories"), [localProds]);

  return (
    <div className="relative">
      <SEO
        title="Steam Sauna — Generators, Controls & Accessories"
        description="Shop SAWO steam sauna systems: stainless-steel steam generators, digital controls, and installation accessories engineered for a consistent, spa-quality steam experience at home or commercially."
        path="/steam"
      />

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="stm-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
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
        <div className="stm-hero-overlay" />
        <div className="stm-hero-content">
          <h1 className="stm-hero-title">STEAM</h1>
          <p className="stm-hero-subtitle">
            Experience the luxury of pure steam therapy
          </p>
          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text="VIEW BROCHURE"
              href="https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Steam-Sauna-2026.pdf"
            />
          </div>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* INTRO                 */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20">
        <p className="stm-intro-text">
          SAWO steam sauna systems bring the therapeutic power of moist heat to any space —
          from compact home steam showers to large-scale commercial spas. Our complete steam
          range covers everything you need: stainless-steel steam generators engineered for
          years of reliable service, intuitive digital controls for precise temperature and
          humidity, and a full line of accessories to finish the installation.
        </p>
      </section>

      {/* ===================== */}
      {/* STEAM GENERATORS      */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="stm-group-head">
          <h2 className="stm-group-title">Steam Generators</h2>
          <Link to={menuPaths.steam.generators} className="stm-view-all">View All Generators</Link>
        </div>
        <p className="stm-group-desc">
          A steam generator is the heart of every steam room, converting water into a
          continuous, even flow of steam. SAWO's stainless-steel generators are built for
          durability and easy maintenance, with models scaled from compact residential units
          up to multi-unit commercial installations delivering up to 75kW.
        </p>
        {loading && <p style={{ textAlign: "center", color: "#999" }}>Loading generators...</p>}
        {!loading && generators.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>No steam generators available yet.</p>
        )}
        {!loading && generators.length > 0 && (
          <div className="stm-gen-grid">
            {generators.map(product => (
              <Link to={`/products/${product.slug}`} key={product.id || product.slug} className="stm-gen-card">
                <div className="stm-gen-img-wrap">
                  {getImageUrl(product, "thumbnail") ? (
                    <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="stm-gen-img" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ccc" }}>
                      <i className="fas fa-image" style={{ fontSize: "32px" }} />
                    </div>
                  )}
                </div>
                <div className="stm-gen-body">
                  <h3 className="stm-gen-title">{product.name}</h3>
                  <p className="stm-gen-desc">
                    {getFirstSentence(product.short_description) || getFirstSentence(product.description) || "Premium SAWO steam generator built for reliable, everyday performance."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===================== */}
      {/* STEAM CONTROLS        */}
      {/* ===================== */}
      <section className="stm-alt-section py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="stm-group-head">
            <h2 className="stm-group-title">Steam Controls</h2>
            <Link to={menuPaths.steam.controls} className="stm-view-all">View All Controls</Link>
          </div>
          <p className="stm-group-desc">
            Pair any SAWO steam generator with a dedicated control panel for precise command
            over temperature, steam output, and session timing. From the essential Steam STE
            dial to the touchscreen Steam Stainless Touch, every control is designed for
            simple, reliable operation.
          </p>
          {loading && <p style={{ textAlign: "center", color: "#999" }}>Loading controls...</p>}
          {!loading && controls.length === 0 && (
            <p style={{ textAlign: "center", color: "#999" }}>No steam controls available yet.</p>
          )}
          {!loading && controls.length > 0 && (
            <div className="stm-cards-grid">
              {controls.map(product => (
                <Link to={`/products/${product.slug}`} key={product.id || product.slug} className="stm-card">
                  <div className="stm-card-img-wrap">
                    {getImageUrl(product, "thumbnail") ? (
                      <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="stm-card-img" />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ccc" }}>
                        <i className="fas fa-image" style={{ fontSize: "32px" }} />
                      </div>
                    )}
                  </div>
                  <div className="stm-card-body">
                    <h3 className="stm-card-name">{product.name}</h3>
                    <p className="stm-card-desc">
                      {getFirstSentence(product.short_description) || getFirstSentence(product.description) || "Precision steam control for a personalized session."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================== */}
      {/* STEAM ACCESSORIES     */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="stm-group-head">
          <h2 className="stm-group-title">Steam Accessories</h2>
          <Link to={menuPaths.steam.accessories} className="stm-view-all">View All Accessories</Link>
        </div>
        <p className="stm-group-desc">
          Complete your steam room with SAWO's range of accessories — from steam doors and
          diffusing heads to aroma pumps and installation hardware — each engineered to work
          seamlessly with our generators and controls for a fully finished, professional
          installation.
        </p>
        {loading && <p style={{ textAlign: "center", color: "#999" }}>Loading accessories...</p>}
        {!loading && accessories.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>No steam accessories available yet.</p>
        )}
        {!loading && accessories.length > 0 && (
          <div className="stm-acc-grid">
            {accessories.map(product => (
              <Link to={`/products/${product.slug}`} key={product.id || product.slug} className="stm-acc-card">
                <div className="stm-acc-img-wrap">
                  {getImageUrl(product, "thumbnail") ? (
                    <img src={getImageUrl(product, "thumbnail")} alt={product.name} className="stm-acc-img" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ccc" }}>
                      <i className="fas fa-image" style={{ fontSize: "32px" }} />
                    </div>
                  )}
                </div>
                <h3 className="stm-acc-title">{product.name}</h3>
                <p className="stm-acc-desc">
                  {getFirstSentence(product.short_description) || getFirstSentence(product.description) || "SAWO steam accessory for a complete installation."}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===================== */}
      {/* CTA                   */}
      {/* ===================== */}
      <PageCTA
        title="Need Help Choosing?"
        description="From generators and controls to accessories, our team can help you find the right steam sauna setup for your home or commercial space."
      />

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`

        /* --- Hero --- */
        .stm-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .stm-hero-content {
          position: relative;
          z-index: 1;
        }
        .stm-brochure-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 12px 34px;
          border: 2px solid #ffffff;
          color: #ffffff;
          background: transparent;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
        }
        .stm-brochure-btn:hover {
          background: #ffffff;
          color: #AA8161;
        }
        .stm-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .stm-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }

        /* --- Intro --- */
        .stm-intro-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #444;
          line-height: 1.85;
          max-width: 880px;
          margin: 0 auto;
          text-align: center;
        }

        /* --- Group heads --- */
        .stm-group-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-bottom: 12px;
          border-bottom: 2px solid #e8d9cc;
          margin-bottom: 16px;
        }
        .stm-group-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #AA8161;
          margin: 0;
        }
        .stm-view-all {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #AA8161;
          text-decoration: none;
          white-space: nowrap;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }
        .stm-view-all:hover {
          border-color: #AA8161;
        }
        .stm-group-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 400;
          color: #555;
          line-height: 1.8;
          max-width: 820px;
          margin: 0 0 36px;
        }

        /* --- Generator card grid --- */
        .stm-gen-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stm-gen-card {
          display: flex;
          flex-direction: column;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #ede5db;
          background: #fff;
          text-decoration: none;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .stm-gen-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 32px rgba(170,129,97,0.15);
        }
        .stm-gen-img-wrap {
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: hidden;
        }
        .stm-gen-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          transition: transform 0.4s ease;
        }
        .stm-gen-card:hover .stm-gen-img {
          transform: scale(1.06);
        }
        .stm-gen-body {
          padding: 16px 18px 20px;
          border-top: 1px solid #ede5db;
        }
        .stm-gen-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .stm-gen-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.7;
          margin: 0;
        }

        /* --- Controls section --- */
        .stm-alt-section {
          background: transparent;
        }
        .stm-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .stm-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #ede5db;
          text-decoration: none;
          display: block;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .stm-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 36px rgba(170,129,97,0.15);
        }
        .stm-card-img-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          height: 180px;
          overflow: hidden;
        }
        .stm-card-img {
          max-height: 140px;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }
        .stm-card:hover .stm-card-img {
          transform: scale(1.08);
        }
        .stm-card-body {
          padding: 20px 22px 24px;
        }
        .stm-card-sub {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: #AA8161;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .stm-card-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 10px;
        }
        .stm-card-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.88rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.7;
          margin: 0;
        }

        /* --- Accessories grid --- */
        .stm-acc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .stm-acc-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 20px;
          border-radius: 16px;
          border: 1px solid #ede5db;
          background: #ffffff;
          text-decoration: none;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .stm-acc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 36px rgba(170,129,97,0.15);
        }
        .stm-acc-img-wrap {
          width: 100%;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .stm-acc-img {
          max-height: 120px;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }
        .stm-acc-card:hover .stm-acc-img {
          transform: scale(1.08);
        }
        .stm-acc-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 10px;
        }
        .stm-acc-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.88rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.7;
          margin: 0;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .stm-hero-title { font-size: 28px; line-height: 36px; }
          .stm-hero-subtitle { font-size: 16px; line-height: 28px; }
          .stm-gen-grid { grid-template-columns: repeat(2, 1fr); }
          .stm-cards-grid { grid-template-columns: 1fr; }
          .stm-acc-grid { grid-template-columns: repeat(2, 1fr); }
          .stm-group-title { font-size: 1.4rem; }
          .stm-intro-text { font-size: 0.95rem; }
        }
        @media (max-width: 480px) {
          .stm-gen-grid { grid-template-columns: 1fr; }
          .stm-acc-grid { grid-template-columns: 1fr; }
        }
      `}</style>

    </div>
  );
};

export default Steam;
