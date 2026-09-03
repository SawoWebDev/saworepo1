// SaunaAccessories.jsx
// Landing page for "/sauna/accessories" — hero + category tiles that each
// link to a per-category page, plus a "View All Accessories" button that
// opens the full all-accessories catalog (/accessories).

import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import img_Signature_BL_v2_1_scaled from "../../assets/Signature-BL-v2-1-scaled.webp";
import img_Signature_D_v4_scaled from "../../assets/Signature-D-v4-scaled.webp";
import img_DRAGON_FIRE_PAIL_AND_LADDLE_SCENE_600x600_1 from "../../assets/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE-600x600-1.webp";
import img_TR_LIGHT_COVER_SCENE1_copy from "../../assets/TR-LIGHT-COVER_SCENE1-copy.webp";
import img_siro_bench from "../../assets/siro-bench.webp";
import img_R_500_D_Scene2 from "../../assets/R-500-D_Scene2.webp";
import img_Ventilation from "../../assets/Ventilation.webp";
import img_BoxType2_copy_new from "../../assets/BoxType2-copy-new.webp";
import img_sand_timer_copy_new from "../../assets/sand-timer-copy-new.webp";
import img_506_2_D from "../../assets/506-2-D.webp";
import img_DOORS_AND_HANDLES_copy from "../../assets/DOORS-AND-HANDLES-copy.webp";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

