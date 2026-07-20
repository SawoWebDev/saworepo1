import React, { useEffect, useState, useMemo } from "react";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";
import { AccessoryCard, ACCESSORY_CARD_CSS } from "./AccessoryCard";

// Groups that combine multiple data categories under one section (mirroring
// the WordPress reference pages that group the same categories together —
// IndividualPages/pails.html -> Pails & Ladles, IndividualPages/benches.html
// -> Benches, Hangers & Floor Mats) simply merge every tab's products into
// one flat grid — no tab switcher, matching allaccs-display.html's plain
// per-section layout.
const CATEGORY_GROUPS = [
  {
    id: "section-pails",
    label: "Pails & Ladles",
    tabs: [
      { key: "pails", label: "Pails", category: "pails" },
      { key: "ladles", label: "Ladles", category: "ladles" },
      { key: "pail-shower", label: "Pail Shower", category: "pail shower" },
    ],
  },
  {
    id: "section-meters",
    label: "Thermometers & Combined Meters",
    tabs: [{ key: "meters", label: "Thermometers & Combined Meters", category: "thermometers" }],
  },
  {
    id: "section-clock-timer",
    label: "Clocks & Timers",
    tabs: [{ key: "clocks", label: "Clocks & Timers", category: "clocks & timers" }],
  },
  {
    id: "section-sauna-lights",
    label: "Sauna Lights",
    tabs: [{ key: "lights", label: "Sauna Lights", category: "sauna lights" }],
  },
  {
    id: "section-headrest-backrest",
    label: "Headrest & Backrests",
    tabs: [{ key: "headrest", label: "Headrest & Backrests", category: "headrest & backrest" }],
  },
  {
    id: "section-doors-handles",
    label: "Doors & Handles",
    tabs: [{ key: "doors", label: "Doors & Handles", category: "doors & handles" }],
  },
  {
    id: "section-benches",
    label: "Benches, Hangers & Floor Mats",
    tabs: [
      { key: "benches", label: "Benches", category: "benches" },
      { key: "hooks", label: "Hangers & Hook Racks", category: "cloth hangers" },
      { key: "floor-mats", label: "Floor Mat Tiles", category: "wooden floor mats" },
    ],
  },
  {
    id: "section-kivistone",
    label: "Kivistone",
    tabs: [{ key: "kivistone", label: "Kivistone", category: "kivistone" }],
  },
  {
    id: "section-vent-misc",
    label: "Ventilations & Miscellaneous Items",
    tabs: [{ key: "vent", label: "Ventilations & Miscellaneous Items", category: "ventilation & miscellaneous" }],
  },
  {
    id: "section-accessory-sets",
    label: "Accessory Sets",
    tabs: [{ key: "sets", label: "Accessory Sets", category: "accessory sets" }],
  },
];

