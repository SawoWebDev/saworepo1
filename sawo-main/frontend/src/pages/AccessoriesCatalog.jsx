import React, { useEffect, useState, useMemo } from "react";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";
import { AccessoryCard, ACCESSORY_CARD_CSS } from "./AccessoryCard";

// Groups that combine multiple data categories under one section with
// internal tabs mirror the WordPress reference pages that do the same
// (IndividualPages/pails.html -> Pails & Ladles, IndividualPages/benches.html
// -> Benches, Hangers & Floor Mats). Every other category matches a single
// WP display page 1:1 and gets one section, no tabs.
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

function CategorySection({ group, productsByTab, activeTab, onTabChange }) {
  const showTabs = group.tabs.length > 1;
  const activeProducts = productsByTab[activeTab] || [];

  return (
    <div id={group.id} className="category-section">
      <div className="category-section-title">
        <h2>{group.label}</h2>
      </div>

      {showTabs && (
        <div className="sawo-av-category-buttons">
          {group.tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`sawo-av-btn ${activeTab === tab.key ? "sawo-av-active" : ""}`}
              onClick={() => onTabChange(group.id, tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="sawo-av-grid">
        {activeProducts.map(product => (
          <AccessoryCard key={product.id || product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

export default function AccessoriesCatalog() {
  const { products: localProds, loading } = useLocalProducts();
  const [activeSection, setActiveSection] = useState(CATEGORY_GROUPS[0].id);
  const [activeTabs, setActiveTabs] = useState(() =>
    Object.fromEntries(CATEGORY_GROUPS.map(g => [g.id, g.tabs[0].key]))
  );

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

  // Pick each group's default active tab as the first one with products,
  // once data has loaded (avoids landing on an empty tab).
  useEffect(() => {
    if (!accessories.length) return;
    setActiveTabs(prev => {
      const next = { ...prev };
      CATEGORY_GROUPS.forEach(group => {
        const current = next[group.id];
        if ((productsByTab[current] || []).length > 0) return;
        const firstNonEmpty = group.tabs.find(t => (productsByTab[t.key] || []).length > 0);
        if (firstNonEmpty) next[group.id] = firstNonEmpty.key;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessories.length]);

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

  const handleTabChange = (groupId, tabKey) => {
    setActiveTabs(prev => ({ ...prev, [groupId]: tabKey }));
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
          gap: 60px;
          width: 100%;
          padding: 60px 60px 40px;
          min-height: 100vh;
        }

        .category-buttons-sidebar {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.07);
          border: 1px solid #edddd0;
          height: fit-content;
          position: sticky;
          top: 160px;
          max-height: calc(100vh - 180px);
          overflow: hidden;
        }

        .sidebar-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f0e8df;
        }

        .sidebar-header-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a67853;
          font-family: 'Montserrat', sans-serif;
          margin: 0 0 2px;
        }

        .sidebar-header-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #af8564;
          font-family: 'Montserrat', sans-serif;
          margin: 0;
        }

        .sidebar-scroll {
          overflow-y: auto;
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #e4d0bf;
          border-radius: 4px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #b5886b;
        }

        .sidebar-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 9px 12px 9px 14px;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: left;
          border-radius: 8px;
          border: none;
          color: #5a4030;
          background: transparent;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
          font-family: 'Montserrat', sans-serif;
          line-height: 1.35;
          gap: 8px;
        }

        .sidebar-btn::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 3px;
          height: 60%;
          background: #a67853;
          border-radius: 0 3px 3px 0;
          transition: transform 0.2s ease;
        }

        .sidebar-btn:hover {
          background: #faf4ef;
          color: #af8564;
        }

        .sidebar-btn:hover::before {
          transform: translateY(-50%) scaleY(0.6);
        }

        .sidebar-btn.active {
          background: #af8564;
          color: #ffffff;
          font-weight: 700;
        }

        .sidebar-btn.active::before {
          transform: translateY(-50%) scaleY(1);
          background: #d9c4b0;
        }

        .sidebar-btn-count {
          font-size: 0.65rem;
          font-weight: 600;
          color: #c4a882;
          background: #f5ede3;
          padding: 2px 7px;
          border-radius: 10px;
          flex-shrink: 0;
          transition: background 0.18s ease, color 0.18s ease;
          font-family: 'Montserrat', sans-serif;
        }

        .sidebar-btn.active .sidebar-btn-count {
          background: rgba(255,255,255,0.15);
          color: #f0e0cc;
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

        {/* Main Grid with Sidebar */}
        <div className="accessories-wrapper">
          {/* Sidebar */}
          <div className="category-buttons-sidebar">
            <div className="sidebar-header">
              <p className="sidebar-header-label">Browse by</p>
              <p className="sidebar-header-title">Categories</p>
            </div>
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
                    <span>{group.label}</span>
                    <span className="sidebar-btn-count">{count}</span>
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
                  activeTab={activeTabs[group.id]}
                  onTabChange={handleTabChange}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
