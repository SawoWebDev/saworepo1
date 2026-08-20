// HeatersCatalog.jsx — "/sauna-heaters"
// Full sidebar-navigable heaters catalog, structurally identical to
// AccessoriesCatalog.jsx ("/sauna-accessories") — hero + sticky category
// sidebar + one flat grid per series. This is the "View All Heaters"
// destination linked from SaunaHeaters.jsx and each individual heater
// series page, mirroring how AccessoriesCatalog.jsx is the "View All
// Accessories" destination for SaunaAccessories.jsx and its series pages.
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";
import SEO from "../components/SEO";
import { isPubliclyVisible } from "../local-storage/visibility";
import { useHeroLoaded } from "../utils/useHeroLoaded";
import heroImg from "../assets/NRM-NB-BL1.webp";
import HeroWave from "../components/HeroWave";
import { getPowerRange } from "../utils/productPower";
import { WALL_MOUNTED_FIXED_ORDER, groupWallMountedProducts } from "../utils/wallMountedGroups";

function getImageUrl(product, field) {
  const path = product?.[`local_${field}`] || product?.[field] || null;
  if (!path) return null;
  return path;
}

// Series groups — same category keys AllProducts.jsx already uses for its
// heater sidebar sections, kept lowercase/substring-matched so this reads
// whatever the CMS "categories" field already carries per product.
const HEATER_GROUPS = [
  { id: "section-wall-mounted", label: "Wall-Mounted Series", category: "wall-mounted" },
  { id: "section-tower",        label: "Tower Series",        category: "tower" },
  { id: "section-stone",        label: "Stone Series",        category: "stone" },
  { id: "section-floor",        label: "Floor Series",        category: "floor" },
  { id: "section-combi",        label: "Combi Series",        category: "combi" },
  { id: "section-dragonfire",   label: "Dragonfire Series",   category: "dragonfire" },
];

function HeaterCard({ product }) {
  const power = getPowerRange(product.tags);
  const image = getImageUrl(product, "thumbnail");

  return (
    <Link to={`/products/${product.slug}`} className="hc-card">
      <div className="hc-card-img-wrap">
        {image ? (
          <img src={image} alt={product.name} className="hc-card-img" loading="lazy" />
        ) : (
          <div className="hc-card-img-placeholder"><i className="fa-regular fa-image" /></div>
        )}
      </div>
      <p className="hc-card-name">{product.name}</p>
      {power && <p className="hc-card-power">{power}</p>}
    </Link>
  );
}

