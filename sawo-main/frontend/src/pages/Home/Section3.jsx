// src/pages/Home/Section3.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import menuPaths from "../../menuPaths";

// Local images (fallbacks when CMS provides no image_url)
import steamGenerator    from "../../assets/Home/Section3/steam-generator1.webp";
import steamControl      from "../../assets/Home/Section3/SteamControlFinal.webp";
import steamAccessories  from "../../assets/Home/Section3/ST-746-I_Display2.webp";
import standardSauna     from "../../assets/Home/Section3/700x525.webp";
import glassFrontSauna   from "../../assets/Home/Section3/GLASS-FRONT.webp";
import outdoorSauna      from "../../assets/Home/Section3/700x525-outdoor-2.webp";
import infraredSaunaRoom from "../../assets/Home/Section3/INFRARED-SAUNA-ROOM.webp";
import infraredRooms     from "../../assets/Home/Section3/SR06-44710101-1313LS_PERSPECTIVE-VIEW-1.webp";
import infraredPanels    from "../../assets/Home/Section3/infrared-panelss-400x600px.webp";
import infraredControls  from "../../assets/Home/Section3/IR-UI-V2.webp";
import saunovaSeries     from "../../assets/Home/Section3/SAU-UI-V2_AspenSauna.webp";
import innovaSeries      from "../../assets/Home/Section3/INC-S-V2_SpruceSauna.webp";
import controlAccessories from "../../assets/Home/Section3/sensor-holder.webp";

const DEFAULT_STEAM_ITEMS = [
  { title: "Steam Generators", caption: "The luxury of tailored steam from advanced steam generators for a spa-like experience. Customized settings and overall exceptional performance.",                                                                        img: steamGenerator,   href: menuPaths.steam.generators },
  { title: "Steam Controls",   caption: "Precision, effortlessness, and personalization: Precise steam settings, effortless operation, and a personalized sauna experience from our Saunova and Innova control series.",                                        img: steamControl,     href: menuPaths.steam.controls   },
  { title: "Steam Accessories",caption: "Premium accessories designed to enhance functionality and maximize comfort. Consistently extraordinary wellness and relaxation experience.",                                                                             img: steamAccessories, href: menuPaths.steam.accessories },
];
const DEFAULT_ROOMS_ITEMS = [
  { title: "Standard Sauna",   caption: "Timeless design and high-quality materials. Classic indoor sauna experience for any home or wellness space.",                                                                                                          img: standardSauna,    href: menuPaths.sauna.rooms },
  { title: "Glass Front Sauna",caption: "Modern design featuring clear tempered glass panels for an unobstructed view outside. Pure serenity and relaxation.",                                                                                                  img: glassFrontSauna,  href: menuPaths.sauna.rooms },
  { title: "Outdoor Sauna",    caption: "Engineered to withstand severe weather. Top-coated walls and durable asphalt-shingle roof for maximum protection from the sun and rain.",                                                                               img: outdoorSauna,     href: menuPaths.sauna.rooms },
  { title: "Infrared Sauna",   caption: "Expertly crafted in cedar, aspen, and spruce. Gentle infrared warmth for soothing, therapeutic comfort.",                                                                                                              img: infraredSaunaRoom,href: menuPaths.sauna.rooms },
];
const DEFAULT_INFRARED_ITEMS = [
  { title: "Infrared Rooms",    img: infraredRooms,      href: menuPaths.infrared },
  { title: "Infrared Panels",   img: infraredPanels,     href: menuPaths.infrared },
  { title: "Infrared Controls", img: infraredControls,   href: menuPaths.infrared },
];
const DEFAULT_CONTROL_ITEMS = [
  { title: "Saunova Series",       img: saunovaSeries,      href: menuPaths.sauna.controls },
  { title: "Innova Series",        img: innovaSeries,       href: menuPaths.sauna.controls },
  { title: "Control Accessories",  img: controlAccessories, href: menuPaths.sauna.accessories.parent },
];

function mergeItems(defaults, cmsItems = []) {
  return defaults.map((def, i) => {
    const cms = cmsItems[i] || {};
    return { ...def, title: cms.title || def.title, caption: cms.caption || def.caption, img: cms.image_url || def.img };
  });
}

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
 * CMS-editable: all 4 sub-section headings, and per-card title / caption / image.
 */
const Section3 = ({ content = {} }) => {
  const steamHeading        = content.steam_heading        || "STEAM";
  const saunaRoomsHeading   = content.sauna_rooms_heading  || "SAUNA ROOMS";
  const infraredHeading     = content.infrared_heading     || "INFRARED";
  const saunaControlHeading = content.sauna_control_heading || "SAUNA CONTROL";

  const steamItems   = mergeItems(DEFAULT_STEAM_ITEMS,    content.steam_items);
  const roomItems    = mergeItems(DEFAULT_ROOMS_ITEMS,    content.sauna_rooms_items);
  const irItems      = mergeItems(DEFAULT_INFRARED_ITEMS, content.infrared_items);
  const controlItems = mergeItems(DEFAULT_CONTROL_ITEMS,  content.sauna_control_items);

  return (
    <section className="section3-wrapper">
      {/* ── STEAM ── */}
      <h2 className="section-title">{steamHeading}</h2>
      <div className="steam-grid">
        {steamItems.map((item, i) => (
          <Link key={i} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.steam.parent} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>

      {/* ── SAUNA ROOMS ── */}
      <h2 className="section-title">{saunaRoomsHeading}</h2>
      <div className="steam-grid">
        {roomItems.map((item, i) => (
          <Link key={i} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt="" width="700" height="525" loading="lazy" decoding="async" />
            <div className="steam-title">{item.title}</div>
            <div className="steam-caption">{item.caption}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.sauna.rooms} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>

      {/* ── INFRARED ── */}
      <h2 className="section-title">{infraredHeading}</h2>
      <div className="image-grid">
        {irItems.map((item, i) => (
          <Link key={i} to={item.href} className="image-card">
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.infrared} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>

      {/* ── SAUNA CONTROL ── */}
      <h2 className="section-title">{saunaControlHeading}</h2>
      <div className="image-grid">
        {controlItems.map((item, i) => (
          <Link key={i} to={item.href} className="image-card">
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.sauna.controls} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <FontAwesomeIcon icon={faChevronRight} />
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
