// Sauna.jsx

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import menuPaths from "../../menuPaths";
import img_INNOVA_CLASSIC_1000X1000 from "../../assets/INNOVA-CLASSIC-1000X1000.webp";
import img_SAWO_Finnish_Sauna_Room_Cedar_Cover_scaled from "../../assets/SAWO_Finnish_Sauna_Room_Cedar_Cover-scaled.webp";
import img_TOWER_SERIES_2_600x360_1 from "../../assets/TOWER-SERIES-2-600x360-1.webp";
import img_STONE_SERIES_3_600x320_new from "../../assets/STONE-SERIES-3-600x320-new-.webp";
import img_WALL_MOUNTED_SERIES_v2_1 from "../../assets/WALL-MOUNTED-SERIES-v2-1.webp";
import img_FLOOR_MOUNTED_SERIES1_1024x614_1 from "../../assets/FLOOR-MOUNTED-SERIES1-1024x614-1.webp";
import img_DRAGON_SERIES_1_600x360_1 from "../../assets/DRAGON-SERIES-1-600x360-1.webp";
import img_COMBI_SERIES_600x360_1 from "../../assets/COMBI-SERIES-600x360-1.webp";
import img_DRAGON_FIRE_PAIL_AND_LADDLE_SCENE_600x600_1 from "../../assets/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE-600x600-1.webp";
import img_Signature_D_v4_scaled from "../../assets/Signature-D-v4-scaled.webp";
import img_siro_bench from "../../assets/siro-bench.webp";
import img_R_500_D_Scene2 from "../../assets/R-500-D_Scene2.webp";
import img_Ventilation from "../../assets/Ventilation.webp";
import img_Innova_Classic_2_0 from "../../assets/Innova-Classic-2.0.webp";
import img_saunova_2_0_user_interface from "../../assets/saunova-2.0_user-interface.webp";
import img_BoxType2_copy_new from "../../assets/BoxType2-copy-new.webp";
import img_sand_timer_copy_new from "../../assets/sand-timer-copy-new.webp";
import img_917_D_Display_new from "../../assets/917-D_Display_new-.webp";
import img_506_2_D from "../../assets/506-2-D.webp";
import img_DOORS_AND_HANDLES_copy from "../../assets/DOORS-AND-HANDLES-copy.webp";
import HeroWave from "../../components/HeroWave";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import SEO from "../../components/SEO";
import { useLocale, useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";
import { controlsPath } from "../../utils/anchoredLinks";
import PageCTA from "../../components/PageCTA";

// Import hero background - update path as needed
// import heroBg from "assets/Sauna/Sauna-hero.webp";

const Sauna = () => {
  const locale = useLocale();
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();
  const path = locale === "en" ? "/sauna" : `/${locale}/sauna`;
  const heroLoaded = useHeroLoaded(img_SAWO_Finnish_Sauna_Room_Cedar_Cover_scaled);

  useEffect(() => {
    // Inject Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const faLink = document.createElement("link");
      faLink.rel = "stylesheet";
      faLink.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(faLink);
    }

    // ==============================
    // SAUNA CARDS CAROUSEL SCRIPT
    // ==============================
    const initCards = () => {
      const cards = document.querySelectorAll(".sauna-card-unique");
      if (!cards.length) return;

      const isDesktop = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches;

      if (isDesktop) {
        cards.forEach((card) => {
          card.addEventListener("mouseenter", () => {
            cards.forEach((c) => c !== card && c.classList.remove("active"));
            card.classList.add("active");
          });
          card.addEventListener("mouseleave", () => {
            card.classList.remove("active");
          });
        });
      } else {
        cards.forEach((card) => {
          const closeBtn = card.querySelector(".sauna-card-unique-close");
          card.addEventListener("click", function (e) {
            if (e.target.closest(".sauna-card-unique-close")) return;
            cards.forEach((c) => c !== card && c.classList.remove("active"));
            card.classList.toggle("active");
          });
          if (closeBtn) {
            closeBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              card.classList.remove("active");
            });
          }
        });
        document.addEventListener("click", function (e) {
          if (!e.target.closest(".sauna-card-unique")) {
            cards.forEach((card) => card.classList.remove("active"));
          }
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initCards, 100);
    return () => clearTimeout(timer);
  }, []);

  // Shared across every page that uses this widget (Home, Sauna, Infrared)
  // — lives in common.json, not this page's own file.
  const BENEFIT_ICONS = {
    stressRelief: "fas fa-spa", heartHealth: "fas fa-heartbeat", respiratoryRelief: "fas fa-lungs",
    muscleRecovery: "fas fa-dumbbell", betterSleep: "fas fa-bed", diseasePrevention: "fas fa-heart",
    skinDetox: "fas fa-droplet", collagenBoost: "fas fa-wand-magic-sparkles", skinHydration: "fas fa-hand-holding-droplet",
    immuneSupport: "fas fa-shield-alt", metabolismBoost: "fas fa-fire", mentalWellness: "fas fa-smile",
  };
  const benefitCards = Object.keys(BENEFIT_ICONS).map((key) => ({
    icon: BENEFIT_ICONS[key],
    label: tc(`wellnessBenefits.${key}.label`),
    desc: tc(`wellnessBenefits.${key}.desc`),
  }));

  const controlCards = [
    {
      img: img_Innova_Classic_2_0,
      title: t("controls.items.innova.title"),
      href: controlsPath("innova"),
      desc: t("controls.items.innova.desc"),
    },
    {
      img: img_saunova_2_0_user_interface,
      title: t("controls.items.saunova.title"),
      href: controlsPath("saunova"),
      desc: t("controls.items.saunova.desc"),
    },
    {
      img: img_INNOVA_CLASSIC_1000X1000,
      title: t("controls.items.accessories.title"),
      href: controlsPath("accessories"),
      desc: t("controls.items.accessories.desc"),
    },
  ];

  return (
    <div className="relative">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path={path}
        // German isn't translated for this page yet — only list locales
        // that actually have real Sauna copy (see SEO.jsx's prop comment
        // and README-i18n.md). Add "de" here once its translation lands.
        hreflangAlternates={{ en: "/sauna", fi: "/fi/sauna" }}
      />
      {/* ===================== */}
      {/* HERO SECTION          */}
      {/* ===================== */}
      <section
        className="sauna-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }} // warm-dark placeholder, visible until the hero photo is fully loaded
      >
        {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${img_SAWO_Finnish_Sauna_Room_Cedar_Cover_scaled})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.38)",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          <h1
            className="text-white font-bold hero-title"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "40px",
              lineHeight: "52px",
              fontWeight: 700,
            }}
          >
            {t("hero.heading")}
          </h1>

          <p
            className="text-white mt-4 hero-subtitle"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              fontSize: "22px",
              lineHeight: "38px",
              maxWidth: "900px",
              margin: "16px auto 0",
            }}
          >
            {t("hero.subtitle")}
          </p>

          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text={t("hero.catalogueButton")}
              href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf"
            />
          </div>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* SECTION 1: HEATERS    */}
      {/* ===================== */}
      <section className="sauna-heaters-section max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "#af8564",
              fontSize: "36px",
              marginBottom: "16px",
            }}
          >
            {t("heaters.heading")}
          </h2>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "rgb(20, 22, 23)",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "780px",
              margin: "0 auto",
            }}
            // heaters.intro contains a literal <strong> tag (see sauna.json /
            // README-i18n.md's marker-preservation note) — this is our own
            // controlled catalog content, not user input.
            dangerouslySetInnerHTML={{ __html: t("heaters.intro") }}
          />
        </div>

        {/* Heaters Grid - sawo-sec */}
        <style>{`
          body { margin: 0; overflow-x: hidden; }

          .sawo-sec .sawo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            width: 100%;
            margin: 0 auto;
            gap: 30px;
            font-family: 'Montserrat', sans-serif;
            padding: 20px;
          }
          .sawo-sec .sawo-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: left;
            overflow: hidden;
          }
          .sawo-sec .sawo-card img {
            width: 100%;
            height: auto;
            transition: transform .5s ease;
            border-radius: 6px;
          }
          .sawo-sec .sawo-card:hover img { transform: scale(1.05); }
          .sawo-sec .sawo-title {
            font-size: 23px;
            font-weight: 400;
            line-height: 1;
            color: #141617;
            margin: 15px 0 10px;
            align-self: flex-start;
          }
          .sawo-sec .sawo-caption {
            font-size: 14px;
            font-weight: 400;
            line-height: 1.3;
            color: #141617;
            margin-bottom: 15px;
            align-self: flex-start;
          }
          .sawo-sec .sawo-center {
            display: flex;
            justify-content: center;
            margin-top: 10px;
          }
          .sawo-sec .sawo-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: #333;
            text-decoration: none;
            transition: color .3s ease;
          }
          .sawo-sec .sawo-link:hover { color: #af8564; }
          .sawo-sec .sawo-icon { transition: transform .3s ease; }
          .sawo-sec .sawo-link:hover .sawo-icon { transform: translateX(3px); }

          @media (min-width: 1280px) {
            .sawo-sec.heaters .sawo-grid { grid-template-columns: repeat(2, 1fr); }
            .sawo-sec.controls .sawo-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 480px) {
            .sawo-sec .sawo-grid { padding: 0 10px; }
          }
        `}</style>

        <div className="sawo-sec heaters">
          <div className="sawo-grid">
            <div className="sawo-card">
              <a href={localize(menuPaths.sauna.heaters.tower)}>
                <img src={img_TOWER_SERIES_2_600x360_1} alt={t("heaters.items.tower.title")} />
              </a>
              <div className="sawo-title">{t("heaters.items.tower.title")}</div>
              <div className="sawo-caption">{t("heaters.items.tower.caption")}</div>
            </div>
            <div className="sawo-card">
              <a href={localize(menuPaths.sauna.heaters.stone)}>
                <img src={img_STONE_SERIES_3_600x320_new} alt={t("heaters.items.stone.title")} />
              </a>
              <div className="sawo-title">{t("heaters.items.stone.title")}</div>
              <div className="sawo-caption">{t("heaters.items.stone.caption")}</div>
            </div>
            <div className="sawo-card">
              <a href={localize(menuPaths.sauna.heaters.wallMounted)}>
                <img src={img_WALL_MOUNTED_SERIES_v2_1} alt={t("heaters.items.wallMounted.title")} />
              </a>
              <div className="sawo-title">{t("heaters.items.wallMounted.title")}</div>
              <div className="sawo-caption">{t("heaters.items.wallMounted.caption")}</div>
            </div>
            <div className="sawo-card">
              <a href={localize(menuPaths.sauna.heaters.floor)}>
                <img src={img_FLOOR_MOUNTED_SERIES1_1024x614_1} alt={t("heaters.items.floor.title")} />
              </a>
              <div className="sawo-title">{t("heaters.items.floor.title")}</div>
              <div className="sawo-caption">{t("heaters.items.floor.caption")}</div>
            </div>
            <div className="sawo-card">
              <a href={localize(menuPaths.sauna.heaters.dragonfire)}>
                <img src={img_DRAGON_SERIES_1_600x360_1} alt={t("heaters.items.dragonfire.title")} />
              </a>
              <div className="sawo-title">{t("heaters.items.dragonfire.title")}</div>
              <div className="sawo-caption">{t("heaters.items.dragonfire.caption")}</div>
            </div>
            <div className="sawo-card">
              <a href={localize(menuPaths.sauna.heaters.combi)}>
                <img src={img_COMBI_SERIES_600x360_1} alt={t("heaters.items.combi.title")} />
              </a>
              <div className="sawo-title">{t("heaters.items.combi.title")}</div>
              <div className="sawo-caption">{t("heaters.items.combi.caption")}</div>
            </div>
          </div>
        </div>

        <div className="sauna-view-all-wrap">
          <Link to={localize(menuPaths.heaters)} className="sauna-view-all-btn">{t("heaters.viewAll")}</Link>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 2: BENEFITS   */}
      {/* ===================== */}
      <section
        className="sauna-benefits-section relative w-full py-6"
        style={{ background: "#AF8564" }}
      >
        <style>{`
          *{ box-sizing: border-box; }
          .sauna-card-unique-section { max-width: 100%; margin: 0 auto; overflow: hidden; padding: 0; }
          .sauna-carousel-wrapper { position: relative; overflow: hidden; }
          .sauna-card-unique-grid {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            animation: scroll-carousel 60s linear infinite;
            width: max-content;
          }
          .sauna-carousel-wrapper:hover .sauna-card-unique-grid { animation-play-state: paused; }

          @keyframes scroll-carousel {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .sauna-card-unique {
            background: #fff;
            border-radius: 20px;
            width: 250px;
            min-width: 250px;
            height: 250px;
            aspect-ratio: 1/1;
            flex-shrink: 0;
            text-align: center;
            transition: height .4s ease, box-shadow .4s ease, border-color .4s ease, color .4s ease;
            position: relative;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px 16px;
            border: 2px solid transparent;
            overflow: hidden;
            color: #af8564;
          }
          /* Grow to fit the description instead of clamping/truncating it —
             .sauna-card-unique-grid uses align-items:flex-start so this
             doesn't stretch the other cards in the row. */
          .sauna-card-unique.active {
            height: auto;
            min-height: 250px;
            aspect-ratio: auto;
            padding-bottom: 26px;
            box-shadow: 0 22px 50px rgba(139,94,60,.28);
            border-color: #c79a77;
            color: #9e7456;
          }
          .sauna-card-unique-content { display: flex; flex-direction: column; align-items: center; }
          .sauna-card-unique-icon {
            width: 76px; height: 76px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 25%, #e4c3a8 0%, #c79a77 35%, #af8564 65%, #9e7456 100%);
            display: flex; align-items: center; justify-content: center;
            transition: .45s cubic-bezier(.68,-.55,.265,1.55), width .3s ease, height .3s ease;
          }
          .sauna-card-unique-icon i { font-size: 2rem; color: #fff; transition: .4s ease; }
          .sauna-card-unique:hover .sauna-card-unique-icon { transform: rotate(10deg) scale(1.06); }
          .sauna-card-unique.active .sauna-card-unique-icon {
            width: 44px; height: 44px;
            background: radial-gradient(circle at 30% 25%, #f1d7c2 0%, #c79a77 40%, #af8564 70%, #9e7456 100%);
          }
          .sauna-card-unique.active .sauna-card-unique-icon i { font-size: 1.3rem; }
          .sauna-card-unique-label {
            font-family: Montserrat, sans-serif;
            font-weight: 700; font-size: 1.05rem;
            margin-top: 8px; transition: .3s ease;
          }
          .sauna-card-unique.active .sauna-card-unique-label { color: #9e7456; }
          .sauna-card-unique-description {
            font-family: Montserrat, sans-serif;
            font-size: .9rem; line-height: 1.45;
            max-height: 0; opacity: 0; overflow: hidden;
            transition: .45s ease;
            text-align: center; padding: 4px 6px; color: #fff;
          }
          .sauna-card-unique.active .sauna-card-unique-description {
            max-height: 300px; opacity: 1; color: #2f2f2f;
          }
          .sauna-card-unique-click { position: absolute; inset: 0; }
          .sauna-card-unique-close {
            position: absolute; top: 12px; right: 12px;
            width: 26px; height: 26px; border-radius: 50%;
            background: rgba(255,255,255,.15);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: .25s ease;
          }
          .sauna-card-unique.active .sauna-card-unique-close { opacity: 1; }
          .sauna-card-unique-close i { color: #fff; font-size: .8rem; }

          @media(max-width: 768px) {
            .sauna-card-unique { width: 220px; min-width: 220px; height: 220px; }
            .sauna-card-unique.active { min-height: 220px; }
            .sauna-card-unique-label { font-size: 0.9rem; }
            .sauna-card-unique-description { font-size: 0.8rem; line-height: 1.35; }
            .sauna-card-unique-icon i { font-size: 1.8rem; }
          }
        `}</style>

        <section className="sauna-card-unique-section">
          <div className="sauna-carousel-wrapper">
            <div className="sauna-card-unique-grid">
              {/* Render cards twice for seamless infinite loop */}
              {[...benefitCards, ...benefitCards].map((card, i) => (
                <div className="sauna-card-unique" key={i}>
                  <div className="sauna-card-unique-close">
                    <i className="fa-solid fa-times"></i>
                  </div>
                  <div className="sauna-card-unique-content">
                    <div className="sauna-card-unique-icon">
                      <i className={card.icon}></i>
                    </div>
                    <div className="sauna-card-unique-label">{card.label}</div>
                    <div className="sauna-card-unique-description">{card.desc}</div>
                  </div>
                  <div className="sauna-card-unique-click"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      {/* ===================== */}
      {/* SECTION 3: CONTROLS   */}
      {/* ===================== */}
      <section className="sauna-controls-section max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "#af8564",
              fontSize: "36px",
              marginBottom: "16px",
            }}
          >
            {t("controls.heading")}
          </h2>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "rgb(20, 22, 23)",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "820px",
              margin: "0 auto",
            }}
          >
            {t("controls.intro")}
          </p>
        </div>

        <style>{`
          .controls-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
          }
          .control-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.85),
              inset 0 -1px 0 rgba(90,60,30,0.08),
              0 6px 20px rgba(139,94,60,0.10);
            transition: all 0.35s ease;
            border: 1px solid #f0e8e0;
          }
          .control-card:hover {
            transform: translateY(-6px);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.9),
              inset 0 -1px 0 rgba(90,60,30,0.10),
              0 16px 40px rgba(139,94,60,0.18);
          }
          .control-card-img-wrap {
            width: 100%;
            height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .control-card img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.5s ease;
          }
          .control-card:hover img { transform: scale(1.06); }
          .control-card-body { padding: 20px 22px 24px; }
          .control-card-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 1.15rem;
            color: #8b5e3c;
            margin-bottom: 10px;
          }
          .control-card-desc {
            font-family: 'Montserrat', sans-serif;
            font-weight: 400;
            font-size: 0.9rem;
            line-height: 1.6;
            color: #141617;
          }
          @media (max-width: 992px) {
            .controls-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .controls-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="controls-grid">
          {controlCards.map((card, i) => (
            <a href={localize(card.href)} className="control-card" key={i} style={{ textDecoration: "none" }}>
              <div className="control-card-img-wrap">
                <img src={card.img} alt={card.title} />
              </div>
              <div className="control-card-body">
                <div className="control-card-title">{card.title}</div>
                <div className="control-card-desc">{card.desc}</div>
              </div>
            </a>
          ))}
        </div>

        <div className="sauna-view-all-wrap">
          <Link to={localize(menuPaths.sauna.controls)} className="sauna-view-all-btn">{t("controls.viewAll")}</Link>
        </div>
      </section>

      {/* ======================= */}
      {/* SECTION 4: ACCESSORIES  */}
      {/* ======================= */}
      <section className="sauna-accessories-section max-w-[1200px] mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "#af8564",
              fontSize: "36px",
              marginBottom: "16px",
            }}
          >
            {t("accessories.heading")}
          </h2>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "rgb(20, 22, 23)",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "780px",
              margin: "0 auto",
            }}
          >
            {t("accessories.intro")}
          </p>
        </div>

        <style>{`
          .custom-product-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }
          .custom-product-grid .product {
            display: flex;
            flex-direction: column;
            text-decoration: none;
            color: inherit;
            border-radius: 12px;
            overflow: hidden;
            background: #fff;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.85),
              inset 0 -1px 0 rgba(90,60,30,0.08),
              0 4px 16px rgba(139,94,60,0.08);
            border: 1px solid #f0e8e0;
            transition: all 0.35s ease;
          }
          .custom-product-grid .product:hover {
            transform: translateY(-5px);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.9),
              inset 0 -1px 0 rgba(90,60,30,0.10),
              0 14px 36px rgba(139,94,60,0.16);
          }
          .custom-product-grid .product img {
            width: 100%;
            height: 220px;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          .custom-product-grid .product:hover img { transform: scale(1.05); }
          .custom-product-grid .product h3 {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 1.2rem;
            font-weight: 700;
            color: #8b5e3c;
            margin: 14px 16px 8px;
          }
          .custom-product-grid .product p {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.85rem;
            line-height: 1.55;
            color: #141617;
            margin: 0 16px 16px;
            font-weight: 400;
          }
          .sauna-view-all-wrap {
            text-align: center;
            margin: 40px auto 0;
          }
          .sauna-view-all-btn {
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
          .sauna-view-all-btn:hover {
            background: #af8564;
            color: #ffffff;
          }
          @media (max-width: 992px) {
            .custom-product-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .custom-product-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="custom-product-grid">
          <Link to={localize(menuPaths.sauna.accessories.accessorySets)} className="product">
            <img src={img_Signature_D_v4_scaled} alt={t("accessories.items.accessorySets.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.accessorySets.title")}</h3>
            <p>{t("accessories.items.accessorySets.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.pailsLadles)} className="product">
            <img src={img_DRAGON_FIRE_PAIL_AND_LADDLE_SCENE_600x600_1} alt={t("accessories.items.pailsLadles.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.pailsLadles.title")}</h3>
            <p>{t("accessories.items.pailsLadles.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.thermometers)} className="product">
            <img src={img_BoxType2_copy_new} alt={t("accessories.items.thermometers.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.thermometers.title")}</h3>
            <p>{t("accessories.items.thermometers.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.clocksSandtimers)} className="product">
            <img src={img_sand_timer_copy_new} alt={t("accessories.items.clocksSandtimers.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.clocksSandtimers.title")}</h3>
            <p>{t("accessories.items.clocksSandtimers.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.lightsCovers)} className="product">
            <img src={img_917_D_Display_new} alt={t("accessories.items.lightsCovers.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.lightsCovers.title")}</h3>
            <p>{t("accessories.items.lightsCovers.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.headrestsBackrests)} className="product">
            <img src={img_506_2_D} alt={t("accessories.items.headrestsBackrests.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.headrestsBackrests.title")}</h3>
            <p>{t("accessories.items.headrestsBackrests.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.doorsHandles)} className="product">
            <img src={img_DOORS_AND_HANDLES_copy} alt={t("accessories.items.doorsHandles.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.doorsHandles.title")}</h3>
            <p>{t("accessories.items.doorsHandles.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.benches)} className="product">
            <img src={img_siro_bench} alt={t("accessories.items.benches.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.benches.title")}</h3>
            <p>{t("accessories.items.benches.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.kivistone)} className="product">
            <img src={img_R_500_D_Scene2} alt={t("accessories.items.kivistone.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.kivistone.title")}</h3>
            <p>{t("accessories.items.kivistone.desc")}</p>
          </Link>
          <Link to={localize(menuPaths.sauna.accessories.ventilations)} className="product">
            <img src={img_Ventilation} alt={t("accessories.items.ventilations.title")} />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("accessories.items.ventilations.title")}</h3>
            <p>{t("accessories.items.ventilations.desc")}</p>
          </Link>
        </div>

        <div className="sauna-view-all-wrap">
          <Link to={localize(menuPaths.accessories)} className="sauna-view-all-btn">
            {t("accessories.viewAll")}
          </Link>
        </div>
      </section>

      {/* ===================== */}
      {/* CTA                   */}
      {/* ===================== */}
      <PageCTA
        title="Need Help Choosing?"
        description="From heaters and controls to rooms and accessories, our team can help you find the right sauna setup for your home or commercial space."
      />

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`

        .sauna-hero {
          position: relative;
        }

        .sauna-hero-btn {
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
          transition: all 0.3s ease;
          display: inline-block;
        }
        .sauna-hero-btn:hover {
          background: #ffffff;
          color: #af8564;
        }

        @media (max-width: 768px) {
          .sauna-hero h1 {
            font-size: 28px !important;
            line-height: 36px !important;
          }
          .sauna-hero p {
            font-size: 16px !important;
            line-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Sauna;