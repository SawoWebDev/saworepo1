// WoodPanelandTimbers.jsx

import React from "react";
import heroBg from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/hero.webp";
import cedarWood from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/cedar-wood.webp";
import aspenWood from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/aspen-wood.webp";
import spruceWood from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/spruce-wood.webp";
import benchCedar from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/bench-cedar-wood.webp";
import benchAspen from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/bench-aspen-wood.webp";
import benchSpruce from "../../../assets/Sauna/Sauna Rooms/Wood Panels & Timbers/bench-spruce-wood.webp";
import BrochureDropdownButton from "../../../components/Buttons/BrochureDropdownButton";
import HeroWave from "../../../components/HeroWave";
import SEO from "../../../components/SEO";
import { useHeroLoaded } from "../../../utils/useHeroLoaded";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

function buildPanelData(t) {
  const headers = [
    t("woodPanelsPage.tableHeaders.profile"),
    t("woodPanelsPage.tableHeaders.width"),
    t("woodPanelsPage.tableHeaders.thickness"),
    t("woodPanelsPage.tableHeaders.length"),
  ];
  return [
    {
      img: cedarWood,
      title: t("woodPanelsPage.panels.cedar.title"),
      desc: t("woodPanelsPage.panels.cedar.desc"),
      headers,
      rows: [["STV", "106", "13.8", "1800 / 2100 / 2400"]],
    },
    {
      img: aspenWood,
      title: t("woodPanelsPage.panels.aspen.title"),
      desc: t("woodPanelsPage.panels.aspen.desc"),
      headers,
      rows: [["STV", "106", "13.8", "1800 / 2100 / 2400"]],
    },
    {
      img: spruceWood,
      title: t("woodPanelsPage.panels.spruce.title"),
      desc: t("woodPanelsPage.panels.spruce.desc"),
      headers,
      rows: [["STP", "95", "13.8", "2100"]],
    },
  ];
}

function buildBenchData(t) {
  const headers = [
    t("woodPanelsPage.tableHeaders.width"),
    t("woodPanelsPage.tableHeaders.thickness"),
    t("woodPanelsPage.tableHeaders.length"),
  ];
  return [
    {
      img: benchCedar,
      title: t("woodPanelsPage.bench.cedar.title"),
      desc: t("woodPanelsPage.bench.cedar.desc"),
      headers,
      rows: [
        ["44", "22/28", "1800 / 2100 / 2400"],
        ["70", "22/28", "1800 / 2100 / 2400"],
        ["90", "22/28", "1800 / 2100 / 2400"],
        ["90", "44", "1800 / 2100 / 2400"],
      ],
    },
    {
      img: benchAspen,
      title: t("woodPanelsPage.bench.aspen.title"),
      desc: t("woodPanelsPage.bench.aspen.desc"),
      headers,
      rows: [["90", "22", "1800 / 2100 / 2400"]],
    },
    {
      img: benchSpruce,
      title: t("woodPanelsPage.bench.spruce.title"),
      desc: t("woodPanelsPage.bench.spruce.desc"),
      headers,
      rows: [["90", "22", "1800 / 2100 / 2400"]],
    },
  ];
}

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
  const heroLoaded = useHeroLoaded(heroBg);
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();
  const panelData = buildPanelData(t);
  const benchData = buildBenchData(t);

  return (
    <div className="relative">
      <SEO
        title={t("woodPanelsPage.meta.title")}
        description={t("woodPanelsPage.meta.description")}
        path={localize("/sauna/rooms/wood-panels-timbers")}
        hreflangAlternates={{ en: "/sauna/rooms/wood-panels-timbers", zh: "/zh/sauna/rooms/wood-panels-timbers" }}
      />

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="wpt-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }} // warm-dark placeholder so it doesn't flash gray before the hero image decodes
      >
        {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />
        <div className="wpt-hero-overlay" />
        <div className="wpt-hero-content">
          <h1 className="wpt-hero-title">{t("woodPanelsPage.hero.title")}</h1>
          <p className="wpt-hero-subtitle">
            {t("woodPanelsPage.hero.subtitle")}
          </p>
          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text={tc("viewBrochure")}
              items={[{
                label: t("woodPanelsPage.brochureLabel"),
                href: "https://www.sawo.com/wp-content/uploads/2025/12/Panels-TimbersRV4_compressed.pdf",
              }]}
            />
          </div>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* INTRO                 */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h2 className="wpt-section-title">
          {t("woodPanelsPage.intro.title")}
        </h2>
        <p className="wpt-section-desc">
          {t("woodPanelsPage.intro.desc")}
        </p>
      </section>

      {/* ===================== */}
      {/* WOOD PANELS           */}
      {/* ===================== */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <h2 className="wpt-group-title">{t("woodPanelsPage.panelsHeading")}</h2>
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
          <h2 className="wpt-group-title">{t("woodPanelsPage.benchHeading")}</h2>
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