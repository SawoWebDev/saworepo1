// SteamAccessories.jsx

import React from "react";
import heroBg from "../../assets/Steam/hero.webp";
import steamDoor from "../../assets/Steam/steam-door.webp";
import aromaPump from "../../assets/Steam/aroma-pump.webp";
import installStand from "../../assets/Steam/Installation-stand.webp";
import venturiL from "../../assets/Steam/venturi-pipe-L-shape.webp";
import venturiStraight from "../../assets/Steam/venturi-pipe-straight.webp";
import demandButton from "../../assets/Steam/demand-button.webp";
import steamHeadCover from "../../assets/Steam/steam-head-cover.webp";

const accessories = [
  { img: steamDoor,       title: "Steam Door",             desc: "A steam door is essential for keeping steam in and preventing excess moisture from escaping, ensuring an optimal steam room experience." },
  { img: aromaPump,       title: "Aroma Pump",             desc: "The pump can handle any aroma scent you would prefer to enjoy your tranquil steam room experience." },
  { img: installStand,    title: "Installation Stand",     desc: "The steam generator installation stand provides a sturdy, durable base for secure support and efficient operation." },
  { img: venturiL,        title: "Venturi Pipe L-shape",   desc: "The Venturi Pipe draws air inside the tube, reducing the temperature by cooling the heated air molecules inside. The L-shape is ideal for compact installation." },
  { img: venturiStraight, title: "Venturi Pipe Straight",  desc: "The Venturi Pipe draws air inside the tube, reducing the temperature by cooling the heated air molecules inside." },
  { img: demandButton,    title: "Demand Button",          desc: "The Demand Button lets users activate steam generation instantly, offering convenient control for a customized experience." },
  { img: steamHeadCover,  title: "Steam Head Cover",       desc: "The Steam Head Cover provides a sleek protective casing for the steam head, enhancing both durability and the aesthetic of your steam room." },
];

const SteamAccessories = () => (
  <div className="relative">

    {/* ===================== */}
    {/* HERO                  */}
    {/* ===================== */}
    <section
      className="sa-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="sa-hero-overlay" />
      <div className="sa-hero-content">
        <h1 className="sa-hero-title">STEAM ACCESSORIES</h1>
        <p className="sa-hero-subtitle">
          Complete your steam setup with premium accessories
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* INTRO                 */}
    {/* ===================== */}
    <section className="sa-intro-section">
      <div className="sa-container text-center">
        <h2 className="sa-section-title">Introducing Our Steam Accessories</h2>
        <p className="sa-section-desc">
          Enhance your sauna with our premium steam accessories, designed to
          optimize comfort, boost functionality, and elevate your relaxation
          experience.
        </p>
      </div>
    </section>

    {/* ===================== */}
    {/* ACCESSORIES GRID      */}
    {/* ===================== */}
    <section className="sa-section">
      <div className="sa-container">
        <div className="sa-grid">
          {accessories.map((item, i) => (
            <div className="sa-card" key={i}>
              <div className="sa-img-wrap">
                <img src={item.img} alt={item.title} className="sa-img" />
              </div>
              <div className="sa-card-body">
                <h3 className="sa-card-title">{item.title}</h3>
                <p className="sa-card-desc">{item.desc}</p>
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
      .sa-hero-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.48);
        z-index: 0;
      }
      .sa-hero-content {
        position: relative; z-index: 1;
        display: flex; flex-direction: column;
        align-items: center; gap: 10px;
      }
      .sa-hero-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 45px; line-height: 52px;
        font-weight: 700; color: #fff; margin: 0;
      }
      .sa-hero-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 20px; font-weight: 300;
        color: rgba(255,255,255,0.88);
        line-height: 1.6; max-width: 540px; margin: 0;
      }

      /* ---- Layout ---- */
      .sa-container {
        max-width: 1200px; margin: 0 auto; padding: 0 24px;
      }
      .sa-intro-section { padding: 72px 0 0; }
      .sa-section       { padding: 48px 0 80px; }

      .sa-section-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.2rem; font-weight: 700;
        background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px; line-height: 1.2;
      }
      .sa-section-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.05rem; font-weight: 400;
        color: #555; line-height: 1.8;
        max-width: 680px; margin: 0 auto;
      }

      /* ---- Accessories grid ---- */
      .sa-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
      }
      .sa-card {
        display: flex; flex-direction: column;
        border-radius: 16px; overflow: hidden;
        border: 1px solid #ede5db; background: #fff;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-align: center;
      }
      .sa-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 40px rgba(170,129,97,0.15);
      }
      .sa-img-wrap {
        display: flex; align-items: center; justify-content: center;
        padding: 28px 20px; height: 160px; overflow: hidden;
      }
      .sa-img {
        max-height: 120px; max-width: 100%;
        object-fit: contain; display: block;
        transition: transform 0.4s ease;
      }
      .sa-card:hover .sa-img { transform: scale(1.08); }
      .sa-card-body {
        padding: 14px 18px 20px;
        border-top: 1px solid #ede5db; flex: 1;
      }
      .sa-card-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95rem; font-weight: 700;
        color: #AA8161; margin-bottom: 8px;
      }
      .sa-card-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.83rem; font-weight: 400;
        color: #555; line-height: 1.65; margin: 0;
      }

      /* ---- Responsive ---- */
      @media (max-width: 1024px) {
        .sa-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (max-width: 768px) {
        .sa-hero-title    { font-size: 28px; line-height: 36px; }
        .sa-hero-subtitle { font-size: 16px; }
        .sa-section-title { font-size: 1.7rem; }
        .sa-grid          { grid-template-columns: repeat(2, 1fr); }
        .sa-intro-section { padding: 48px 0 0; }
        .sa-section       { padding: 32px 0 60px; }
      }
      @media (max-width: 480px) {
        .sa-grid { grid-template-columns: 1fr; }
      }
    `}</style>

  </div>
);

export default SteamAccessories;