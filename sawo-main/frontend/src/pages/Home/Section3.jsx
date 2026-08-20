// src/pages/Home/Section3.jsx
import React from "react";
import { Link } from "react-router-dom";
import ChevronRight from "../../components/icons/ChevronRight";
import menuPaths from "../../menuPaths";
import WellnessBenefits from "../../components/WellnessBenefits";

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

const STEAM_ITEMS = [
  { title: "Steam Generators", caption: "The luxury of tailored steam from advanced steam generators for a spa-like experience. Customized settings and overall exceptional performance.",                                                                        img: steamGenerator,   href: menuPaths.steam.generators },
  { title: "Steam Controls",   caption: "Precision, effortlessness, and personalization: Precise steam settings, effortless operation, and a personalized sauna experience from our Saunova and Innova control series.",                                        img: steamControl,     href: menuPaths.steam.controls   },
  { title: "Steam Accessories",caption: "Premium accessories designed to enhance functionality and maximize comfort. Consistently extraordinary wellness and relaxation experience.",                                                                             img: steamAccessories, href: menuPaths.steam.accessories },
];
// Each card links to its own tab/section on the destination page (a hash for
// the Sauna Rooms tabs and Infrared page sections, a ?group= filter for
// Sauna Controls) instead of just the general hub page, wherever that
// specific section actually exists.
const ROOMS_ITEMS = [
  { title: "Standard Sauna",   caption: "Timeless design and high-quality materials. Classic indoor sauna experience for any home or wellness space.",                                                                                                          img: standardSauna,    href: `${menuPaths.sauna.rooms}#standard-sauna-room` },
  { title: "Glass Front Sauna",caption: "Modern design featuring clear tempered glass panels for an unobstructed view outside. Pure serenity and relaxation.",                                                                                                  img: glassFrontSauna,  href: `${menuPaths.sauna.rooms}#glass-front-sauna-room` },
  { title: "Compact Sauna",    caption: "Instant, plug-and-play design built for urban spaces. A hidden heater keeps the setup safe while maximizing your view.",                                                                                                img: compactSauna,     href: `${menuPaths.sauna.rooms}#compact-sauna-room` },
];
const INFRARED_ITEMS = [
  { title: "Infrared Saunas",   caption: "Enjoy gentle, soothing infrared warmth in a comfortable and compact sauna space, designed for a relaxing and restorative experience.",                img: infraredRooms,      href: menuPaths.infrared.saunas },
  { title: "Infrared Panels",   caption: "Designed to provide gentle, direct infrared warmth, these panels create a comfortable and relaxing sauna experience.",            img: infraredPanels,     href: menuPaths.infrared.panels },
  { title: "Infrared Controls", caption: "Easy-to-use controls designed to help you manage your infrared sauna experience with convenient temperature and session settings.",                               img: infraredControls,   href: menuPaths.infrared.controls },
];
const CONTROL_ITEMS = [
  { title: "Saunova Series",       img: saunovaSeries,      href: `${menuPaths.sauna.controls}?group=${encodeURIComponent("Saunova Series")}` },
  { title: "Innova Series",        img: innovaSeries,       href: `${menuPaths.sauna.controls}?group=${encodeURIComponent("Innova Series")}` },
  { title: "Control Accessories",  img: controlAccessories, href: `${menuPaths.sauna.controls}?group=${encodeURIComponent("Control Spare Parts")}` },
];

// Same wellness-benefits widget used on the Sauna and Infrared pages (icon
// cards, hover-to-reveal on desktop / tap-to-toggle on mobile, seamless
// auto-scrolling loop). Kept as the same copy-per-page pattern those pages
// use rather than a shared component, so it stays consistent with them.
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
  return (
    <section className="section3-wrapper">
      {/* ── STEAM ── */}
      <h2 className="section-title">STEAM</h2>
      <div className="steam-grid">
        {STEAM_ITEMS.map((item, i) => (
          <Link key={i} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.steam.parent} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA ROOMS ── */}
      <h2 className="section-title">SAUNA ROOMS</h2>
      <div className="steam-grid">
        {ROOMS_ITEMS.map((item, i) => (
          <Link key={i} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt={item.title} width="700" height="525" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.sauna.rooms} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <ChevronRight />
        </Link>
      </div>


      {/* ── INFRARED ── */}
      {/* Same card treatment as Sauna Rooms above (steam-card has-caption):
          dark overlay + description on hover, title fading out. Was the
          plain .image-card (title only, no overlay) until 2026-08-20. */}
      <h2 className="section-title">INFRARED</h2>
      <div className="steam-grid">
        {INFRARED_ITEMS.map((item, i) => (
          <Link key={i} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.infrared.parent} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA WELLNESS BENEFITS ── */}
      <WellnessBenefits />

      {/* ── SAUNA CONTROL ── */}
      <h2 className="section-title">SAUNA CONTROL</h2>
      <div className="image-grid">
        {CONTROL_ITEMS.map((item, i) => (
          <Link key={i} to={item.href} className="image-card">
            <img src={item.img} alt={item.title} width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.sauna.controls} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <ChevronRight />
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
      `}</style>
    </section>
  );
};

export default Section3;
