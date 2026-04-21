import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

// ===== Import local images =====
// Steam
import steamGenerator from "../../assets/Home/Section3/steam-generator1.webp";
import steamControl from "../../assets/Home/Section3/SteamControlFinal.webp";
import steamAccessories from "../../assets/Home/Section3/ST-746-I_Display2.webp";

// Sauna Rooms
import standardSauna from "../../assets/Home/Section3/700x525.webp";
import glassFrontSauna from "../../assets/Home/Section3/GLASS-FRONT.webp";
import outdoorSauna from "../../assets/Home/Section3/700x525-outdoor-2.webp";
import infraredSaunaRoom from "../../assets/Home/Section3/INFRARED-SAUNA-ROOM.webp";

// Infrared
import infraredRooms from "../../assets/Home/Section3/SR06-44710101-1313LS_PERSPECTIVE-VIEW-1.webp";
import infraredPanels from "../../assets/Home/Section3/infrared-panelss-400x600px.webp";
import infraredControls from "../../assets/Home/Section3/IR-UI-V2.webp";

// Sauna Control
import saunovaSeries from "../../assets/Home/Section3/SAU-UI-V2_AspenSauna.webp";
import innovaSeries from "../../assets/Home/Section3/INC-S-V2_SpruceSauna.webp";
import controlAccessories from "../../assets/Home/Section3/sensor-holder.webp";

