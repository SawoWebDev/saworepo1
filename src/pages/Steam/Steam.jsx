// Steam.jsx

import React from "react";
import heroBg from "../../assets/Steam/hero.webp";
import stnS from "../../assets/Steam/Steam Generators/STN-S.webp";
import stnW from "../../assets/Steam/Steam Generators/STN-W.webp";
import stn from "../../assets/Steam/Steam Generators/STN.webp";
import ste from "../../assets/Steam/Steam Generators/STE.webp";
import steControl from "../../assets/Steam/STE-INFACE-V2-150x150.webp";
import stpV2 from "../../assets/Steam/STP-INFACE-V2-300x330.webp";
import stpSST from "../../assets/Steam/STP-INFACE-SST-310x179.webp";
import steamDoor from "../../assets/Steam/steam-door.webp";
import installStand from "../../assets/Steam/Installation-stand.webp";
import aromaPump from "../../assets/Steam/aroma-pump.webp";
import demandButton from "../../assets/Steam/demand-button.webp";
import venturiL from "../../assets/Steam/venturi-pipe-L-shape.webp";
import venturiStraight from "../../assets/Steam/venturi-pipe-straight.webp";

const generators = [
  {
    img: stnS,
    title: "STN-S Steam Generator",
    desc: "The STN-S offers advanced steam control technology for residential and commercial steam rooms. Featuring precise digital controls and reliable performance, it delivers a consistently luxurious steam experience tailored to your needs.",
  },
  {
    img: stnW,
    title: "STN-W Steam Generator",
    desc: "The STN-W steam generators, successors to STPs, feature a sleek, durable stainless steel casing for long-lasting performance.",
  },
  {
    img: stn,
    title: "STN Steam Generator",
    desc: "The STN is engineered for consistent, dependable steam delivery across a wide range of room sizes. Built with durability in mind, it brings the authentic steam room experience to your space with effortless operation.",
  },
  {
    img: ste,
    title: "STE Steam Generator",
    desc: "Our latest steam generator, STE is the easiest way to have a steam. Switch on and adjust the level of steam you like.",
  },
];

const controls = [
  {
    img: steControl,
    title: "Steam STE",
    subtitle: "STE-INFACE-V2",
    desc: "The Steam 2.0 control combines the familiar operation of its predecessor with a modernized design and refined dimensions for easier, more reliable use.",
  },
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
];

const accessories = [
  { img: steamDoor, title: "Steam Door", desc: "A steam door is essential for keeping steam in and preventing excess moisture from escaping, ensuring an optimal steam room experience." },
  { img: installStand, title: "Installation Stand", desc: "The steam generator installation stand provides a sturdy, durable base for secure support and efficient operation." },
  { img: aromaPump, title: "Aroma Pump", desc: "The pump can handle any aroma scent you would prefer to enjoy your tranquil steam room experience." },
  { img: demandButton, title: "Demand Button", desc: "The Demand Button lets users activate steam generation instantly, offering convenient control for a customized experience." },
  { img: venturiL, title: "Venturi Pipe L-shape", desc: "The Venturi Pipe draws air inside the tube, reducing the temperature by cooling the heated air molecules inside. The L-shape is ideal for compact installation." },
  { img: venturiStraight, title: "Venturi Pipe Straight", desc: "The Venturi Pipe draws air inside the tube, reducing the temperature by cooling the heated air molecules inside." },
];

