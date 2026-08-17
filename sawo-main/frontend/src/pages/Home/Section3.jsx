// src/pages/Home/Section3.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ChevronRight from "../../components/icons/ChevronRight";
import menuPaths from "../../menuPaths";
import { useLocaleT } from "../../i18n/LocaleContext";
import { roomsPath, controlsPath, infraredPath } from "../../utils/anchoredLinks";

import steamGenerator    from "../../assets/Home/Section3/steam-generator1.webp";
import steamControl      from "../../assets/Home/Section3/SteamControlFinal.webp";
import steamAccessories  from "../../assets/Home/Section3/ST-746-I_Display2.webp";
import standardSauna     from "../../assets/Home/Section3/700x525.webp";
import glassFrontSauna   from "../../assets/Home/Section3/GLASS-FRONT.webp";
import compactSauna      from "../../assets/Home/Section3/700x525-compact.webp";
import infraredSaunaRoom from "../../assets/Home/Section3/INFRARED-SAUNA-ROOM.webp";
import infraredRooms     from "../../assets/Home/Section3/SR06-44710101-1313LS_PERSPECTIVE-VIEW-1.webp";
import infraredPanels    from "../../assets/Home/Section3/infrared-panelss-400x600px.webp";
import infraredControls  from "../../assets/Home/Section3/IR-UI-V2.webp";
import saunovaSeries     from "../../assets/Home/Section3/SAU-UI-V2_AspenSauna.webp";
import innovaSeries      from "../../assets/Home/Section3/INC-S-V2_SpruceSauna.webp";
import controlAccessories from "../../assets/Home/Section3/sensor-holder.webp";

const STEAM_KEYS = ["generators", "controls", "accessories"];
const STEAM_HREFS = { generators: menuPaths.steam.generators, controls: menuPaths.steam.controls, accessories: menuPaths.steam.accessories };
const STEAM_IMAGES = { generators: steamGenerator, controls: steamControl, accessories: steamAccessories };

// Each card links to its own specific tab/section on the destination page
// (roomsPath/controlsPath/infraredPath — see utils/anchoredLinks.js), not
// just the general hub page, wherever that target section actually exists.
const ROOMS_KEYS = ["standard", "glassFront", "compact", "infrared"];
const ROOMS_HREFS = { standard: roomsPath("standard"), glassFront: roomsPath("glassFront"), compact: roomsPath("compact"), infrared: roomsPath("infrared") };
const ROOMS_IMAGES = { standard: standardSauna, glassFront: glassFrontSauna, compact: compactSauna, infrared: infraredSaunaRoom };

const INFRARED_KEYS = ["rooms", "panels", "controls"];
const INFRARED_HREFS = { rooms: infraredPath("rooms"), panels: infraredPath("panels"), controls: infraredPath("controls") };
const INFRARED_IMAGES = { rooms: infraredRooms, panels: infraredPanels, controls: infraredControls };

const CONTROL_KEYS = ["saunova", "innova", "accessories"];
const CONTROL_HREFS = { saunova: controlsPath("saunova"), innova: controlsPath("innova"), accessories: controlsPath("accessories") };
const CONTROL_IMAGES = { saunova: saunovaSeries, innova: innovaSeries, accessories: controlAccessories };

// Same wellness-benefits widget used on the Sauna and Infrared pages (icon
// cards, hover-to-reveal on desktop / tap-to-toggle on mobile, seamless
// auto-scrolling loop). Kept as the same copy-per-page pattern those pages
// use rather than a shared component, so it stays consistent with them.
const BENEFIT_KEYS = [
  ["stressRelief", "fas fa-spa"],
  ["heartHealth", "fas fa-heartbeat"],
  ["respiratoryRelief", "fas fa-lungs"],
  ["muscleRecovery", "fas fa-dumbbell"],
  ["betterSleep", "fas fa-bed"],
  ["diseasePrevention", "fas fa-heart"],
  ["skinDetox", "fas fa-droplet"],
  ["collagenBoost", "fas fa-wand-magic-sparkles"],
  ["skinHydration", "fas fa-hand-holding-droplet"],
  ["immuneSupport", "fas fa-shield-alt"],
  ["metabolismBoost", "fas fa-fire"],
  ["mentalWellness", "fas fa-smile"],
];

