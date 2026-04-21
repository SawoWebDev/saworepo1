// WoodPanelandTimbers.jsx

import React from "react";
import heroBg from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/hero.webp";
import cedarWood from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/cedar-wood.png";
import aspenWood from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/aspen-wood.png";
import spruceWood from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/spruce-wood.png";
import benchCedar from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/bench-cedar-wood.webp";
import benchAspen from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/bench-aspen-wood.webp";
import benchSpruce from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/bench-spruce-wood.webp";
import ButtonClear from "../../../components/Buttons/ButtonClear";

const panelData = [
  {
    img: cedarWood,
    title: "Cedar Wood",
    desc: "Beautifully toned Cedar has a pleasant and natural scent which is known to repel insects. SAWO Cedar materials are knot-free and carefully selected to guarantee the best quality.",
    headers: ["Profile", "Width (mm)", "Thickness (mm)", "Length (mm)"],
    rows: [["STV", "106", "13.8", "1800 / 2100 / 2400"]],
  },
  {
    img: aspenWood,
    title: "Aspen Wood",
    desc: "Aspen wood is white and soft which is cool to touch and has low flammability. The selected Sawo Aspen does not have any visible knots.",
    headers: ["Profile", "Width (mm)", "Thickness (mm)", "Length (mm)"],
    rows: [["STV", "106", "13.8", "1800 / 2100 / 2400"]],
  },
  {
    img: spruceWood,
    title: "Spruce Wood",
    desc: "Spruce is a softwood with uniform grain texture. A durable wood that withstands heat well and is used widely in saunas. Typically spruce wood has some small knots.",
    headers: ["Profile", "Width (mm)", "Thickness (mm)", "Length (mm)"],
    rows: [["STP", "95", "13.8", "2100"]],
  },
];

const benchData = [
  {
    img: benchCedar,
    title: "Cedar Wood",
    desc: "Western Red Cedar wood is valued for its unique appearance, aroma, and its high natural resistance to decay. Highly recommended for house interiors and saunas. Sawo selects to use only the high quality Cedar, which don't have any knots or defects.",
    headers: ["Width (mm)", "Thickness (mm)", "Length (mm)"],
    rows: [
      ["44", "22/28", "1800 / 2100 / 2400"],
      ["70", "22/28", "1800 / 2100 / 2400"],
      ["90", "22/28", "1800 / 2100 / 2400"],
      ["90", "44", "1800 / 2100 / 2400"],
    ],
  },
  {
    img: benchAspen,
    title: "Aspen Wood",
    desc: "Aspen wood is white and soft which is cool to touch and has low flammability. The selected Sawo Aspen does not have any visible knots.",
    headers: ["Width (mm)", "Thickness (mm)", "Length (mm)"],
    rows: [["90", "22", "1800 / 2100 / 2400"]],
  },
  {
    img: benchSpruce,
    title: "Spruce Wood",
    desc: "Spruce is a softwood with uniform grain texture. A durable and strong wood that withstands heat. Typically spruce wood has some small natural knots.",
    headers: ["Width (mm)", "Thickness (mm)", "Length (mm)"],
    rows: [["90", "22", "1800 / 2100 / 2400"]],
  },
];

