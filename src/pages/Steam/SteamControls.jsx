// SteamControls.jsx

import React from "react";
import heroBg from "../../assets/Steam/controls-hero.webp";
import stpV2 from "../../assets/Steam/STP-INFACE-V2-300x330.webp";
import stpSST from "../../assets/Steam/STP-INFACE-SST-310x179.webp";
import steControl from "../../assets/Steam/STE-INFACE-V2-150x150.webp";

const controls = [
  {
    img: stpV2,
    title: "Steam 2.0",
    subtitle: "STP-INFACE-V2",
    desc: "The Steam 2.0 (STP-INFACE-V2) control is the latest addition to our steam generator control lineup, delivering reliable performance with a modernized design.",
  },
  {
    img: stpSST,
    title: "Steam Stainless Touch",
    subtitle: "STP-INFACE-SST",
    desc: "The Steam Stainless Touch offers effortless control of steam, temperature, and time through a user-friendly interface, ensuring a personalized sauna or steam room experience.",
  },
  {
    img: steControl,
    title: "Steam STE",
    subtitle: "STE-INFACE-V2",
    desc: "The Steam STE control combines the familiar operation of its predecessor with a modernized design and refined dimensions for easier, more reliable use.",
  },
];

const SteamControls = () => (
  <div className="relative">

    {/* ===================== */}
    {/* HERO                  */}
    {/* ===================== */}
    <section
      className="sc-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="sc-hero-overlay" />
      <div className="sc-hero-content">
        <h1 className="sc-hero-title">STEAM CONTROLS</h1>
        <p className="sc-hero-subtitle">
          Precision and ease, take full control of your steam experience
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* INTRO                 */}
    {/* ===================== */}
    <section className="sc-intro-section">
      <div className="sc-container text-center">
        <h2 className="sc-section-title">Introducing Our Steam Controls</h2>
        <p className="sc-section-desc">
          Experience precise steam settings and effortless operation with the
          Saunova and Innova series for a personalized sauna experience.
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* CONTROLS              */}
    {/* ===================== */}
    <section className="sc-section">
      <div className="sc-container">
        <div className="sc-grid">
          {controls.map((item, i) => (
            <div className="sc-card" key={i}>
              <div className="sc-img-wrap">
                <img src={item.img} alt={item.title} className="sc-img" />
              </div>
              <div className="sc-text">
                <p className="sc-eyebrow">{item.subtitle}</p>
                <h3 className="sc-card-title">{item.title}</h3>
                <p className="sc-card-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ===================== */}
    {/* STYLES                */}
    {/* ===================== */}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

      /* ---- Hero ---- */
      .sc-hero-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.48);
        z-index: 0;
      }
      .sc-hero-content {
        position: relative; z-index: 1;
        display: flex; flex-direction: column;
        align-items: center; gap: 10px;
      }
      .sc-hero-eyebrow {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem; font-weight: 600;
        letter-spacing: 4px; color: rgba(255,255,255,0.7);
        text-transform: uppercase; margin: 0;
      }
      .sc-hero-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 45px; line-height: 52px;
        font-weight: 700; color: #fff; margin: 0;
      }
      .sc-hero-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 20px; font-weight: 300;
        color: rgba(255,255,255,0.88);
        line-height: 1.6; max-width: 540px;
        margin: 4px 0 0;
      }

      /* ---- Layout ---- */
      .sc-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .sc-intro-section {
        padding: 72px 0 0;
      }
      .sc-section {
        padding: 48px 0 80px;
      }
      .sc-section-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.2rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sc-section-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.05rem; font-weight: 400;
        color: #555; line-height: 1.8;
        max-width: 680px; margin: 0 auto;
      }

      /* ---- Control cards ---- */
      .sc-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px;
      }
      .sc-card {
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #ede5db;
        background: #fff;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .sc-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 40px rgba(170,129,97,0.15);
      }

      /* ---- Image ---- */
      .sc-img-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        height: 220px;
        overflow: hidden;
      }
      .sc-img {
        max-width: 100%;
        max-height: 160px;
        object-fit: contain;
        display: block;
        transition: transform 0.5s ease;
      }
      .sc-card:hover .sc-img {
        transform: scale(1.06);
      }

      /* ---- Text ---- */
      .sc-text {
        padding: 16px 20px 22px;
        border-top: 1px solid #ede5db;
        flex: 1;
      }
      .sc-eyebrow {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem; font-weight: 600;
        letter-spacing: 2.5px; color: #AA8161;
        text-transform: uppercase; margin-bottom: 8px;
      }
      .sc-card-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.9rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sc-card-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem; font-weight: 400;
        color: #444; line-height: 1.8;
      }

      /* ---- Responsive ---- */
      @media (max-width: 768px) {
        .sc-hero-title   { font-size: 28px; line-height: 36px; }
        .sc-hero-subtitle { font-size: 16px; }
        .sc-section-title { font-size: 1.7rem; }
        .sc-grid { grid-template-columns: 1fr; }
        .sc-intro-section { padding: 48px 0 0; }
        .sc-section { padding: 32px 0 60px; }
      }
      @media (max-width: 1024px) and (min-width: 769px) {
        .sc-grid { grid-template-columns: repeat(2, 1fr); }
      }
    `}</style>

  </div>
);

export default SteamControls;