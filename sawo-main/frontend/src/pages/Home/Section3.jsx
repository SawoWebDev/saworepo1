// src/pages/Home/Section3.jsx
import React from "react";
import { Link } from "react-router-dom";
import ChevronRight from "../../components/icons/ChevronRight";
import menuPaths from "../../menuPaths";
import WellnessBenefits from "../../components/WellnessBenefits";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";
import { roomsPath, controlsPath } from "../../utils/anchoredLinks";

import steamGenerator    from "../../assets/Home/Section3/steam-generator1.webp";
import steamControl      from "../../assets/Home/Section3/SteamControlFinal.webp";
import steamAccessories  from "../../assets/Home/Section3/ST-746-I_Display2.webp";
import standardSauna     from "../../assets/Home/Section3/700x525.webp";
import glassFrontSauna   from "../../assets/Home/Section3/GLASS-FRONT.webp";
import compactSauna      from "../../assets/Home/Section3/700x525-compact.webp";
import infraredRooms     from "../../assets/Home/Section3/IR-ROOM.webp";
import infraredPanels    from "../../assets/Home/Section3/IR-PANEL.webp";
import infraredControls  from "../../assets/Home/Section3/IR-CONTROL.webp";
import saunovaSeries     from "../../assets/Home/Section3/SAU-UI-V2_AspenSauna.webp";
import innovaSeries      from "../../assets/Home/Section3/INC-S-V2_SpruceSauna.webp";
import controlAccessories from "../../assets/Home/Section3/sensor-holder.webp";

const STEAM_KEYS = ["generators", "controls", "accessories"];
const STEAM_HREFS = { generators: menuPaths.steam.generators, controls: menuPaths.steam.controls, accessories: menuPaths.steam.accessories };
const STEAM_IMAGES = { generators: steamGenerator, controls: steamControl, accessories: steamAccessories };

// Each card links to its own tab/section on the destination page
// (roomsPath/controlsPath — see utils/anchoredLinks.js) instead of just the
// general hub page, wherever that specific section actually exists. Infrared
// used to be a 4th card here but got its own grid below (and its own pages)
// — see INFRARED_KEYS.
const ROOMS_KEYS = ["standard", "glassFront", "compact"];
const ROOMS_HREFS = { standard: roomsPath("standard"), glassFront: roomsPath("glassFront"), compact: roomsPath("compact") };
const ROOMS_IMAGES = { standard: standardSauna, glassFront: glassFrontSauna, compact: compactSauna };

const INFRARED_KEYS = ["rooms", "panels", "controls"];
const INFRARED_HREFS = { rooms: menuPaths.infrared.saunas, panels: menuPaths.infrared.panels, controls: menuPaths.infrared.controls };
const INFRARED_IMAGES = { rooms: infraredRooms, panels: infraredPanels, controls: infraredControls };

const CONTROL_KEYS = ["saunova", "innova", "accessories"];
const CONTROL_HREFS = { saunova: controlsPath("saunova"), innova: controlsPath("innova"), accessories: controlsPath("accessories") };
const CONTROL_IMAGES = { saunova: saunovaSeries, innova: innovaSeries, accessories: controlAccessories };

// Shared across every page that uses this widget (Home, Sauna, Infrared) —
// lives in common.json, not this page's own file, so it's translated once
// instead of duplicated per page.
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
 * SteamSection — Steam grid, rendered separately (placed under Sauna Heaters on the homepage).
 */