function CategorySection({ group, productsByGroup }) {
  const products = productsByGroup[group.id] || [];

  // The Wall-Mounted series has well-defined brand families (Nordex, Mini,
  // Scandia, Krios, Scandifire) — organize it the same way the dedicated
  // Wall-Mounted heaters page does, instead of one flat grid.
  if (group.category === "wall-mounted") {
    const brandGroups = groupWallMountedProducts(products);
    const brandNames = WALL_MOUNTED_FIXED_ORDER.filter(g => brandGroups[g]?.length);

    return (
      <div id={group.id} className="category-section">
        <div className="category-section-title">
          <h2>{group.label}</h2>
        </div>
        <div className="hc-brand-groups">
          {brandNames.map(brand => (
            <div className="hc-brand-group" key={brand}>
              <h3 className="hc-brand-title">{brand.toUpperCase()}</h3>
              <div className="hc-grid">
                {brandGroups[brand].map(product => (
                  <HeaterCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sorted = products
    .slice()
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div id={group.id} className="category-section">
      <div className="category-section-title">
        <h2>{group.label}</h2>
      </div>
      <div className="hc-grid">
        {sorted.map(product => (
          <HeaterCard key={product.id || product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

export default function HeatersCatalog({ showHero = true } = {}) {
  const { products: localProds, loading } = useLocalProducts();
  const [activeSection, setActiveSection] = useState(HEATER_GROUPS[0].id);
  const heroLoaded = useHeroLoaded(heroImg);

  const heaters = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => !isAccessoryProduct(p) && p.type !== "room" && isPubliclyVisible(p));
  }, [localProds]);

  const productsByGroup = useMemo(() => {
    const grouped = {};
    HEATER_GROUPS.forEach(group => {
      grouped[group.id] = heaters.filter(p =>
        p.categories?.some(c => c.toLowerCase().includes(group.category))
      );
    });
    return grouped;
  }, [heaters]);

  const groupCounts = useMemo(() => {
    const counts = {};
    HEATER_GROUPS.forEach(group => { counts[group.id] = (productsByGroup[group.id] || []).length; });
    return counts;
  }, [productsByGroup]);

  useEffect(() => {
    const handleScroll = () => {
      let closestSection = null;
      let closestOffset = Infinity;

      HEATER_GROUPS.forEach(group => {
        const element = document.getElementById(group.id);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closestSection = group.id;
        }
      });

      if (closestSection) setActiveSection(closestSection);
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
            height: 40, width: 200,
            background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
            backgroundSize: "200% 100%", animation: "hcSkeleton 1.4s infinite",
            borderRadius: 6, margin: "0 auto 40px",
          }} />
          <p style={{ color: "#a67853" }}>Loading heaters...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Sauna Heaters"
        description="Browse the full SAWO heaters catalog: Tower, Wall-Mounted, Stone, Floor, Combi, and Dragonfire series for every sauna size and style."
        path="/sauna-heaters"
      />
      <style>{`
        @keyframes hcSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .hc-grid {
          /* auto-FILL, not auto-fit: auto-fit collapses the empty tracks
             and stretches whatever is left, so a series holding one heater
             rendered a single card across the full content column — and
             .hc-card-img-wrap is aspect-ratio 1/1, so it came out as a
             giant square. auto-fill keeps the empty tracks, leaving a lone
             card at normal size and the rest of the row simply empty. */
          --hc-card-width: 220px;
          --hc-gap: 24px;
          --hc-max-cols: 5;
          display: grid;
          /* minmax(0, --hc-card-width), never 1fr: a 1fr max lets each track
             absorb the leftover space, which is how one card came out
             full-width and how two cards on a 1100px screen came out 328px
             each. A fixed max pins every card to the same size at every
             breakpoint; the leftover simply sits to the right. The 0 min
             lets the card shrink below that on a phone rather than
             overflow. */
          grid-template-columns: repeat(auto-fill, minmax(0, var(--hc-card-width)));
          justify-content: start;
          gap: var(--hc-gap);
          /* .heaters-wrapper has no max-width, so on a wide monitor this
             column would otherwise fit 6-8 tracks. Capping the grid holds
             it to --hc-max-cols columns at the card width. */
          /* min(100%, ...) not the calc alone: a bare max-width becomes the
             grid's max-content contribution, so .heaters-wrapper's 1fr track
             sized itself to 1196px even inside an 820px wrapper and the last
             cards were clipped. Wrapping in min() keeps the column cap while
             still yielding to a narrower container. */
          max-width: min(
            100%,
            calc(
              var(--hc-card-width) * var(--hc-max-cols)
              + var(--hc-gap) * (var(--hc-max-cols) - 1)
            )
          );
          /* Grid/flex children default to min-width:auto, which refuses to
             shrink below min-content — the other half of the same trap. */
          min-width: 0;
        }
        .hc-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          color: inherit;
        }
        .hc-card-img-wrap {
          width: 100%;
          aspect-ratio: 1/1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: transform 0.3s;
        }
        .hc-card:hover .hc-card-img-wrap { transform: scale(1.04); }
        .hc-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .hc-card-img-placeholder {
          color: #d5b99a;
          font-size: 2.5rem;
        }
        .hc-card-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #2c1a0e;
          margin: 12px 0 2px;
        }
        .hc-card-power {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.76rem;
          color: #a67853;
          margin: 0;
        }

        .heaters-wrapper {
          display: grid;
          grid-template-columns: 240px 1fr;
          align-items: start;
          gap: 60px;
          width: 100%;
          padding: 60px 60px 40px;
          min-height: 100vh;
        }

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

        .hc-brand-groups {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .hc-brand-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.04em;
          color: #2c1a0e;
          margin: 0 0 18px;
          padding-bottom: 10px;
          border-bottom: 1px solid #edddd0;
        }

        @media screen and (max-width: 1024px) {
          .heaters-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }
          .category-buttons-sidebar { display: none; }
        }

        @media screen and (max-width: 768px) {
          .heaters-wrapper { padding: 40px 24px 40px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        {showHero && (
          <div style={{
            position: "relative", width: "100%", padding: "140px 60px 60px",
            textAlign: "center", overflow: "hidden", backgroundColor: "#241c17",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${heroImg})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease",
            }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{
                fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#e8c8ab", margin: "0 0 12px",
              }}>
                Premium Collection
              </p>
              <h1 style={{
                fontSize: "2.4rem", fontWeight: 700, color: "#ffffff",
                margin: "0 0 16px", lineHeight: 1.2,
              }}>
                Sauna Heaters
              </h1>
              <p style={{
                fontSize: "1rem", color: "rgba(255,255,255,0.88)",
                margin: "0 auto 12px", maxWidth: 700, lineHeight: 1.6, textAlign: "center",
              }}>
                Discover our complete range of premium sauna heaters designed for every sauna size
                and style. Browse through our carefully curated Tower, Wall-Mounted, Stone, Floor,
                Combi, and Dragonfire series.
              </p>
            </div>

            <HeroWave />
          </div>
        )}

        <div className="heaters-wrapper" style={!showHero ? { paddingTop: 140 } : undefined}>
          <div className="category-buttons-sidebar">
            <h1 className="sidebar-header-title">Sauna Heaters</h1>
            <div className="sidebar-scroll">
              {HEATER_GROUPS.map(group => {
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

          <div className="main-content">
            {HEATER_GROUPS.map(group => {
              if ((groupCounts[group.id] || 0) === 0) return null;
              return (
                <CategorySection key={group.id} group={group} productsByGroup={productsByGroup} />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
