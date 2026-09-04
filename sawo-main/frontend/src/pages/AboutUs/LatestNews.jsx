// LatestNews.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

// Image imports
import LNhero from "../../assets/About/Latest News/LNhero.webp";
import LN1 from "../../assets/About/Latest News/LN1.webp";
import LN3 from "../../assets/About/Latest News/LN3.webp";
import LN4 from "../../assets/About/Latest News/LN4.webp";
import AquanaleLogo from "../../assets/About/Latest News/Aquanale-logo.webp";
import PiscinaLogo from "../../assets/About/Latest News/piscina-logo.webp";

const LatestNews = () => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const t = useLocaleT("news");
  const localize = useLocalizedPath();

  return (
    <div className="relative">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path={localize("/about/news")}
        hreflangAlternates={{ en: "/about/news", zh: "/zh/about/news" }}
      />
      <style>{`

        /* ── BASE ── */
        .ln-wrapper * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .ln-wrapper {
          font-family: 'Montserrat', sans-serif;
          color: #333;
          background: #fff;
        }

        /* ── HERO ── */
        .ln-hero {
          min-height: 95vh;
          background-color: #241c17; /* warm-dark placeholder so it doesn't flash gray before the hero <img> loads */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .ln-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .ln-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.42);
        }
        .ln-hero h1 {
          position: relative;
          z-index: 2;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          font-weight: 700;
          line-height: 45px;
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        .ln-hero p {
          position: relative;
          z-index: 2;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 22px;
          line-height: 40px;
          margin-top: 16px;
          opacity: 0.92;
        }

        /* ── SHARED CONTAINER ── */
        .ln-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        /* ── SECTION HEADING (matches heater pages style) ── */
        .ln-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #AF8564;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .ln-section-title span {
          font-weight: 700;
          color: #AF8564;
        }
        .ln-section-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #141617;
          margin-bottom: 20px;
        }

        /* ── NEWS ROW ── */
        .ln-news-row {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 48px;
          align-items: center;
        }
        .ln-news-img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 8px;
          display: block;
          box-shadow: 0 15px 40px rgba(139, 94, 60, 0.18);
          transition: all 0.4s ease;
        }
        .ln-news-img:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(139, 94, 60, 0.28);
        }

        /* ── CUSTOMIZABLE LOGO BAR IMAGES ── */
        /* AQUANALE Logo - Customize here */
        .ln-logo-bar .aquanale-logo {
          height: 200px !important;  /* ← Change this value to adjust logo height */
          width: auto !important;
          object-fit: contain !important;
        }
        /* PISCINA Logo - Customize here */
        .ln-logo-bar .piscina-logo {
          height: 130px !important;  /* ← Change this value to adjust logo height */
          width: auto !important;
          object-fit: contain !important;
        }

        /* ── BODY TEXT ── */
        .ln-body {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 300;
          color: #141617;
          line-height: 1.75;
          letter-spacing: 0.2px;
        }
        .ln-body p {
          margin-bottom: 12px;
        }
        .ln-body p:last-child {
          margin-bottom: 0;
        }

        /* ── EVENT DATE LABEL ── */
        .ln-event-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: #AF8564;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 2px;
          display: block;
        }
        .ln-event-info {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 300;
          color: #777;
          margin-bottom: 16px;
          letter-spacing: 0.2px;
        }

        /* ── DIVIDER ── */
        .ln-divider {
          border: none;
          border-top: 1px solid #ede5db;
          margin: 0 20px;
        }

        /* ── LOGO BAR ── */
        .ln-logo-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 36px 20px;
          border-top: 1px solid #ede5db;
          border-bottom: 1px solid #ede5db;
        }
        .ln-logo-bar img {
          height: 52px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          filter: saturate(0.85);
          transition: filter 0.25s, transform 0.25s;
        }
        .ln-logo-bar img:hover {
          filter: saturate(1.5);
          transform: scale(1.05);
        }


        /* ── ITALIC / BOLD ── */
        .ln-italic { font-style: italic; }
        .ln-bold   { font-weight: 700; color: #222; }

        /* ── CLOSING CTA BANNER ── */
        .ln-cta-banner {
          background: linear-gradient(135deg, #AF8564 0%, #c4a077 100%);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(175, 133, 100, 0.35);
          transition: all 0.4s ease;
        }
        .ln-cta-banner:hover {
          box-shadow: 0 25px 70px rgba(175, 133, 100, 0.45);
          transform: translateY(-5px);
        }
        .ln-cta-icon {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          transition: all 0.4s ease;
        }
        .ln-cta-banner:hover .ln-cta-icon {
          transform: scale(1.12) rotate(8deg);
        }
        .ln-cta-icon i {
          font-size: 2rem;
          color: #AF8564;
        }
        .ln-cta-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #fff;
          max-width: 700px;
          margin: 0 auto 24px;
        }

        /* On the brown gradient banner, the shared white CTA button's usual
           hover (fills brown) reads as invisible — override to a ghost
           treatment (transparent + white border/text) for this instance only. */
        .ln-cta-btn-wrap .sawo-vb-btn:hover,
        .ln-cta-btn-wrap .sawo-vb-btn.sawo-vb-active {
          background: transparent !important;
          color: #fff !important;
          border: 2px solid #fff !important;
          box-shadow: none !important;
        }

        /* ── CUSTOM BUTTONS ── */
        .ln-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 14px 36px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: inline-block;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .ln-btn-brown {
          background-color: #AF8564;
          color: #fff;
        }
        .ln-btn-brown:hover {
          background-color: #8b5e3c;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(175, 133, 100, 0.3);
        }
        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .ln-news-row {
            grid-template-columns: 1fr;
          }
          .ln-news-img {
            height: 240px;
            order: -1;
          }
          .ln-section-title {
            font-size: 1.9rem;
          }
          .ln-hero h1 {
            font-size: 28px !important;
            line-height: 32px !important;
          }
          .ln-hero p {
            font-size: 16px !important;
            line-height: 28px !important;
          }
          /* Stacked, not shrunk: side-by-side left both logos tiny to fit
             the row in one line. Standing them one above the other means
             each can stay a normal, legible size — neither is fighting the
             other for horizontal room anymore. Container padding is cut
             down too — the base 36px/20px was sized for the wide two-up
             row and just read as dead space once stacked, making the logos
             look smaller than they are. */
          .ln-logo-bar {
            flex-direction: column;
            gap: 24px;
            padding: 20px 16px;
          }
          .ln-logo-bar img {
            height: 56px;
          }
          /* The base rules above carry !important + an extra class, so they
             outrank the generic ".ln-logo-bar img" rule regardless of media
             query order — these two logos stayed full-size (200px/130px
             tall, correspondingly very wide) on every mobile width. Matching
             specificity + !important here is required to actually win. */
          .ln-logo-bar .aquanale-logo {
            height: 120px !important;
          }
          .ln-logo-bar .piscina-logo {
            height: 82px !important;
          }
          .ln-container {
            padding: 40px 20px;
          }
          .ln-cta-banner {
            padding: 30px 20px;
          }
        }
      `}</style>

      <div className="ln-wrapper">

        {/* ════════════════════════════
             HERO
        ════════════════════════════ */}
        <section className="ln-hero">
          <img
            src={LNhero}
            alt={t("hero.alt")}
            className="ln-hero-img"
            onLoad={() => setHeroLoaded(true)}
            onError={() => setHeroLoaded(true)}
            style={{ opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}
          />
          <div className="ln-hero-overlay" />
          <h1>{t("hero.title")}</h1>
          <p>{t("hero.subtitle")}</p>
          <HeroWave />
        </section>

        {/* ════════════════════════════
             SECTION 1 — Recent Exhibitions
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>{t("exhibitions.eyebrow")}</span>
              <h2 className="ln-section-title">
                <span>{t("exhibitions.titleSpan")}</span>
              </h2>
              <p className="ln-section-subtitle">{t("exhibitions.subtitle")}</p>

              <div className="ln-body">
                <p>
                  {t("exhibitions.p1")}
                </p>

                <span className="ln-event-label" style={{ marginTop: "16px" }}>{t("exhibitions.aquanaleLabel")}</span>
                <p className="ln-event-info">
                  {t("exhibitions.aquanaleInfo")}
                </p>

                <span className="ln-event-label">{t("exhibitions.piscinaLabel")}</span>
                <p className="ln-event-info">
                  {t("exhibitions.piscinaInfo")}
                </p>

                <p>
                  {t("exhibitions.p2")}
                </p>
                <p>
                  {t("exhibitions.p3")}
                </p>
                <p>
                  {t("exhibitions.p4")}
                </p>
                <p>
                  {t("exhibitions.p5")}
                </p>
                <p className="ln-italic ln-bold">{t("exhibitions.closing")}</p>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN1} alt={t("exhibitions.imgAlt")} className="ln-news-img" />
          </div>
        </div>

        {/* ── Partner Logo Bar ── */}
        <div className="ln-logo-bar">
          <img src={AquanaleLogo} alt={t("exhibitions.aquanaleLogoAlt")} className="aquanale-logo" />
          <img src={PiscinaLogo} alt={t("exhibitions.piscinaLogoAlt")} className="piscina-logo" />
        </div>

        <hr className="ln-divider" />

        {/* ════════════════════════════
             SECTION 3 — Talent Search
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>{t("talent.eyebrow")}</span>
              <h2 className="ln-section-title">
                <span>{t("talent.titleSpan")}</span>
              </h2>
              <p className="ln-section-subtitle">{t("talent.subtitle")}</p>

              <div className="ln-body">
                <p>
                  {t("talent.p1")}
                </p>
                <p>
                  {t("talent.p2")}
                </p>
                <p className="ln-bold ln-italic">
                  {t("talent.closing")}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                <Link to={localize(menuPaths.careers)} className="ln-btn ln-btn-brown">{t("talent.cta")}</Link>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN3} alt={t("talent.imgAlt")} className="ln-news-img" />
          </div>
        </div>

        <hr className="ln-divider" />

        {/* ════════════════════════════
             SECTION 4 — Earthquake Relief
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>{t("earthquake.eyebrow")}</span>
              <h2 className="ln-section-title">
                {t("earthquake.titlePrefix")} <span>{t("earthquake.titleSpan")}</span>
              </h2>
              <p className="ln-section-subtitle">{t("earthquake.subtitle")}</p>

              <div className="ln-body">
                <p>{t("earthquake.p1")}</p>
                <p>
                  {t("earthquake.p2")}
                </p>
                <p>
                  {t("earthquake.p3")}
                </p>
                <p>
                  {t("earthquake.p4")}
                </p>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN4} alt={t("earthquake.imgAlt")} className="ln-news-img" />
          </div>
        </div>

        {/* ════════════════════════════
             CLOSING CTA BANNER
             (mirrors unique-wellbeing-cta from Sustainability)
        ════════════════════════════ */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 60px" }}>
          <div className="ln-cta-banner">
            <div className="ln-cta-icon">
              <i className="fas fa-comments"></i>
            </div>
            <p className="ln-cta-text">
              {t("cta.text")}
            </p>
            <div className="ln-cta-btn-wrap" style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
              <BrochureDropdownButton text={t("cta.btn")} href={localize(menuPaths.contact)} redirect />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LatestNews;