const exploreBtnStyle = {
  fontFamily: "'Montserrat', sans-serif",
  fontWeight: 500,
  fontSize: "15px",
  lineHeight: "27px",
  color: "#333333",
  textDecoration: "none",
  transition: "color 0.3s ease",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

/**
 * Section3 — Steam / Sauna Rooms / Infrared / Sauna Control grids.
 */
const Section3 = () => {
  const t = useLocaleT("home");
  const tc = useLocaleT("common");

  const STEAM_ITEMS = STEAM_KEYS.map((key) => ({
    key, title: t(`section3.steam.${key}.title`), caption: t(`section3.steam.${key}.caption`),
    img: STEAM_IMAGES[key], href: STEAM_HREFS[key],
  }));
  const ROOMS_ITEMS = ROOMS_KEYS.map((key) => ({
    key, title: t(`section3.rooms.${key}.title`), caption: t(`section3.rooms.${key}.caption`),
    img: ROOMS_IMAGES[key], href: ROOMS_HREFS[key],
  }));
  const INFRARED_ITEMS = INFRARED_KEYS.map((key) => ({
    key, title: t(`section3.infrared.${key}.title`), img: INFRARED_IMAGES[key], href: INFRARED_HREFS[key],
  }));
  const CONTROL_ITEMS = CONTROL_KEYS.map((key) => ({
    key, title: t(`section3.controls.${key}.title`), img: CONTROL_IMAGES[key], href: CONTROL_HREFS[key],
  }));
  // Shared across every page that uses this widget (Home, Sauna, Infrared)
  // — lives in common.json, not this page's own file, so it's translated
  // once instead of duplicated per page.
  const BENEFIT_CARDS = BENEFIT_KEYS.map(([key, icon]) => ({
    key, icon, label: tc(`wellnessBenefits.${key}.label`), desc: tc(`wellnessBenefits.${key}.desc`),
  }));

  useEffect(() => {
    const initCards = () => {
      const cards = document.querySelectorAll(".sauna-card-unique");
      if (!cards.length) return;

      const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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

  return (
    <section className="section3-wrapper">
      {/* ── STEAM ── */}
      <h2 className="section-title">{t("section3.steamHeading")}</h2>
      <div className="steam-grid">
        {STEAM_ITEMS.map((item) => (
          <Link key={item.key} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.steam.parent} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA ROOMS ── */}
      <h2 className="section-title">{t("section3.saunaRoomsHeading")}</h2>
      <div className="steam-grid">
        {ROOMS_ITEMS.map((item) => (
          <Link key={item.key} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt={item.title} width="700" height="525" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.sauna.rooms} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA WELLNESS BENEFITS ── */}
      <section className="sauna-benefits-section full-bleed" style={{ background: "#af8564" }}>
        <div className="sauna-card-unique-section">
          <div className="home-benefits-carousel-wrapper">
            <div className="sauna-card-unique-grid">
              {/* Cards rendered twice for a seamless infinite loop */}
              {[...BENEFIT_CARDS, ...BENEFIT_CARDS].map((card, i) => (
                <div className="sauna-card-unique" key={`${card.key}-${i}`}>
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
        </div>
      </section>

      {/* ── INFRARED ── */}
      <h2 className="section-title">{t("section3.infraredHeading")}</h2>
      <div className="image-grid">
        {INFRARED_ITEMS.map((item) => (
          <Link key={item.key} to={item.href} className="image-card">
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.infrared} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA CONTROL ── */}
      <h2 className="section-title">{t("section3.saunaControlHeading")}</h2>
      <div className="image-grid">
        {CONTROL_ITEMS.map((item) => (
          <Link key={item.key} to={item.href} className="image-card">
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.sauna.controls} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      <style jsx>{`
        .section3-wrapper { font-family: "Montserrat", sans-serif; padding: 40px 0; }
        .section-title { text-align: center; font-size: 35px; font-weight: 500; color: rgb(175, 133, 100); margin: 60px 0 30px; }
        .steam-grid, .image-grid { display: flex; flex-wrap: wrap; gap: 20px; }
        .steam-card, .image-card { flex: 1 1 calc(25% - 20px); min-width: 220px; position: relative; overflow: hidden; border-radius: 4px; }
        img { width: 100%; display: block; transition: transform 0.6s ease; }
        .steam-card:hover img, .image-card:hover img { transform: scale(1.08); }
        .steam-title, .image-card .title { position: absolute; bottom: 0; width: 100%; text-align: center; color: #fff; padding: 16px; z-index: 2; font-size: clamp(14px, 2vw, 20px); font-weight: 500; text-transform: uppercase; background: linear-gradient(to top, rgba(0,0,0,0.75), transparent); }
        .steam-card.has-caption::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.65); opacity: 0; transition: opacity 0.4s ease; z-index: 1; }
        .steam-card.has-caption:hover::before { opacity: 1; }
        .steam-caption { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #fff; opacity: 0; z-index: 2; transition: opacity 0.4s ease; }
        .steam-card.has-caption:hover .steam-caption { opacity: 1; }
        .steam-card.has-caption:hover .steam-title { opacity: 0; }
        @media (max-width: 768px) { .steam-card, .image-card { flex: 1 1 100%; } }

        /* ── Sauna wellness benefits carousel ── */
        .sauna-benefits-section {
          margin-top: 80px;
          padding: 28px 0;
        }
        /* Break out of Home.jsx's max-w-[2000px] + px-4/6/8 wrapper so this
           carousel spans the full viewport width instead of being boxed in
           like the sections above/below it. */
        .full-bleed {
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
        }
        .sauna-card-unique-section { max-width: 100%; margin: 0 auto; overflow: hidden; padding: 14px 0; }
        .home-benefits-carousel-wrapper { position: relative; overflow: hidden; }
        .sauna-card-unique-grid {
          display: flex;
          gap: 24px;
          animation: sawo-benefits-scroll 60s linear infinite;
          width: max-content;
        }
        .home-benefits-carousel-wrapper:hover .sauna-card-unique-grid { animation-play-state: paused; }

        @keyframes sawo-benefits-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .sauna-card-unique {
          background: #fff;
          border-radius: 20px;
          width: 250px;
          min-width: 250px;
          aspect-ratio: 1/1;
          text-align: center;
          transition: .4s ease;
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
        .sauna-card-unique::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #c79a77, #fff, #c79a77);
          transform: scaleX(0);
          transition: .4s ease;
        }
        .sauna-card-unique:hover::before { transform: scaleX(1); }
        .sauna-card-unique.active {
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
          transition: .45s cubic-bezier(.68,-.55,.265,1.55);
        }
        .sauna-card-unique-icon i { font-size: 2rem; color: #fff; transition: .4s ease; }
        .sauna-card-unique:hover .sauna-card-unique-icon { transform: rotate(10deg) scale(1.06); }
        .sauna-card-unique.active .sauna-card-unique-icon {
          background: radial-gradient(circle at 30% 25%, #f1d7c2 0%, #c79a77 40%, #af8564 70%, #9e7456 100%);
          transform: scale(.62);
        }
        .sauna-card-unique.active .sauna-card-unique-icon i { font-size: 2.3rem; }
        .sauna-card-unique-label {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700; font-size: 1.05rem;
          margin-top: 8px; transition: .3s ease;
        }
        .sauna-card-unique.active .sauna-card-unique-label { color: #9e7456; }
        .sauna-card-unique-description {
          font-family: 'Montserrat', sans-serif;
          font-size: .9rem; line-height: 1.45;
          max-height: 0; opacity: 0; overflow: hidden;
          transition: .45s ease;
          text-align: center; padding: 4px 6px; color: #fff;
        }
        .sauna-card-unique.active .sauna-card-unique-description { max-height: 160px; opacity: 1; color: #2f2f2f; }
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

        @media (max-width: 768px) {
          .sauna-card-unique { width: 220px; min-width: 220px; }
          .sauna-card-unique-label { font-size: 0.9rem; }
          .sauna-card-unique-description { font-size: 0.8rem; line-height: 1.35; }
          .sauna-card-unique-icon i { font-size: 1.8rem; }
        }
      `}</style>
    </section>
  );
};

export default Section3;