const Steam = () => {
  return (
    <div className="relative">

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="stm-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="stm-hero-overlay" />
        <div className="stm-hero-content">
          <h1 className="stm-hero-title">STEAM</h1>
          <p className="stm-hero-subtitle">
            Experience the luxury of pure steam therapy
          </p>
          <div style={{ marginTop: "32px" }}>
            <a
              href="https://www.sawo.com/wp-content/uploads/2025/12/Steam-SaunaRV4_compressed.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="stm-brochure-btn"
            >
              VIEW BROCHURE
            </a>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* STEAM GENERATORS      */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="stm-group-title">Steam Generators</h2>
        <div className="stm-gen-grid">
          {generators.map((item, i) => (
            <div className="stm-gen-card" key={i}>
              <div className="stm-gen-img-wrap">
                <img src={item.img} alt={item.title} className="stm-gen-img" />
              </div>
              <div className="stm-gen-body">
                <h3 className="stm-gen-title">{item.title}</h3>
                <p className="stm-gen-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* STEAM CONTROLS        */}
      {/* ===================== */}
      <section className="stm-alt-section py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="stm-group-title">Steam Controls</h2>
          <div className="stm-cards-grid">
            {controls.map((item, i) => (
              <div className="stm-card" key={i}>
                <div className="stm-card-img-wrap">
                  <img src={item.img} alt={item.title} className="stm-card-img" />
                </div>
                <div className="stm-card-body">
                  <p className="stm-card-sub">{item.subtitle}</p>
                  <h3 className="stm-card-name">{item.title}</h3>
                  <p className="stm-card-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* STEAM ACCESSORIES     */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="stm-group-title">Steam Accessories</h2>
        <div className="stm-acc-grid">
          {accessories.map((item, i) => (
            <div className="stm-acc-card" key={i}>
              <div className="stm-acc-img-wrap">
                <img src={item.img} alt={item.title} className="stm-acc-img" />
              </div>
              <h3 className="stm-acc-title">{item.title}</h3>
              <p className="stm-acc-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

        /* --- Hero --- */
        .stm-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .stm-hero-content {
          position: relative;
          z-index: 1;
        }
        .stm-brochure-btn {
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
          display: inline-block;
          transition: all 0.3s ease;
        }
        .stm-brochure-btn:hover {
          background: #ffffff;
          color: #AA8161;
        }
        .stm-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .stm-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }

        /* --- Group titles --- */
        .stm-group-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 40px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e8d9cc;
        }

        /* --- Generator card grid --- */
        .stm-gen-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stm-gen-card {
          display: flex;
          flex-direction: column;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #ede5db;
          background: #fff;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .stm-gen-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 32px rgba(170,129,97,0.15);
        }
        .stm-gen-img-wrap {
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: hidden;
        }
        .stm-gen-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          transition: transform 0.4s ease;
        }
        .stm-gen-card:hover .stm-gen-img {
          transform: scale(1.06);
        }
        .stm-gen-body {
          padding: 16px 18px 20px;
          border-top: 1px solid #ede5db;
        }
        .stm-gen-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .stm-gen-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.7;
          margin: 0;
        }

        /* --- Controls section --- */
        .stm-alt-section {
          background: transparent;
        }
        .stm-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .stm-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #ede5db;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .stm-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 36px rgba(170,129,97,0.15);
        }
        .stm-card-img-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          height: 180px;
          overflow: hidden;
        }
        .stm-card-img {
          max-height: 140px;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }
        .stm-card:hover .stm-card-img {
          transform: scale(1.08);
        }
        .stm-card-body {
          padding: 20px 22px 24px;
        }
        .stm-card-sub {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: #AA8161;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .stm-card-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 10px;
        }

        /* --- Accessories grid --- */
        .stm-acc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        .stm-acc-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 20px;
          border-radius: 16px;
          border: 1px solid #ede5db;
          background: #ffffff;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .stm-acc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 36px rgba(170,129,97,0.15);
        }
        .stm-acc-img-wrap {
          width: 100%;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .stm-acc-img {
          max-height: 120px;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }
        .stm-acc-card:hover .stm-acc-img {
          transform: scale(1.08);
        }
        .stm-acc-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 10px;
        }
        .stm-acc-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.88rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.7;
          margin: 0;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .stm-hero-title { font-size: 28px; line-height: 36px; }
          .stm-hero-subtitle { font-size: 16px; line-height: 28px; }
          .stm-gen-grid { grid-template-columns: repeat(2, 1fr); }
          .stm-cards-grid { grid-template-columns: 1fr; }
          .stm-acc-grid { grid-template-columns: repeat(2, 1fr); }
          .stm-group-title { font-size: 1.4rem; }
        }
        @media (max-width: 480px) {
          .stm-gen-grid { grid-template-columns: 1fr; }
          .stm-acc-grid { grid-template-columns: 1fr; }
        }
      `}</style>

    </div>
  );
};

export default Steam;