function CategorySection({ group, productsByTab }) {
  const products = group.tabs.flatMap(tab => productsByTab[tab.key] || []);

  return (
    <div id={group.id} className="category-section">
      <div className="category-section-title">
        <h2>{group.label}</h2>
      </div>

      <div className="sawo-av-grid">
        {products.map(product => (
          <AccessoryCard key={product.id || product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

export default function AccessoriesCatalog({ showHero = true } = {}) {
  const { products: localProds, loading } = useLocalProducts();
  const [activeSection, setActiveSection] = useState(CATEGORY_GROUPS[0].id);

  const accessories = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(
      p =>
        isAccessoryProduct(p) &&
        p.status === "published" &&
        p.visible !== false
    );
  }, [localProds]);

  // Flat map of every tab's own product list, keyed by tab key.
  const productsByTab = useMemo(() => {
    const grouped = {};
    CATEGORY_GROUPS.forEach(group => {
      group.tabs.forEach(tab => {
        grouped[tab.key] = accessories.filter(p =>
          p.categories?.some(c => c.toLowerCase() === tab.category)
        );
      });
    });
    return grouped;
  }, [accessories]);

  const groupCounts = useMemo(() => {
    const counts = {};
    CATEGORY_GROUPS.forEach(group => {
      counts[group.id] = group.tabs.reduce((sum, tab) => sum + (productsByTab[tab.key] || []).length, 0);
    });
    return counts;
  }, [productsByTab]);

  // Scroll tracking for sidebar
  useEffect(() => {
    const handleScroll = () => {
      let closestSection = null;
      let closestOffset = Infinity;

      CATEGORY_GROUPS.forEach(group => {
        const element = document.getElementById(group.id);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const offset = Math.abs(rect.top);

        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closestSection = group.id;
        }
      });

      if (closestSection) {
        setActiveSection(closestSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSidebarClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 120 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <div style={{
            height: 40,
            width: 200,
            background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
            backgroundSize: "200% 100%",
            animation: "skS 1.4s infinite",
            borderRadius: 6,
            margin: "0 auto 40px",
          }} />
          <p style={{ color: "#a67853" }}>Loading accessories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes skS {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        ${ACCESSORY_CARD_CSS}

        .accessories-wrapper {
          display: grid;
          grid-template-columns: 240px 1fr;
          align-items: start;
          gap: 60px;
          width: 100%;
          padding: 60px 60px 40px;
          min-height: 100vh;
        }

        /* Sidebar — ported from IndividualPages/allaccs-display.html's
           .sawo-acc-sidebar / .acc-nav-btn design. */
        .category-buttons-sidebar {
          position: sticky;
          top: 160px;
          flex-shrink: 0;
          max-height: calc(100vh - 180px);
          overflow-y: auto;
          background: #ffffff;
          padding: 20px 12px 16px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.10);
          border: 1px solid rgba(0,0,0,0.07);
          scrollbar-width: thin;
          scrollbar-color: #d9c4b0 transparent;
        }

        .category-buttons-sidebar::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #d9c4b0 0%, #c8aa88 100%);
          border-radius: 12px 12px 0 0;
        }

        .sidebar-header-title {
          font-family: 'Montserrat', sans-serif;
          font-style: normal;
          font-weight: 600;
          font-size: 18px;
          color: rgb(175, 133, 100);
          text-align: center;
          display: block;
          width: 100%;
          margin: 0 0 24px;
          line-height: 1.3;
        }

        .sidebar-scroll {
          display: flex;
          flex-direction: column;
        }

        .sidebar-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          padding: 10px 14px;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 500;
          font-family: 'Montserrat', sans-serif;
          text-align: left;
          border-radius: 8px;
          border: none;
          color: #2c3e50;
          background-color: #f8f9fa;
          cursor: pointer;
          transition: color 0s, background 0s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: normal;
          line-height: 1.3;
          min-height: 42px;
          overflow: hidden;
        }

        .sidebar-btn::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 0;
          background: #b5886b;
          border-radius: 0 3px 3px 0;
          transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-btn:hover {
          background: linear-gradient(135deg, #d9c4b0 0%, #c8aa88 100%);
          color: #ffffff;
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(181,136,107,0.3);
        }

        .sidebar-btn:hover::before { height: 60%; background: #fff; }

        .sidebar-btn.active {
          background: linear-gradient(135deg, #af8564 0%, #9a7558 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(175,133,100,0.4);
          font-weight: 600;
        }

        .sidebar-btn.active::before {
          height: 100%;
          background: #fff;
          opacity: 0.4;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .category-section {
          scroll-margin-top: 160px;
        }

        .category-section-title {
          margin-bottom: 24px;
        }

        .category-section-title h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #af8564;
          margin: 0 0 8px;
          line-height: 1.2;
          font-family: 'Montserrat', sans-serif;
        }

        @media screen and (max-width: 1024px) {
          .accessories-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }

          .category-buttons-sidebar {
            display: none;
          }
        }

        @media screen and (max-width: 768px) {
          .accessories-wrapper {
            padding: 40px 24px 40px;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        {/* Header Section */}
        {showHero && (
          <div style={{
            width: "100%",
            padding: "140px 60px 60px",
            textAlign: "center",
            borderBottom: "1px solid #edddd0",
          }}>
            <p style={{
              fontSize: "0.67rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a67853",
              margin: "0 0 12px",
            }}>
              Premium Collection
            </p>
            <h1 style={{
              fontSize: "2.4rem",
              fontWeight: 700,
              color: "#af8564",
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}>
              Sauna & Steam Accessories
            </h1>
            <p style={{
              fontSize: "1rem",
              color: "#5a4030",
              margin: "0 auto 12px",
              maxWidth: 700,
              lineHeight: 1.6,
              textAlign: "center",
            }}>
              Discover our complete range of premium sauna and steam accessories designed to enhance your wellness experience. Browse through our carefully curated selection of high-quality products.
            </p>
          </div>
        )}

        {/* Main Grid with Sidebar */}
        <div className="accessories-wrapper" style={!showHero ? { paddingTop: 140 } : undefined}>
          {/* Sidebar */}
          <div className="category-buttons-sidebar">
            <h1 className="sidebar-header-title">Sauna Accessories</h1>
            <div className="sidebar-scroll">
              {CATEGORY_GROUPS.map(group => {
                const count = groupCounts[group.id] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={group.id}
                    className={`sidebar-btn ${activeSection === group.id ? "active" : ""}`}
                    onClick={() => handleSidebarClick(group.id)}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {CATEGORY_GROUPS.map(group => {
              if ((groupCounts[group.id] || 0) === 0) return null;
              return (
                <CategorySection
                  key={group.id}
                  group={group}
                  productsByTab={productsByTab}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
