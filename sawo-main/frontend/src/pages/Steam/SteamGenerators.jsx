// SteamGenerators.jsx

import React from "react";
import heroImg from "../../assets/Steam/Steam Generators/STN-S.webp";
import stnS from "../../assets/Steam/Steam Generators/STN-S.webp";
import stnW from "../../assets/Steam/Steam Generators/STN-W.webp";
import stn from "../../assets/Steam/Steam Generators/STN.webp";
import ste from "../../assets/Steam/Steam Generators/STE.webp";

const generators = [
  {
    img: stnS,
    title: "STN-S Steam Generator",
    subtitle: "Precision Steam Control",
    desc: "The STN-S offers advanced steam control technology for residential and commercial steam rooms. Featuring precise digital controls and reliable performance, it delivers a consistently luxurious steam experience tailored to your needs.",
  },
  {
    img: stnW,
    title: "STN-W Steam Generator",
    subtitle: "Compact & Powerful",
    desc: "Designed for versatility, the STN-W combines a compact form factor with powerful steam output. Ideal for both home and professional installations, it ensures efficient performance and easy maintenance in any setting.",
  },
  {
    img: stn,
    title: "STN Steam Generator",
    subtitle: "Reliable Performance",
    desc: "The STN is engineered for consistent, dependable steam delivery across a wide range of room sizes. Built with durability in mind, it brings the authentic steam room experience to your space with effortless operation.",
  },
  {
    img: ste,
    title: "STE Steam Generator",
    subtitle: "Energy Efficient Excellence",
    desc: "The STE steam generator combines energy-efficient technology with premium performance. Its intelligent heating system minimises energy consumption while maximising steam output, making it the ideal choice for eco-conscious users.",
  },
];

const SteamGenerators = () => {
  return (
    <div className="relative">

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="sg-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="sg-hero-overlay" />
        <div className="sg-hero-content">
          <h1 className="sg-hero-title">STEAM GENERATORS</h1>
        </div>
      </section>

      {/* ===================== */}
      {/* INTRO                 */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h2 className="sg-section-title">Introducing Our Steam Generators</h2>
        <p className="sg-section-desc">
          Experience the luxury of tailored steam with our advanced steam
          generators, providing reliable performance, customizable settings,
          and rejuvenating warmth for any space.
        </p>
      </section>

      {/* ===================== */}
      {/* GENERATORS            */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="sg-grid">
          {generators.map((gen, i) => (
            <div
              className={`sg-row ${i % 2 === 1 ? "sg-row--reverse" : ""}`}
              key={i}
            >
              {/* Image */}
              <div className="sg-image-wrap">
                <img src={gen.img} alt={gen.title} className="sg-image" />
              </div>

              {/* Text */}
              <div className="sg-text">
                <p className="sg-eyebrow">{gen.subtitle}</p>
                <h3 className="sg-card-title">{gen.title}</h3>
                <p className="sg-card-desc">{gen.desc}</p>
              </div>
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
        .sg-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .sg-hero-content {
          position: relative;
          z-index: 1;
        }
        .sg-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }

        /* --- Intro --- */
        .sg-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          line-height: 1.2;
        }
        .sg-section-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
          max-width: 820px;
          margin: 0 auto;
        }

        /* --- Generator rows --- */
        .sg-grid {
          display: flex;
          flex-direction: column;
          gap: 80px;
        }
        .sg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .sg-row--reverse {
          direction: rtl;
        }
        .sg-row--reverse > * {
          direction: ltr;
        }

        /* --- Image --- */
        .sg-image-wrap {
          border-radius: 16px;
          overflow: hidden;
        }
        .sg-image {
          width: 100%;
          height: 380px;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }
        .sg-image-wrap:hover .sg-image {
          transform: scale(1.06);
        }

        /* --- Text --- */
        .sg-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: #AA8161;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .sg-card-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.9rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          line-height: 1.2;
        }
        .sg-card-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.98rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .sg-hero-title { font-size: 28px; line-height: 36px; }
          .sg-section-title { font-size: 1.7rem; }
          .sg-row {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .sg-row--reverse { direction: ltr; }
          .sg-image { height: 260px; }
          .sg-card-title { font-size: 1.5rem; }
        }
      `}</style>

    </div>
  );
};

export default SteamGenerators;