export const SteamSection = () => {
  const t = useLocaleT("home");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();
  const STEAM_ITEMS = STEAM_KEYS.map((key) => ({
    key, title: t(`section3.steam.${key}.title`), caption: t(`section3.steam.${key}.caption`),
    img: STEAM_IMAGES[key], href: STEAM_HREFS[key],
  }));

  return (
    <section className="section3-wrapper">
      <h2 className="section-title">{t("section3.steamHeading")}</h2>
      <div className="steam-grid">
        {STEAM_ITEMS.map((item) => (
          <Link key={item.key} className="steam-card has-caption" to={localize(item.href)}>
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={localize(menuPaths.steam.parent)} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      <style jsx>{`
        .section3-wrapper { font-family: "Montserrat", sans-serif; padding: 40px 0; }
        .section-title { text-align: center; font-size: 35px; font-weight: 500; color: rgb(175, 133, 100); margin: 60px 0 30px; }
        .section-title:first-child { margin-top: 0; }
        .steam-grid, .image-grid { display: flex; flex-wrap: wrap; gap: 20px; }
        .steam-card, .image-card { flex: 1 1 calc(25% - 20px); min-width: 220px; position: relative; overflow: hidden; border-radius: 4px; }
        img { width: 100%; display: block; transition: transform 0.6s ease; }
        .steam-card:hover img, .image-card:hover img { transform: scale(1.08); }
        .steam-title, .image-card .title { position: absolute; bottom: 0; width: 100%; text-align: center; color: #fff; padding: 16px; z-index: 2; font-size: clamp(14px, 2vw, 20px); font-weight: 500; background: linear-gradient(to top, rgba(0,0,0,0.75), transparent); }
        .steam-card.has-caption::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.65); opacity: 0; transition: opacity 0.4s ease; z-index: 1; }
        .steam-card.has-caption:hover::before { opacity: 1; }
        .steam-caption { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #fff; opacity: 0; z-index: 2; transition: opacity 0.4s ease; }
        .steam-card.has-caption:hover .steam-caption { opacity: 1; }
        .steam-card.has-caption:hover .steam-title { opacity: 0; }
        @media (max-width: 768px) { .steam-card, .image-card { flex: 1 1 100%; } }
      `}</style>
    </section>
  );
};

/**
 * Section3 — Sauna Rooms / Infrared / Wellness Benefits grids (Steam and
 * Sauna Controls moved out to SteamSection / SaunaControlsSection).
 */
const Section3 = () => {
  const t = useLocaleT("home");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();

  const ROOMS_ITEMS = ROOMS_KEYS.map((key) => ({
    key, title: t(`section3.rooms.${key}.title`), caption: t(`section3.rooms.${key}.caption`),
    img: ROOMS_IMAGES[key], href: ROOMS_HREFS[key],
  }));
  const INFRARED_ITEMS = INFRARED_KEYS.map((key) => ({
    key, title: t(`section3.infrared.${key}.title`), caption: t(`section3.infrared.${key}.caption`),
    img: INFRARED_IMAGES[key], href: INFRARED_HREFS[key],
  }));
  const BENEFIT_CARDS = BENEFIT_KEYS.map(([key, icon]) => ({
    key, icon, label: tc(`wellnessBenefits.${key}.label`), desc: tc(`wellnessBenefits.${key}.desc`),
  }));

  return (
    <section className="section3-wrapper">
      {/* ── SAUNA ROOMS ── */}
      <h2 className="section-title">{t("section3.saunaRoomsHeading")}</h2>
      <div className="steam-grid">
        {ROOMS_ITEMS.map((item) => (
          <Link key={item.key} className="steam-card has-caption" to={localize(item.href)}>
            <img src={item.img} alt={item.title} width="700" height="525" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={localize(menuPaths.sauna.rooms)} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      {/* ── INFRARED ── */}
      {/* Same card treatment as Sauna Rooms above (steam-card has-caption):
          dark overlay + description on hover, title fading out. Was the
          plain .image-card (title only, no overlay) until 2026-08-20. */}
      <h2 className="section-title">{t("section3.infraredHeading")}</h2>
      <div className="steam-grid">
        {INFRARED_ITEMS.map((item) => (
          <Link key={item.key} className="steam-card has-caption" to={localize(item.href)}>
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={localize(menuPaths.infrared.parent)} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA WELLNESS BENEFITS ── */}
      <WellnessBenefits cards={BENEFIT_CARDS} />

      <style jsx>{`
        .section3-wrapper { font-family: "Montserrat", sans-serif; padding: 40px 0; }
        .section-title { text-align: center; font-size: 35px; font-weight: 500; color: rgb(175, 133, 100); margin: 60px 0 30px; }
        .section-title:first-child { margin-top: 0; }
        .steam-grid, .image-grid { display: flex; flex-wrap: wrap; gap: 20px; }
        .steam-card, .image-card { flex: 1 1 calc(25% - 20px); min-width: 220px; position: relative; overflow: hidden; border-radius: 4px; }
        img { width: 100%; display: block; transition: transform 0.6s ease; }
        .steam-card:hover img, .image-card:hover img { transform: scale(1.08); }
        .steam-title, .image-card .title { position: absolute; bottom: 0; width: 100%; text-align: center; color: #fff; padding: 16px; z-index: 2; font-size: clamp(14px, 2vw, 20px); font-weight: 500; background: linear-gradient(to top, rgba(0,0,0,0.75), transparent); }
        .steam-card.has-caption::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.65); opacity: 0; transition: opacity 0.4s ease; z-index: 1; }
        .steam-card.has-caption:hover::before { opacity: 1; }
        .steam-caption { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #fff; opacity: 0; z-index: 2; transition: opacity 0.4s ease; }
        .steam-card.has-caption:hover .steam-caption { opacity: 1; }
        .steam-card.has-caption:hover .steam-title { opacity: 0; }
        @media (max-width: 768px) { .steam-card, .image-card { flex: 1 1 100%; } }
      `}</style>
    </section>
  );
};

/**
 * SaunaControlsSection — Sauna Controls grid, rendered separately (placed under Steam on the homepage).
 */
export const SaunaControlsSection = () => {
  const t = useLocaleT("home");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();
  const CONTROL_ITEMS = CONTROL_KEYS.map((key) => ({
    key, title: t(`section3.controls.${key}.title`), img: CONTROL_IMAGES[key], href: CONTROL_HREFS[key],
  }));

  return (
    <section className="section3-wrapper">
      <h2 className="section-title">{t("section3.saunaControlHeading")}</h2>
      <div className="image-grid">
        {CONTROL_ITEMS.map((item) => (
          <Link key={item.key} to={localize(item.href)} className="image-card">
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={localize(menuPaths.sauna.controls)} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          {tc("exploreMore")} <ChevronRight />
        </Link>
      </div>

      <style jsx>{`
        .section3-wrapper { font-family: "Montserrat", sans-serif; padding: 40px 0; }
        .section-title { text-align: center; font-size: 35px; font-weight: 500; color: rgb(175, 133, 100); margin: 60px 0 30px; }
        .section-title:first-child { margin-top: 0; }
        .image-grid { display: flex; flex-wrap: wrap; gap: 20px; }
        .image-card { flex: 1 1 calc(25% - 20px); min-width: 220px; position: relative; overflow: hidden; border-radius: 4px; }
        img { width: 100%; display: block; transition: transform 0.6s ease; }
        .image-card:hover img { transform: scale(1.08); }
        .image-card .title { position: absolute; bottom: 0; width: 100%; text-align: center; color: #fff; padding: 16px; z-index: 2; font-size: clamp(14px, 2vw, 20px); font-weight: 500; background: linear-gradient(to top, rgba(0,0,0,0.75), transparent); }
        @media (max-width: 768px) { .image-card { flex: 1 1 100%; } }
      `}</style>
    </section>
  );
};

export default Section3;