const WoodCard = ({ item, reverse }) => (
  <div className={`wpt-card-row ${reverse ? "wpt-card-row--reverse" : ""}`}>
    {/* Image */}
    <div className="wpt-card-image-wrap">
      <img src={item.img} alt={item.title} className="wpt-card-image" />
    </div>

    {/* Text + Table */}
    <div className="wpt-card-content">
      <h3 className="wpt-card-title">{item.title}</h3>
      <p className="wpt-card-desc">{item.desc}</p>

      <div className="wpt-table-wrap">
        <table className="wpt-table">
          <thead>
            <tr>
              {item.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const WoodPanelandTimbers = () => {
  return (
    <div className="relative">

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="wpt-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="wpt-hero-overlay" />
        <div className="wpt-hero-content">
          <h1 className="wpt-hero-title">WOOD PANELS & TIMBERS</h1>
          <p className="wpt-hero-subtitle">
            Premium wood materials for your perfect sauna
          </p>
          <div style={{ marginTop: "32px" }}>
            <ButtonClear
              text="VIEW BROCHURE"
              href="https://www.sawo.com/wp-content/uploads/2025/12/Panels-TimbersRV4_compressed.pdf"
              download
            />
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* INTRO                 */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h2 className="wpt-section-title">
          Explore Our Premium Wood Panels & Timbers Selection
        </h2>
        <p className="wpt-section-desc">
          Crafted for both beauty and durability, our high-quality wood panels
          and timbers enhance any sauna space. Choose from a variety of premium
          wood options, including Cedar, Aspen, and Spruce, designed to
          withstand heat and moisture while providing a natural, relaxing
          ambiance.
        </p>
      </section>

      {/* ===================== */}
      {/* WOOD PANELS           */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <h2 className="wpt-group-title">Wood Panels</h2>
        <div className="wpt-cards-grid">
          {panelData.map((item, i) => (
            <WoodCard key={i} item={item} reverse={i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* BENCH TIMBERS         */}
      {/* ===================== */}
      <section className="wpt-bench-section py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="wpt-group-title">Bench Timbers</h2>
          <div className="wpt-cards-grid">
            {benchData.map((item, i) => (
              <WoodCard key={i} item={item} reverse={i % 2 === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

        /* --- Hero --- */
        .wpt-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.42);
          z-index: 0;
        }
        .wpt-hero-content {
          position: relative;
          z-index: 1;
        }
        .wpt-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .wpt-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }

        /* --- Intro --- */
        .wpt-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          line-height: 1.2;
        }
        .wpt-section-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
        }

        /* --- Group headings --- */
        .wpt-group-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #AA8161;
          margin-bottom: 40px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e8d9cc;
        }
        .wpt-group-title--light {
          color: #AA8161;
          border-bottom-color: #e8d9cc;
        }

        /* --- Card rows --- */
        .wpt-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 70px;
        }
        .wpt-card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .wpt-card-row--reverse {
          direction: rtl;
        }
        .wpt-card-row--reverse > * {
          direction: ltr;
        }

        /* --- Image --- */
        .wpt-card-image-wrap {
          border-radius: 16px;
          overflow: hidden;
        }
        .wpt-card-image {
          width: 100%;
          height: 360px;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }
        .wpt-card-image-wrap:hover .wpt-card-image {
          transform: scale(1.06);
        }

        /* --- Text --- */
        .wpt-card-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 2.5px;
          color: #AA8161;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .wpt-card-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.9rem;
          font-weight: 700;
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .wpt-card-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 400;
          color: #141617;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        /* --- Table --- */
        .wpt-table-wrap {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #e8d9cc;
        }
        .wpt-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.88rem;
        }
        .wpt-table thead tr {
          background: linear-gradient(135deg, #AA8161 0%, #c4a077 100%);
        }
        .wpt-table thead th {
          color: #ffffff;
          font-weight: 600;
          padding: 11px 16px;
          text-align: center;
          white-space: nowrap;
        }
        .wpt-table tbody tr {
          background: #ffffff;
          transition: background 0.2s ease;
        }
        .wpt-table tbody tr:nth-child(even) {
          background: #faf6f2;
        }
        .wpt-table tbody tr:hover {
          background: #f3ece4;
        }
        .wpt-table tbody td {
          color: #141617;
          font-weight: 400;
          padding: 10px 16px;
          border-bottom: 1px solid #ede5db;
          text-align: center;
        }
        .wpt-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* --- Bench section bg --- */
        .wpt-bench-section {
          background: transparent;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .wpt-hero-title { font-size: 28px; line-height: 36px; }
          .wpt-hero-subtitle { font-size: 16px; line-height: 28px; }
          .wpt-section-title { font-size: 1.6rem; }
          .wpt-card-row {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .wpt-card-row--reverse { direction: ltr; }
          .wpt-card-image { height: 240px; }
          .wpt-card-title { font-size: 1.5rem; }
          .wpt-group-title { font-size: 1.4rem; }
        }
      `}</style>

    </div>
  );
};

export default WoodPanelandTimbers;