const SaunaAccessories = () => {
  const heroLoaded = useHeroLoaded(img_Signature_BL_v2_1_scaled);
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();

  return (
    <div className="relative">
      <SEO
        title={t("accessoriesPage.meta.title")}
        description={t("accessoriesPage.meta.description")}
        path="/sauna/accessories"
      />

      {/* ===================== */}
      {/* HERO SECTION          */}
      {/* ===================== */}
      <section
        className="sa-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }} // warm-dark placeholder so it doesn't flash gray before the hero image decodes
      >
        {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${img_Signature_BL_v2_1_scaled})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />
        <div className="sa-hero-overlay" />
        <div className="sa-hero-content">
          <h1 className="sa-hero-title">{t("accessoriesPage.hero.title")}</h1>
          <p className="sa-hero-subtitle">{t("accessoriesPage.hero.subtitle")}</p>
          <BrochureDropdownButton
            text={tc("viewBrochure")}
            items={[
              { label: t("accessoriesPage.brochureItems.kivistone"), href: "https://www.sawo.com/wp-content/uploads/2026/06/Kivistone-Brochure_-2026.pdf" },
              { label: t("accessoriesPage.brochureItems.saunaLights"), href: "https://www.sawo.com/wp-content/uploads/2026/07/Sauna-Lights_RV15.pdf" },
              { label: t("accessoriesPage.brochureItems.accessorySets"), href: "https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Accessory-Set-Brochure-2026.pdf" },
              { label: t("accessoriesPage.brochureItems.accessories"), href: "https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Sauna-Accessories-2026.pdf" },
              { label: t("accessoriesPage.brochureItems.curveLedLights"), href: "https://www.sawo.com/wp-content/uploads/2026/07/Curve-LED-Lights-Flyer-for-USA-EU-2026.pdf" },
              { label: t("accessoriesPage.brochureItems.saunaDoors"), href: "https://www.sawo.com/wp-content/uploads/2026/08/SAWO-Sauna-Doors-2026.pdf" },
            ]}
          />
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* SECTION 1: GRID       */}
      {/* ===================== */}
      <section className="sa-grid-section max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="sa-section-title">{t("accessoriesPage.sectionTitle")}</h2>

        <style>{`

          .custom-product-grid,
          .custom-product-grid * {
            font-family: 'Montserrat', sans-serif !important;
          }
          .custom-product-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin: 25px auto;
            max-width: 1200px;
          }
          .custom-product-grid .product {
            display: block;
            text-align: left;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 20px;
            background: #fff;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            color: inherit;
            text-decoration: none;
            text-transform: none;
          }
          .custom-product-grid .product:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.12), 0 0 20px rgba(166,120,83,0.15);
          }
          .custom-product-grid img {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 12px;
            transition: transform 0.3s ease;
          }
          .custom-product-grid .product:hover img {
            transform: scale(1.05);
          }
          .custom-product-grid h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 8px 0 6px;
            transition: color 0.3s ease;
            color: #141617;
            text-transform: none;
          }
          .custom-product-grid .product:hover h3 {
            color: #af8564;
          }
          .custom-product-grid p {
            font-size: 14px;
            color: #333333;
            line-height: 1.5;
            transition: color 0.3s ease;
            text-transform: none;
          }
          .sa-view-all-wrap {
            text-align: center;
            margin: 48px auto 0;
          }
          .sa-view-all-btn {
            display: inline-block;
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 1px;
            padding: 14px 40px;
            border: 2px solid #af8564;
            border-radius: 6px;
            color: #af8564;
            background: transparent;
            text-decoration: none;
            transition: all 0.3s ease;
          }
          .sa-view-all-btn:hover {
            background: #af8564;
            color: #ffffff;
          }
          @media (max-width: 1024px) {
            .custom-product-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .custom-product-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="custom-product-grid">

          <Link to={localize(menuPaths.sauna.accessories.accessorySets)} className="product">
            <img src={img_Signature_D_v4_scaled} alt="Accessory Sets" />
            <h3>{t("accessoriesPage.items.accessorySets.title")}</h3>
            <p>{t("accessoriesPage.items.accessorySets.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.pailsLadles)} className="product">
            <img src={img_DRAGON_FIRE_PAIL_AND_LADDLE_SCENE_600x600_1} alt="Pails and Ladles" />
            <h3>{t("accessoriesPage.items.pailsLadles.title")}</h3>
            <p>{t("accessoriesPage.items.pailsLadles.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.thermometers)} className="product">
            <img src={img_BoxType2_copy_new} alt="Thermometers and Combined meters" />
            <h3>{t("accessoriesPage.items.thermometers.title")}</h3>
            <p>{t("accessoriesPage.items.thermometers.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.clocksSandtimers)} className="product">
            <img src={img_sand_timer_copy_new} alt="Clocks and Sandtimers" />
            <h3>{t("accessoriesPage.items.clocksSandtimers.title")}</h3>
            <p>{t("accessoriesPage.items.clocksSandtimers.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.lightsCovers)} className="product">
            <img src={img_TR_LIGHT_COVER_SCENE1_copy} alt="Sauna Lights and Light Covers" />
            <h3>{t("accessoriesPage.items.lightsCovers.title")}</h3>
            <p>{t("accessoriesPage.items.lightsCovers.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.headrestsBackrests)} className="product">
            <img src={img_506_2_D} alt="Headrests and Backrests" />
            <h3>{t("accessoriesPage.items.headrestsBackrests.title")}</h3>
            <p>{t("accessoriesPage.items.headrestsBackrests.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.doorsHandles)} className="product">
            <img src={img_DOORS_AND_HANDLES_copy} alt="Doors and Handles" />
            <h3>{t("accessoriesPage.items.doorsHandles.title")}</h3>
            <p>{t("accessoriesPage.items.doorsHandles.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.benches)} className="product">
            <img src={img_siro_bench} alt="Benches" />
            <h3>{t("accessoriesPage.items.benches.title")}</h3>
            <p>{t("accessoriesPage.items.benches.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.kivistone)} className="product">
            <img src={img_R_500_D_Scene2} alt="Kivistone" />
            <h3>{t("accessoriesPage.items.kivistone.title")}</h3>
            <p>{t("accessoriesPage.items.kivistone.desc")}</p>
          </Link>

          <Link to={localize(menuPaths.sauna.accessories.ventilations)} className="product">
            <img src={img_Ventilation} alt="Ventilations and Miscellaneous Items" />
            <h3>{t("accessoriesPage.items.ventilations.title")}</h3>
            <p>{t("accessoriesPage.items.ventilations.desc")}</p>
          </Link>

        </div>

        {/* View all accessories → full catalog */}
        <div className="sa-view-all-wrap">
          <Link to={localize(menuPaths.accessories)} className="sa-view-all-btn">{t("accessoriesPage.viewAll")}</Link>
        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`

        .sa-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.38);
          z-index: 0;
        }
        .sa-hero-content {
          position: relative;
          z-index: 1;
        }
        .sa-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .sa-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }
        .sa-section-title {
          font-family: 'Montserrat', sans-serif;
          font-style: normal;
          font-weight: 400;
          color: rgb(175, 133, 100);
          font-size: 36px;
          margin-bottom: 8px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .sa-hero-title {
            font-size: 28px;
            line-height: 36px;
          }
          .sa-hero-subtitle {
            font-size: 16px;
            line-height: 28px;
          }
          .sa-section-title {
            font-size: 26px;
          }
        }
      `}</style>

    </div>
  );
};

export default SaunaAccessories;