const Section3 = () => {
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

  return (
    <section className="section3-wrapper">
      {/* ================= STEAM ================= */}
      <h2 className="section-title">STEAM</h2>

      <div className="steam-grid">
        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/sawo-products/steam-sauna/steam-generators/"
        >
          <img src={steamGenerator} alt="Steam Generators" />
          <div className="steam-title">Steam Generators</div>
          <div className="steam-caption">
            The luxury of tailored steam from advanced steam generators for a spa-like experience. Customized settings and overall exceptional performance.
          </div>
        </a>

        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/sawo-products/steam-sauna/steam-controls/"
        >
          <img src={steamControl} alt="Steam Controls" />
          <div className="steam-title">Steam Controls</div>
          <div className="steam-caption">
            Precision, effortlessness, and personalization: Precise steam settings, effortless operation, and a personalized sauna experience from our Saunova and Innova control series.
          </div>
        </a>

        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/sawo-products/steam-sauna/steam-accessories/"
        >
          <img src={steamAccessories} alt="Steam Accessories" />
          <div className="steam-title">Steam Accessories</div>
          <div className="steam-caption">
            Premium accessories designed to enhance functionality and maximize comfort. Consistently extraordinary wellness and relaxation experience.
          </div>
        </a>
      </div>

      <div className="text-center mt-6">
        <a
          href="https://www.sawo.com/sawo-products/steam-sauna/"
          style={exploreBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#af8564")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
        >
          Explore More <FontAwesomeIcon icon={faChevronRight} />
        </a>
      </div>

      {/* ================= SAUNA ROOMS ================= */}
      <h2 className="section-title">SAUNA ROOMS</h2>

      <div className="steam-grid">
        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-rooms/standard-sauna-rooms/"
        >
          <img src={standardSauna} alt="Standard Sauna" />
          <div className="steam-title">Standard Sauna</div>
          <div className="steam-caption">
            Timeless design and high-quality materials. Classic indoor sauna experience for any home or wellness space.
          </div>
        </a>

        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/glass-front-sauna-rooms/"
        >
          <img src={glassFrontSauna} alt="Glass Front Sauna" />
          <div className="steam-title">Glass Front Sauna</div>
          <div className="steam-caption">
            Modern design featuring clear tempered glass panels for an unobstructed view outside. Pure serenity and relaxation.
          </div>
        </a>

        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/outdoor-sauna-rooms/"
        >
          <img src={outdoorSauna} alt="Outdoor Sauna" />
          <div className="steam-title">Outdoor Sauna</div>
          <div className="steam-caption">
            Engineered to withstand severe weather. Top-coated walls and durable asphalt-shingle roof for maximum protection from the sun and rain.
          </div>
        </a>

        <a
          className="steam-card has-caption"
          href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-rooms/infrared-sauna-rooms/"
        >
          <img src={infraredSaunaRoom} alt="Infrared Sauna" />
          <div className="steam-title">Infrared Sauna</div>
          <div className="steam-caption">
            Expertly crafted in cedar, aspen, and spruce. Gentle infrared warmth for soothing, therapeutic comfort.
          </div>
        </a>
      </div>

      <div className="text-center mt-6">
        <a
          href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-rooms/"
          style={exploreBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#af8564")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
        >
          Explore More <FontAwesomeIcon icon={faChevronRight} />
        </a>
      </div>

      {/* ================= INFRARED ================= */}
      <h2 className="section-title">INFRARED</h2>

      <div className="image-grid">
        <a href="https://www.sawo.com/infrared-sauna-rooms/" className="image-card">
          <img src={infraredRooms} alt="Infrared Rooms" />
          <div className="title">Infrared Rooms</div>
        </a>

        <a href="https://www.sawo.com/infrared-panels/" className="image-card">
          <img src={infraredPanels} alt="Infrared Panels" />
          <div className="title">Infrared Panels</div>
        </a>

        <a href="https://www.sawo.com/infrared-2-0-built-in-control/" className="image-card">
          <img src={infraredControls} alt="Infrared Controls" />
          <div className="title">Infrared Controls</div>
        </a>
      </div>

      <div className="text-center mt-6">
        <a
          href="https://www.sawo.com/infrared-sauna/"
          style={exploreBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#af8564")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
        >
          Explore More <FontAwesomeIcon icon={faChevronRight} />
        </a>
      </div>

      {/* ================= SAUNA CONTROL ================= */}
      <h2 className="section-title">SAUNA CONTROL</h2>

      <div className="image-grid">
        <a href="https://www.sawo.com/sawo-products/finnish-sauna/saunova-series/" className="image-card">
          <img src={saunovaSeries} alt="Saunova Series" />
          <div className="title">Saunova Series</div>
        </a>

        <a href="https://www.sawo.com/sawo-products/finnish-sauna/innova-series/" className="image-card">
          <img src={innovaSeries} alt="Innova Series" />
          <div className="title">Innova Series</div>
        </a>

        <a href="https://www.sawo.com/sawo-products/finnish-sauna/control-accessories/" className="image-card">
          <img src={controlAccessories} alt="Control Accessories" />
          <div className="title">Control Accessories</div>
        </a>
      </div>

      <style jsx>{`
        .section3-wrapper {
          font-family: "Montserrat", sans-serif;
          padding: 40px 0;
        }

        .section-title {
          text-align: center;
          font-size: 35px;
          font-weight: 500;
          color: rgb(175, 133, 100);
          margin: 60px 0 30px;
        }

        .steam-grid,
        .image-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .steam-card,
        .image-card {
          flex: 1 1 calc(25% - 20px);
          min-width: 220px;
          position: relative;
          overflow: hidden;
          border-radius: 4px;
        }

        img {
          width: 100%;
          display: block;
          transition: transform 0.6s ease;
        }

        .steam-card:hover img,
        .image-card:hover img {
          transform: scale(1.08);
        }

        .steam-title,
        .image-card .title {
          position: absolute;
          bottom: 0;
          width: 100%;
          text-align: center;
          color: #fff;
          padding: 16px;
          z-index: 2;
          font-size: clamp(14px, 2vw, 20px);
          font-weight: 500;
          text-transform: uppercase;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
        }

        .steam-card.has-caption::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
        }

        .steam-card.has-caption:hover::before {
          opacity: 1;
        }

        .steam-caption {
          position: absolute;
          inset: 0; 
          display: flex;
          align-items: center; 
          justify-content: center; 
          text-align: center;
          padding: 20px;
          color: #fff;
          opacity: 0;
          z-index: 2;
          transition: opacity 0.4s ease;
        }

        .steam-card.has-caption:hover .steam-caption {
          opacity: 1;
        }

        .steam-card.has-caption:hover .steam-title {
          opacity: 0;
        }

        @media (max-width: 768px) {
          .steam-card,
          .image-card {
            flex: 1 1 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default Section3;

