// Careers.jsx

import React, { useEffect } from "react";
import heroBg from "../../assets/Careers/Hero.webp";
import joinImg from "../../assets/Careers/Join-img.webp";
import heaterImg from "../../assets/Careers/Heater.webp";
import img1 from "../../assets/Careers/img1.webp";
import img2 from "../../assets/Careers/img2.webp";
import img3 from "../../assets/Careers/img3.webp";
import img4 from "../../assets/Careers/img4.webp";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

const Careers = () => {
  const heroLoaded = useHeroLoaded(heroBg);
  const t = useLocaleT("careers");
  const localize = useLocalizedPath();

  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <div className="relative">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path={localize("/careers")}
        hreflangAlternates={{ en: "/careers", zh: "/zh/careers" }}
      />
      {/* HERO */}
      <section
        className="min-h-[95vh] flex flex-col justify-end items-start text-left px-6 md:px-20 pb-20 md:pb-24 relative"
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

        {/* Dark scrim so the bottom-left text stays readable over any part
            of the photo, regardless of what's behind it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0) 100%)",
          }}
        />

        <h1
          className="text-white font-bold hero-title relative"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "45px",
            lineHeight: "1.2",
            maxWidth: "600px",
          }}
        >
          {t("hero.title")}
        </h1>

        <p
          className="text-white mt-4 hero-subtitle relative"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: "1.5",
            maxWidth: "600px",
          }}
        >
          {t("hero.subtitle")}
        </p>

        {/* Mobile font adjustments */}
        <style jsx>{`
          @media (max-width: 768px) {
            .hero-title {
              font-size: 28px !important;
            }
            .hero-subtitle {
              font-size: 16px !important;
            }
          }
        `}</style>
      <HeroWave />
      </section>

      {/* Section 1: Join SAWO - Two Column Layout */}
      <section className="join-section py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Column - Image */}
            <div className="join-image-wrapper">
              <img
                src={joinImg}
                alt={t("join.imgAlt")}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Right Column - Text Content */}
            <div className="join-content">
              <p
                className="join-highlight mb-4"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.5rem",
                  color: "#D32F2F",
                  fontWeight: 700,
                  lineHeight: "1.4",
                }}
              >
                {t("join.highlight")}
              </p>
              <p
                className="join-description mb-4"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1rem",
                  color: "#333",
                  lineHeight: "1.8",
                }}
              >
                {t("join.desc")}
              </p>
              <p
                className="join-cta"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1rem",
                  color: "#333",
                  lineHeight: "1.8",
                }}
              >
                {t("join.cta")}
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 768px) {
            .join-section .grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* Section 2: Two Column - Open Positions & We Are Hiring */}
      <section className="careers-main-section pt-6 pb-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* LEFT COLUMN - Open Positions */}
            <div className="open-positions-column open-positions-card">
              <h2
                className="mb-6"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {t("openPositions.heading")}
              </h2>
              <p
                className="mb-8"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: "1.6",
                }}
              >
                {t("openPositions.intro")}
              </p>

              <div className="positions-list space-y-4">
                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.electricalEngineer.title")}</h3>
                    <p>
                      {t("openPositions.positions.electricalEngineer.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.productionSupervisor.title")}</h3>
                    <p>
                      {t("openPositions.positions.productionSupervisor.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.marketingSpecialist.title")}</h3>
                    <p>
                      {t("openPositions.positions.marketingSpecialist.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.buyerLogistics.title")}</h3>
                    <p>
                      {t("openPositions.positions.buyerLogistics.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.processEngineer.title")}</h3>
                    <p>
                      {t("openPositions.positions.processEngineer.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.salesManager.title")}</h3>
                    <p>
                      {t("openPositions.positions.salesManager.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.odooDeveloper.title")}</h3>
                    <p>
                      {t("openPositions.positions.odooDeveloper.subtitle")} – {t("openPositions.locationCebu")} |{" "}
                      <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.salesManagerGerman.title")}</h3>
                    <p>{t("openPositions.positions.salesManagerGerman.subtitle")} – {t("openPositions.locationEurope")}</p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.headOfProduction.title")}</h3>
                    <p>
                      {t("openPositions.locationCebu")} | <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span> | {t("openPositions.positions.headOfProduction.years")}
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>{t("openPositions.positions.productionManager.title")}</h3>
                    <p>
                      {t("openPositions.locationCebu")} | <span className="badge-fulltime">{t("badges.fullTime")}</span> |{" "}
                      <span className="badge-onsite">{t("badges.onSite")}</span> | {t("openPositions.positions.productionManager.years")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - We Are Hiring */}
            <div className="hiring-column">
              <div className="hiring-box sticky-hiring-box">
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "#af8564",
                  }}
                >
                  {t("hiring.titlePrefix")} <span style={{ color: "#af8564" }}>{t("hiring.titleHighlight")}</span>
                </h2>
                <p
                  className="mb-6"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "0.95rem",
                    color: "#333",
                    lineHeight: "1.6",
                  }}
                >
                  {t("hiring.desc")}
                </p>

                <div className="hiring-details mb-6">
                  <div className="hiring-detail-item">
                    <i className="fas fa-envelope"></i>
                    <span>
                      {t("hiring.emailPrefix")}{" "}
                      <strong style={{ color: "#D32F2F" }}>
                        rekry@sawo.com
                      </strong>
                    </span>
                  </div>
                  <div className="hiring-detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>
                      {t("hiring.locationLabel")}
                      <br />
                      {t("hiring.locationAddress")}
                    </span>
                  </div>
                </div>

                <p
                  className="mb-8"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "1rem",
                    color: "#333",
                    fontWeight: 600,
                  }}
                >
                  {t("hiring.closing")}
                </p>

                {/* Category Images Grid */}
                <div className="hiring-categories grid grid-cols-2 gap-4">
                  <div className="category-card">
                    <img src={img1} alt={t("categories.manufacturing.alt")} />
                    <div className="category-overlay">
                      <h3>{t("categories.manufacturing.title")}</h3>
                      <p className="category-description">
                        {t("categories.manufacturing.desc")}
                      </p>
                    </div>
                  </div>
                  <div className="category-card">
                    <img src={img2} alt={t("categories.engineering.alt")} />
                    <div className="category-overlay">
                      <h3>{t("categories.engineering.title")}</h3>
                      <p className="category-description">
                        {t("categories.engineering.desc")}
                      </p>
                    </div>
                  </div>
                  <div className="category-card">
                    <img src={img3} alt={t("categories.sales.alt")} />
                    <div className="category-overlay">
                      <h3>{t("categories.sales.title")}</h3>
                      <p className="category-description">
                        {t("categories.sales.desc")}
                      </p>
                    </div>
                  </div>
                  <div className="category-card">
                    <img src={img4} alt={t("categories.operations.alt")} />
                    <div className="category-overlay">
                      <h3>{t("categories.operations.title")}</h3>
                      <p className="category-description">
                        {t("categories.operations.desc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx>{`
          .open-positions-card {
            background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
            border-radius: 16px;
            padding: 34px 32px;
            box-shadow: 0 10px 28px rgba(139,94,60,0.22);
          }
          .position-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255,255,255,0.22);
          }
          .position-item:last-child {
            border-bottom: none;
          }
          .position-icon-wrapper {
            width: 40px;
            height: 40px;
            background: rgba(255,255,255,0.14);
            border: 1.5px solid rgba(255,255,255,0.28);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .position-icon-wrapper i {
            font-size: 1.5rem;
            color: #ffffff;
          }
          .position-info h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 4px;
          }
          .position-info p {
            font-family: "Montserrat", sans-serif;
            font-size: 0.85rem;
            color: rgba(255,255,255,0.8);
            margin: 0;
          }
          .badge-fulltime,
          .badge-onsite {
            font-weight: 600;
            color: #ffffff;
          }
          .hiring-box {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 30px;
          }
          .sticky-hiring-box {
            position: sticky;
            top: 20px;
          }
          .hiring-detail-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            font-family: "Montserrat", sans-serif;
            font-size: 0.95rem;
            color: #333;
            line-height: 1.6;
          }
          .hiring-detail-item i {
            margin-top: 8px;
            color: #666;
          }
          .category-card {
            position: relative;
            aspect-ratio: 1 / 1;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .category-card:hover {
            transform: scale(1.03);
          }
          .category-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .category-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            top: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            background: rgba(0, 0, 0, 0.4);
            padding: 12px;
            transition: background 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .category-card:hover .category-overlay {
            background: rgba(0, 0, 0, 0.72);
          }
          .category-overlay h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            color: white;
            margin: 0;
            text-align: center;
          }
          .category-description {
            font-family: "Montserrat", sans-serif;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            text-align: center;
            line-height: 1.4;
            max-height: 0;
            opacity: 0;
            transform: translateY(6px);
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.35s ease-out 0.05s,
              transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              margin-top 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .category-card:hover .category-description {
            max-height: 100px;
            margin-top: 8px;
            opacity: 1;
            transform: translateY(0);
          }
          @media (max-width: 768px) {
            .careers-main-section .grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* Section 3: Why Work for SAWO - Full Width */}
      <section className="why-sawo-section py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          {/* Image First */}
          <div className="why-image-wrapper mb-12 rounded-lg overflow-hidden shadow-lg">
            <img
              src={heaterImg}
              alt={t("whySawo.imgAlt")}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Title */}
          <h2
            className="mb-12 text-center"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "#af8564",
            }}
          >
            {t("whySawo.titlePrefix")} <span style={{ color: "#af8564" }}>{t("whySawo.titleHighlight")}</span>?
          </h2>

          {/* Benefits Cards */}
          <div className="why-benefits-list space-y-6">
            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-lightbulb"></i>
              </div>
              <div className="why-content">
                <h3>{t("whySawo.innovative.title")}</h3>
                <p>
                  {t("whySawo.innovative.prefix")}{" "}
                  <strong>{t("whySawo.innovative.highlight")}</strong>
                </p>
              </div>
            </div>

            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-globe"></i>
              </div>
              <div className="why-content">
                <h3>{t("whySawo.international.title")}</h3>
                <p>
                  {t("whySawo.international.prefix")}{" "}
                  <strong>{t("whySawo.international.highlight")}</strong>{" "}
                  {t("whySawo.international.suffix")}
                </p>
              </div>
            </div>

            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="why-content">
                <h3>{t("whySawo.growth.title")}</h3>
                <p>
                  {t("whySawo.growth.prefix")}{" "}
                  <strong>
                    {t("whySawo.growth.highlight")}
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-award"></i>
              </div>
              <div className="why-content">
                <h3>{t("whySawo.excellence.title")}</h3>
                <p>
                  {t("whySawo.excellence.prefix")}{" "}
                  <strong>{t("whySawo.excellence.highlight")}</strong>{t("whySawo.excellence.suffix")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx>{`
          .why-benefit-card {
            background: white;
            border-left: 4px solid #af8564;
            border-radius: 8px;
            padding: 25px;
            display: flex;
            align-items: flex-start;
            gap: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
          }
          .why-benefit-card:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }
          .why-icon-circle {
            width: 50px;
            height: 50px;
            background: #af8564;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .why-icon-circle i {
            font-size: 1.3rem;
            color: white;
          }
          .why-content h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            color: #000;
            margin-bottom: 8px;
          }
          .why-content p {
            font-family: "Montserrat", sans-serif;
            font-size: 0.95rem;
            color: #666;
            line-height: 1.6;
            margin: 0;
          }
          @media (max-width: 768px) {
            .why-benefit-card {
              flex-direction: column;
              text-align: center;
              align-items: center;
            }
          }
        `}</style>
      </section>

      {/* Styles required for leaves */}
      <style>{`
      `}</style>
    </div>
  );
};

export default Careers;