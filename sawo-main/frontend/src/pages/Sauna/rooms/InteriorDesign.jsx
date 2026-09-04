// InteriorDesign.jsx

import React from "react";
import heroBg from "../../../assets/Sauna/Sauna Rooms/Interior Designs/hero.webp";
import classicBench from "../../../assets/Sauna/Sauna Rooms/Interior Designs/classic-bench.webp";
import waveBench from "../../../assets/Sauna/Sauna Rooms/Interior Designs/wave-bench.webp";
import pianoBench from "../../../assets/Sauna/Sauna Rooms/Interior Designs/piano-bench.webp";
import HeroWave from "../../../components/HeroWave";
import SEO from "../../../components/SEO";
import { useHeroLoaded } from "../../../utils/useHeroLoaded";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

const InteriorDesign = () => {
  const heroLoaded = useHeroLoaded(heroBg);
  const t = useLocaleT("sauna");
  const localize = useLocalizedPath();

  const designs = [
    {
      img: classicBench,
      title: t("interiorDesignsPage.designs.classicBench.title"),
      subtitle: t("interiorDesignsPage.designs.classicBench.subtitle"),
      desc: t("interiorDesignsPage.designs.classicBench.desc"),
    },
    {
      img: waveBench,
      title: t("interiorDesignsPage.designs.waveBench.title"),
      subtitle: t("interiorDesignsPage.designs.waveBench.subtitle"),
      desc: t("interiorDesignsPage.designs.waveBench.desc"),
    },
    {
      img: pianoBench,
      title: t("interiorDesignsPage.designs.pianoBench.title"),
      subtitle: t("interiorDesignsPage.designs.pianoBench.subtitle"),
      desc: t("interiorDesignsPage.designs.pianoBench.desc"),
    },
  ];

  return (
    <div className="relative">
      <SEO
        title={t("interiorDesignsPage.meta.title")}
        description={t("interiorDesignsPage.meta.description")}
        path={localize("/sauna/rooms/interior-designs")}
        hreflangAlternates={{ en: "/sauna/rooms/interior-designs", zh: "/zh/sauna/rooms/interior-designs" }}
      />

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="id-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
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
        <div className="id-hero-overlay" />
        <div className="id-hero-content">
          <h1 className="id-hero-title">{t("interiorDesignsPage.hero.title")}</h1>
          <p className="id-hero-subtitle">
            {t("interiorDesignsPage.hero.subtitle")}
          </p>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* SECTION 1: INTRO      */}
      {/* ===================== */}
      <section className="id-intro-section max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="id-section-title">
            {t("interiorDesignsPage.intro.title")}
          </h2>
          <p className="id-section-desc">
            {t("interiorDesignsPage.intro.desc")}
          </p>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 2: DESIGNS    */}
      {/* ===================== */}
      <section className="id-designs-section max-w-[1200px] mx-auto px-6 pb-24">
        <div className="id-designs-grid">
          {designs.map((design, i) => (
            <div
              className={`id-design-row ${i % 2 === 1 ? "id-design-row--reverse" : ""}`}
              key={i}
            >
              {/* Image */}
              <div className="id-design-image-wrap">
                <img
                  src={design.img}
                  alt={design.title}
                  className="id-design-image"
                />
              </div>

              {/* Text */}
              <div className="id-design-text">
                <p className="id-design-eyebrow">{design.subtitle}</p>
                <h3 className="id-design-title">{design.title}</h3>
                <p className="id-design-desc">{design.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 3: MATERIALS  */}
      {/* ===================== */}
      <section className="id-materials-section relative w-full py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="text-center"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "2.2rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #fff 0%, #f5f5f5 50%, #e8e8e8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "32px",
              lineHeight: 1.2,
            }}
          >
            {t("interiorDesignsPage.materials.heading")}
          </h2>

          <div className="id-materials-grid">
            <div className="id-material-card">
              <div className="id-material-icon"><i className="fas fa-tree"></i></div>
              <h3>{t("interiorDesignsPage.materials.cedar.title")}</h3>
              <p>
                {t("interiorDesignsPage.materials.cedar.desc")}
              </p>
            </div>
            <div className="id-material-card">
              <div className="id-material-icon"><i className="fas fa-leaf"></i></div>
              <h3>{t("interiorDesignsPage.materials.aspen.title")}</h3>
              <p>
                {t("interiorDesignsPage.materials.aspen.desc")}
              </p>
            </div>
            <div className="id-material-card">
              <div className="id-material-icon"><i className="fas fa-seedling"></i></div>
              <h3>{t("interiorDesignsPage.materials.spruce.title")}</h3>
              <p>
                {t("interiorDesignsPage.materials.spruce.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`

        /* --- Hero --- */
        .id-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .id-hero-content {
          position: relative;
          z-index: 1;
        }
        .id-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .id-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }

        /* --- Intro --- */
        .id-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        .id-section-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
          max-width: 820px;
          margin: 0 auto;
        }

        /* --- Design Rows --- */
        .id-designs-grid {
          display: flex;
          flex-direction: column;
          gap: 80px;
        }
        .id-design-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .id-design-row--reverse {
          direction: rtl;
        }
        .id-design-row--reverse > * {
          direction: ltr;
        }
        .id-design-image-wrap {
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .id-design-image-wrap:hover {
          transform: none;
          box-shadow: none;
        }
        .id-design-image {
          width: 100%;
          height: 380px;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }
        .id-design-image-wrap:hover .id-design-image {
          transform: scale(1.06);
        }
        .id-design-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: #AA8161;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .id-design-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 14px;
          line-height: 1.2;
        }
        .id-design-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.98rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
        }

        /* --- Materials Section --- */
        .id-materials-section {
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        }
        .id-materials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .id-material-card {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 32px 26px;
          text-align: center;
          transition: all 0.4s ease;
        }
        .id-material-card:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.15);
        }
        .id-material-icon {
          width: 64px;
          height: 64px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          transition: transform 0.3s ease;
        }
        .id-material-card:hover .id-material-icon {
          transform: rotate(8deg) scale(1.1);
        }
        .id-material-icon i {
          font-size: 1.8rem;
          color: #fff;
        }
        .id-material-card h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
        }
        .id-material-card p {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 300;
          color: rgba(255,255,255,0.9);
          line-height: 1.7;
          margin: 0;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .id-hero-title {
            font-size: 28px;
            line-height: 36px;
          }
          .id-hero-subtitle {
            font-size: 16px;
            line-height: 28px;
          }
          .id-section-title {
            font-size: 1.8rem;
          }
          .id-design-row {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .id-design-row--reverse {
            direction: ltr;
          }
          .id-design-row--reverse {
            direction: ltr;
          }
          .id-design-image {
            height: 260px;
          }
          .id-design-title {
            font-size: 1.6rem;
          }
          .id-materials-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 992px) and (min-width: 769px) {
          .id-materials-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default InteriorDesign;