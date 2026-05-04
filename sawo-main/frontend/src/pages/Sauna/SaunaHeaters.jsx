// SaunaHeaters.jsx

import React from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";
import ButtonBrown from "../../components/Buttons/ButtonBrown";
import CirclesInfo from "../../components/CirclesInfo";
import menuPaths from "../../menuPaths";

const SaunaHeaters = () => {
  return (
    <div className="relative">

      {/* ===================== */}
      {/* HERO SECTION          */}
      {/* ===================== */}
      <section
        className="sh-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(https://www.sawo.com/wp-content/uploads/2025/02/NRM-NB-BL1.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="sh-hero-overlay" />
        <div className="sh-hero-content">
          <h1 className="sh-hero-title">SAUNA HEATERS</h1>
          <div style={{ marginTop: "32px" }}>
            <ButtonClear
              text="EXPLORE PRODUCTS"
              href="https://www.sawo.com/sauna-products/"
            />
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 1: WHY SAWO  */}
      {/* ===================== */}
      <section className="sh-why-section max-w-[1200px] mx-auto px-6 py-20">
        <div className="sh-why-grid">
          {/* Left */}
          <div className="sh-why-left">
            <p className="sh-why-eyebrow">SAWO HEATERS</p>
            <h2 className="sh-why-title">Why Choose SAWO Heaters</h2>
            <p className="sh-why-desc">
              SAWO heaters combine durability, energy efficiency, and modern
              design, offering consistent performance for a reliable, superior
              sauna experience every time.
            </p>
          </div>

          {/* Right — placeholder for CirclesInfo */}
          <div className="sh-why-right">
            <CirclesInfo />
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 2: VIDEO      */}
      {/* ===================== */}
      <section className="sh-video-section max-w-[1200px] mx-auto px-6 pb-20">
        <div className="sh-video-grid">
          {/* Left — video */}
          <div className="sh-video-wrapper">
            <video
              className="sh-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://www.sawo.com/wp-content/uploads/2025/08/NORDEX-MINI-COMBI-BLACK-HEATER.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          {/* Right — text */}
          <div className="sh-video-text">
            <h2 className="sh-video-title">Who can use SAWO heaters?</h2>
            <p className="sh-video-desc">
              We offer a wide range of choices for hotels, spas, gyms, and
              private residential saunas. From small to towering, simple to
              stylish, showstopping to concealed, we have the right heater for
              you.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 3: HEATERS    */}
      {/* ===================== */}
      <section className="sh-heaters-section max-w-[1200px] mx-auto px-6 pb-20">

        {/* sawo-sec heaters grid */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap');

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
            text-decoration: none;
            color: inherit;
          }
          .sawo-sec .sawo-card img {
            width: 100%;
            height: auto;
            transition: transform .5s ease;
            border-radius: 6px;
          }
          .sawo-sec .sawo-card:hover img { transform: scale(1.05); }
          .sawo-sec .sawo-title {
            font-family: 'Montserrat', sans-serif !important;
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
          @media (min-width: 1280px) {
            .sawo-sec.heaters .sawo-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 480px) {
            .sawo-sec .sawo-grid { padding: 0 10px; }
          }
        `}</style>

        <div className="sawo-sec heaters">
          <div className="sawo-grid">

            <a className="sawo-card" href={menuPaths.sauna.heaters.tower}>
              <figure>
                <img
                  src="https://www.sawo.com/wp-content/uploads/2025/04/TOWER-SERIES-2-600x360-1.webp"
                  alt="SAWO Tower Series sauna heater stone pillar design"
                  title="SAWO Tower Series Sauna Heater"
                  loading="lazy"
                />
                <figcaption>
                  <h2 className="sawo-title">Tower Series</h2>
                  <p className="sawo-caption">SAWO Tower heaters are best described as "sauna stone pillars." Strong, stainless steel rings hold massive amounts of stones. These heaters are designed to circulate steam evenly from the lowest to the highest part of the sauna room.</p>
                </figcaption>
              </figure>
            </a>

            <a className="sawo-card" href={menuPaths.sauna.heaters.floor}>
              <figure>
                <img
                  src="https://www.sawo.com/wp-content/uploads/2025/05/FLOOR-MOUNTED-SERIES1-1024x614-1.webp"
                  alt="SAWO Floor Series stand-alone sauna heater"
                  title="SAWO Floor Series Sauna Heater"
                  loading="lazy"
                />
                <figcaption>
                  <h2 className="sawo-title">Floor Series</h2>
                  <p className="sawo-caption">Our Floor series features movable, sleek, and durable high-performance standalone heaters that ensure optimal heat distribution and comfort. Due to having more heater placement options, the heaters allow for a more customized look of the sauna room.</p>
                </figcaption>
              </figure>
            </a>

            <a className="sawo-card" href={menuPaths.sauna.heaters.wallMounted}>
              <figure>
                <img
                  src="https://www.sawo.com/wp-content/uploads/2025/09/WALL-MOUNTED-SERIES-v2-1.webp"
                  alt="SAWO Wall Mounted Series compact sauna heater modern design"
                  title="SAWO Wall Mounted Sauna Heater"
                  loading="lazy"
                />
                <figcaption>
                  <h2 className="sawo-title">Wall Mounted Series</h2>
                  <p className="sawo-caption">SAWO Wall-mounted heaters are all about strong performance in a compact size. For added safety, most of our wall-mounted heaters are available with cool-to-touch fiber coating to help prevent accidental burns.</p>
                </figcaption>
              </figure>
            </a>

            <a className="sawo-card" href={menuPaths.sauna.heaters.combi}>
              <figure>
                <img
                  src="https://www.sawo.com/wp-content/uploads/2025/04/COMBI-SERIES-600x360-1.webp"
                  alt="SAWO Combi Series sauna heater with integrated steamer"
                  title="SAWO Combi Series Sauna Heater"
                  loading="lazy"
                />
                <figcaption>
                  <h2 className="sawo-title">Combi Series</h2>
                  <p className="sawo-caption">Versatile electric heaters with integrated steamers, offering traditional and steam sauna options with aroma oil basins for added luxury.</p>
                </figcaption>
              </figure>
            </a>

            <a className="sawo-card" href={menuPaths.sauna.heaters.dragonfire}>
              <figure>
                <img
                  src="https://www.sawo.com/wp-content/uploads/2025/04/DRAGON-SERIES-1-600x360-1.webp"
                  alt="SAWO Dragonfire Series sauna heater designed by Stefan Lindfors"
                  title="SAWO Dragonfire Sauna Heater"
                  loading="lazy"
                />
                <figcaption>
                  <h2 className="sawo-title">Dragonfire Series</h2>
                  <p className="sawo-caption">Elevate your sauna experience with the SAWO Dragonfire series, crafted by renowned Finnish designer Stefan Lindfors for modern living.</p>
                </figcaption>
              </figure>
            </a>

            <a className="sawo-card" href={menuPaths.sauna.heaters.stone}>
              <figure>
                <img
                  src="https://www.sawo.com/wp-content/uploads/2025/06/STONE-SERIES-3-600x320-new-.webp"
                  alt="SAWO Stone Series sauna heater stainless steel with Finnish soapstone"
                  title="SAWO Stone Series Sauna Heater"
                  loading="lazy"
                />
                <figcaption>
                  <h2 className="sawo-title">Stone Series</h2>
                  <p className="sawo-caption">Made of Finnish soapstone, the SAWO Stone Heaters have exceptional heat-storing and conducting properties. Their gentle heat provides a consistent and long-lasting sauna experience.</p>
                </figcaption>
              </figure>
            </a>

          </div>
        </div>

        {/* Centred catalogue button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          <ButtonBrown
            text="View Catalogue"
            href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf"
            download
          />
        </div>

      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

        /* ---- Hero ---- */
        .sh-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .sh-hero-content {
          position: relative;
          z-index: 1;
        }
        .sh-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }

        /* ---- Section 1 ---- */
        .sh-why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .sh-why-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: #af8564;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .sh-why-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.4rem;
          font-weight: 700;
          color: #8b5e3c;
          line-height: 1.2;
          margin-bottom: 20px;
        }
        .sh-why-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
        }

        /* ---- Section 2 ---- */
        .sh-video-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .sh-video-wrapper {
          border-radius: 16px;
          overflow: hidden;
        }
        .sh-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .sh-video-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.4rem;
          font-weight: 700;
          color: #8b5e3c;
          line-height: 1.2;
          margin-bottom: 20px;
        }
        .sh-video-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
        }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .sh-hero-title {
            font-size: 28px;
            line-height: 36px;
          }
          .sh-why-grid,
          .sh-video-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .sh-why-title,
          .sh-video-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

    </div>
  );
};

export default SaunaHeaters;