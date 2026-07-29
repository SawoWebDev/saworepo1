// src/pages/Home/Section3.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ChevronRight from "../../components/icons/ChevronRight";
import menuPaths from "../../menuPaths";

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

const STEAM_ITEMS = [
  { title: "Steam Generators", caption: "The luxury of tailored steam from advanced steam generators for a spa-like experience. Customized settings and overall exceptional performance.",                                                                        img: steamGenerator,   href: menuPaths.steam.generators },
  { title: "Steam Controls",   caption: "Precision, effortlessness, and personalization: Precise steam settings, effortless operation, and a personalized sauna experience from our Saunova and Innova control series.",                                        img: steamControl,     href: menuPaths.steam.controls   },
  { title: "Steam Accessories",caption: "Premium accessories designed to enhance functionality and maximize comfort. Consistently extraordinary wellness and relaxation experience.",                                                                             img: steamAccessories, href: menuPaths.steam.accessories },
];
const ROOMS_ITEMS = [
  { title: "Standard Sauna",   caption: "Timeless design and high-quality materials. Classic indoor sauna experience for any home or wellness space.",                                                                                                          img: standardSauna,    href: menuPaths.sauna.rooms },
  { title: "Glass Front Sauna",caption: "Modern design featuring clear tempered glass panels for an unobstructed view outside. Pure serenity and relaxation.",                                                                                                  img: glassFrontSauna,  href: menuPaths.sauna.rooms },
  { title: "Outdoor Sauna",    caption: "Engineered to withstand severe weather. Top-coated walls and durable asphalt-shingle roof for maximum protection from the sun and rain.",                                                                               img: outdoorSauna,     href: menuPaths.sauna.rooms },
  { title: "Infrared Sauna",   caption: "Expertly crafted in cedar, aspen, and spruce. Gentle infrared warmth for soothing, therapeutic comfort.",                                                                                                              img: infraredSaunaRoom,href: menuPaths.sauna.rooms },
];
const INFRARED_ITEMS = [
  { title: "Infrared Rooms",    img: infraredRooms,      href: menuPaths.infrared },
  { title: "Infrared Panels",   img: infraredPanels,     href: menuPaths.infrared },
  { title: "Infrared Controls", img: infraredControls,   href: menuPaths.infrared },
];
const CONTROL_ITEMS = [
  { title: "Saunova Series",       img: saunovaSeries,      href: menuPaths.sauna.controls },
  { title: "Innova Series",        img: innovaSeries,       href: menuPaths.sauna.controls },
  { title: "Control Accessories",  img: controlAccessories, href: menuPaths.sauna.accessories.parent },
];

// Same wellness-benefits widget used on the Sauna and Infrared pages (icon
// cards, hover-to-reveal on desktop / tap-to-toggle on mobile, seamless
// auto-scrolling loop). Kept as the same copy-per-page pattern those pages
// use rather than a shared component, so it stays consistent with them.
const BENEFIT_CARDS = [
  { icon: "fas fa-spa", label: "Stress Relief", desc: "Reduces stress, promotes relaxation, and alleviates anxiety" },
  { icon: "fas fa-heartbeat", label: "Heart Health", desc: "Enhances blood circulation, reduces arterial stiffness, and supports healthy blood pressure" },
  { icon: "fas fa-lungs", label: "Respiratory Relief", desc: "Relieves nasal, sinus, and chest congestion" },
  { icon: "fas fa-dumbbell", label: "Muscle Recovery", desc: "Accelerates muscle recovery following exercise" },
  { icon: "fas fa-bed", label: "Better Sleep", desc: "Promotes deeper, more restorative sleep by extending REM sleep duration" },
  { icon: "fas fa-heart", label: "Disease Prevention", desc: "Lowers risk of cardiovascular diseases, including stroke, hypertension, dementia, and Alzheimer's disease" },
  { icon: "fas fa-droplet", label: "Skin Detox", desc: "Opens pores, reduces blackheads, eliminates toxins, and improves skin" },
  { icon: "fas fa-wand-magic-sparkles", label: "Collagen Boost", desc: "Stimulates fibroblast activity to boost collagen production and enhance skin texture" },
  { icon: "fas fa-hand-holding-droplet", label: "Skin Hydration", desc: "Improves skin hydration, stabilizes pH balance, and strengthens the skin's natural barrier" },
  { icon: "fas fa-shield-alt", label: "Immune Support", desc: "Supports the body's natural immune defenses and aids recovery after illness" },
  { icon: "fas fa-fire", label: "Metabolism Boost", desc: "Stimulates protein repair, improves insulin sensitivity, and enhances metabolic rate" },
  { icon: "fas fa-smile", label: "Mental Wellness", desc: "Significantly reduces symptoms of depression with consistent use" },
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
      <h2 className="section-title">STEAM</h2>
      <div className="steam-grid">
        {STEAM_ITEMS.map((item, i) => (
          <Link key={i} className="steam-card has-caption" to={item.href}>
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
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
            <img src={item.img} alt="" width="700" height="525" loading="lazy" decoding="async" />
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

      {/* ── SAUNA WELLNESS BENEFITS ── */}
      <section className="sauna-benefits-section full-bleed" style={{ background: "#af8564" }}>
        <div className="sauna-card-unique-section">
          <div className="home-benefits-carousel-wrapper">
            <div className="sauna-card-unique-grid">
              {/* Cards rendered twice for a seamless infinite loop */}
              {[...BENEFIT_CARDS, ...BENEFIT_CARDS].map((card, i) => (
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
        </div>
      </section>

      {/* ── INFRARED ── */}
      <h2 className="section-title">INFRARED</h2>
      <div className="image-grid">
        {INFRARED_ITEMS.map((item, i) => (
          <Link key={i} to={item.href} className="image-card">
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
            <div className="title">{item.title}</div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to={menuPaths.infrared} style={exploreBtnStyle} onMouseEnter={e => e.currentTarget.style.color="#af8564"} onMouseLeave={e => e.currentTarget.style.color="#333333"}>
          Explore More <ChevronRight />
        </Link>
      </div>

      {/* ── SAUNA CONTROL ── */}
      <h2 className="section-title">SAUNA CONTROL</h2>
      <div className="image-grid">
        {CONTROL_ITEMS.map((item, i) => (
          <Link key={i} to={item.href} className="image-card">
            <img src={item.img} alt="" width="600" height="400" loading="lazy" decoding="async" />
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
