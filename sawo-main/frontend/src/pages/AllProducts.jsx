import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { isAccessoryProduct } from "./IndividualDisplay/DispAccessories";
import ScrollToTop from "../components/ScrollToTop";
import SEO from "../components/SEO";
import CategoryHero from "../components/CategoryHero";
import heroImg from "../assets/NRM-NB-BL1.webp";
import { isPubliclyVisible } from "../local-storage/visibility";
import { variantRank } from "../utils/wallMountedGroups";

const HEATER_SECTIONS = [
  { label: "Wall-Mounted", id: "heater-wall-mounted", category: "wall-mounted" },
  { label: "Tower",        id: "heater-tower",        category: "tower" },
  { label: "Stone",        id: "heater-stone",        category: "stone" },
  { label: "Floor",        id: "heater-floor",        category: "floor" },
  { label: "Combi",        id: "heater-combi",        category: "combi" },
  { label: "Dragonfire",   id: "heater-dragonfire",   category: "dragonfire" },
];

const ROOM_SECTIONS = [
  { label: "Standard",    id: "room-standard",    match: p => p.room_type === "standard"    || p.room_type === "traditional" || (p.categories || []).some(c => c.toLowerCase() === "standard") },
  { label: "Glass Front", id: "room-glass-front", match: p => p.room_type === "glassfront"  || p.room_type === "glass-front"  || (p.categories || []).some(c => c.toLowerCase().replace(/\s+/g, "") === "glassfront") },
  { label: "Infrared",    id: "room-infrared",    match: p => p.room_type === "infrared"    || (p.categories || []).some(c => c.toLowerCase() === "infrared") },
];

// Matches the category set UserManuals.jsx's CATEGORY_TABS exposes, so the
// full catalogue (not just heaters/rooms/general accessories) is reachable
// from /products.
const TAB_DEFS = [
  { id: "heaters", label: "Sauna Heaters" },
  { id: "rooms", label: "Sauna Rooms" },
  { id: "sauna-controls", label: "Sauna Controls" },
  { id: "steam-generators", label: "Steam Generators" },
  { id: "steam-controls", label: "Steam Generator Controls" },
  { id: "heater-accessories", label: "Heater Accessories" },
  { id: "accessories", label: "Accessories" },
];

// Sub-grouping for the "Sauna Controls" tab — same keyword groups as
// SaunaControls.jsx ("/sauna/controls"), so a flat pile of 20+ controls,
// sensors, and spare parts reads the same way here as it does there.
// Order matters: narrow/specific groups must come before the broad brand
// ones (see SaunaControls.jsx for why).
const SAUNA_CONTROLS_ORDER = ["Coming Soon", "Saunova Series", "Innova Series", "Control Spare Parts", "Interface Holder", "Sensor"];
const SAUNA_CONTROLS_KEYWORDS = {
  "Coming Soon":         ["SAWO Sense", "Saunova 2.0 PLUS", "Coming Soon"],
  "Control Spare Parts": ["Spare", "RJ12", "Extension Module", "Silicon Wire"],
  "Interface Holder":    ["Interface Holder", "Holder"],
  "Sensor":              ["Sensor", "Temperature", "Humidity"],
  "Saunova Series":      ["Saunova", "SAU-"],
  "Innova Series":       ["Innova", "INC-", "INP-", "INT-"],
};
const SAUNA_CONTROLS_NAME_ONLY = new Set(["Saunova Series", "Innova Series"]);

function groupByKeywords(products, order, keywordMap, nameOnlyGroups = new Set()) {
  const groups = {};
  products.forEach(product => {
    let assigned = false;
    for (const group of order) {
      const keywords = keywordMap[group] || [];
      for (const kw of keywords) {
        const nameMatch = product.name?.toLowerCase().includes(kw.toLowerCase());
        const tagMatch = !nameOnlyGroups.has(group) &&
          product.tags?.some(t => t.toLowerCase().includes(kw.toLowerCase()));
        if (nameMatch || tagMatch) {
          (groups[group] ||= []).push(product);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }
    if (!assigned) (groups["Other"] ||= []).push(product);
  });
  const keys = order.filter(g => groups[g]?.length);
  if (groups["Other"]?.length) keys.push("Other");
  return keys.map(label => ({ label, products: groups[label] }));
}

// Sub-grouping for the "Heater Accessories" tab — same category order and
// friendly labels as UserManuals.jsx's "Heater Accessories" tab, plus
// "Sauna Stones" (see ProductCatalogue.jsx's "heater-acc" tab, and
// isSaunaStonesAccessory above).
const HEATER_ACCESSORIES_ORDER = ["Heater Guard", "Integration Collar", "Humidifiers", "Sauna Accessories", "Sauna Stones"];
const HEATER_ACCESSORIES_LABELS = {
  "Heater Guard": "Heater Guards",
  "Integration Collar": "Collars",
  "Humidifiers": "Cozy Tanks",
  "Sauna Accessories": "Safety Accessories",
  "Sauna Stones": "Sauna Stones",
};

function groupByCategory(products, order, labelMap) {
  const groups = {};
  products.forEach(product => {
    // Sauna Stones products are tagged with the same "Stones" category the
    // Stone-series heaters use (a CMS tagging collision, see
    // isSaunaStonesAccessory), so their real category can't be trusted here
    // — bucket by name instead of by category for this one case.
    const cat = isSaunaStonesAccessory(product)
      ? "Sauna Stones"
      : (product.categories || []).find(c => order.includes(c)) || (product.categories || [])[0] || "Other";
    (groups[cat] ||= []).push(product);
  });
  const keys = order.filter(c => groups[c]?.length);
  Object.keys(groups).forEach(c => { if (!keys.includes(c)) keys.push(c); });
  return keys.map(cat => ({ label: labelMap[cat] || cat, products: groups[cat] }));
}

// Consistent ordering within a group: featured first, then CMS sort_order,
// then name — same as HeatersCatalog.jsx's CategorySection.
function sortProducts(products) {
  return products.slice().sort((a, b) => {
    const featuredDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    if (featuredDiff !== 0) return featuredDiff;
    const sortA = a.sort_order ?? 999, sortB = b.sort_order ?? 999;
    if (sortA !== sortB) return sortA - sortB;
    return (a.name || "").localeCompare(b.name || "");
  });
}

const CATEGORY_SECTIONS = [
  { label: "Pails",                             id: "section-pails",             category: "pails" },
  { label: "Ladles",                            id: "section-ladles",            category: "ladles" },
  { label: "Pail Shower",                       id: "section-pail-shower",       category: "pail shower" },
  { label: "Thermometers & Combined Meters",    id: "section-meters",            category: "thermometers" },
  { label: "Clocks & Timers",                   id: "section-clock-timer",       category: "clocks & timers" },
  { label: "Sauna Lights",                      id: "section-sauna-lights",      category: "sauna lights" },
  { label: "Headrest & Backrests",              id: "section-headrest-backrest", category: "headrest & backrest" },
  { label: "Doors & Handles",                   id: "section-doors-handles",     category: "doors & handles" },
  { label: "Benches",                           id: "section-benches",           category: "benches" },
  { label: "Hangers & Hook Racks",              id: "section-cloth-hangers",     category: "cloth hangers" },
  { label: "Floor Mat Tiles",                   id: "section-wooden-floor-mats", category: "wooden floor mats" },
  { label: "Kivistone",                         id: "section-kivistone",         category: "kivistone" },
  { label: "Ventilations & Miscellaneous Items",id: "section-vent-misc",         category: "ventilation & miscellaneous" },
];

// The literal "Sauna Stones" (heater rocks) accessory has ended up tagged
// with the same "Stones" category the Stone-series heaters (Cumulus/Nimbus)
// use, which is a CMS tagging collision, not a matching-logic bug — same
// category string, two different real-world things. Name-matched so it
// gets pulled out regardless of which category it's tagged with.
function isSaunaStonesAccessory(product) {
  return (product?.name || "").toLowerCase().includes("sauna stones");
}

function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl;
}

function getImageUrl(product) {
  const local = product?.local_thumbnail;
  const remote = product?.thumbnail;
  const path = local || remote;
  return resolveUrl(path);
}

function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(null);
  const [hovered, setHovered] = React.useState(false);
  const imgRef = React.useRef(null);
  const isAccessory = isAccessoryProduct(product);
  let link;
  if (isAccessory) {
    link = `/accessories/${product.slug}`;
  } else if (product.type === "room") {
    link = `/sauna/rooms/${product.slug}`;
  } else {
    link = `/products/${product.slug}`;
  }

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const fullUrl = getImageUrl(product);
            if (fullUrl) {
              setImageSrc(fullUrl);
              const img = new Image();
              img.onload = () => setImageLoaded(true);
              img.src = fullUrl;
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [product]);

  return (
    <Link to={link} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "12px 8px",
          borderRadius: 10,
          transition: "transform 0.25s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          cursor: "pointer",
        }}
      >
        <div
          ref={imgRef}
          style={{
            width: "100%",
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
            background: "transparent",
          }}
        >
          {imageSrc ? (
            <>
              {!imageLoaded && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite",
                  }}
                />
              )}
              <img
                src={imageSrc}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  opacity: imageLoaded ? 1 : 0.6,
                  filter: imageLoaded ? "blur(0px)" : "blur(8px)",
                  transition: "opacity 0.5s ease, filter 0.5s ease, transform 0.25s ease",
                  transform: hovered ? "scale(1.06)" : "scale(1)",
                }}
              />
            </>
          ) : (
            <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
          )}
        </div>

        <p style={{
          fontWeight: 600,
          fontSize: "0.78rem",
          color: hovered ? "#a67853" : "#af8564",
          margin: 0,
          lineHeight: 1.4,
          textAlign: "center",
          transition: "color 0.2s ease",
        }}>
          {product.name}
        </p>
      </div>
    </Link>
  );
}

export default function AllProducts() {
  const { products: localProds, loading } = useLocalProducts();
  const { rooms: localRooms, loading: roomsLoading } = useLocalSaunaRooms();
  const [activeTab, setActiveTab] = useState("heaters");
  const [activeHeaterSection, setActiveHeaterSection] = useState(HEATER_SECTIONS[0].id);
  const [activeRoomSection, setActiveRoomSection] = useState(ROOM_SECTIONS[0].id);
  const [activeCategoryAccessories, setActiveCategoryAccessories] = useState("section-pails");

  const saunaHeaters = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => !isAccessoryProduct(p) && p.type !== "room" && !isSaunaStonesAccessory(p) && isPubliclyVisible(p));
  }, [localProds]);

  const productsByHeaterSection = useMemo(() => {
    const grouped = {};
    HEATER_SECTIONS.forEach(section => {
      grouped[section.id] = sortProducts(saunaHeaters.filter(p =>
        p.categories?.some(c => c.toLowerCase().includes(section.category))
      ));
    });
    return grouped;
  }, [saunaHeaters]);

  const saunaRooms = useMemo(() => {
    if (!localRooms.length) return [];
    return localRooms.filter(r => isPubliclyVisible(r));
  }, [localRooms]);

  const productsByRoomSection = useMemo(() => {
    const grouped = {};
    ROOM_SECTIONS.forEach(section => {
      grouped[section.id] = sortProducts(saunaRooms.filter(section.match));
    });
    return grouped;
  }, [saunaRooms]);

  const accessories = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isAccessoryProduct(p) && isPubliclyVisible(p));
  }, [localProds]);

  const productsByAccessoryCategory = useMemo(() => {
    const grouped = {};
    CATEGORY_SECTIONS.forEach(section => {
      grouped[section.id] = sortProducts(accessories.filter(p =>
        p.categories?.some(c => c.toLowerCase() === section.category)
      ));
    });
    return grouped;
  }, [accessories]);

  // These four don't match ACCESSORY_CATEGORIES (isAccessoryProduct) and
  // aren't rooms or a heater series either, so without their own tabs they
  // fell into the "heaters" pool and never actually rendered anywhere —
  // matches UserManuals.jsx's CATEGORY_TABS category strings.
  const saunaControlsProducts = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isPubliclyVisible(p) && p.categories?.includes("Sauna Controls"));
  }, [localProds]);

  const steamGeneratorsProducts = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isPubliclyVisible(p) && p.categories?.includes("Steam Generators"));
  }, [localProds]);

  const steamControlsProducts = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isPubliclyVisible(p) && p.categories?.includes("Steam Controls"));
  }, [localProds]);

  const heaterAccessoriesProducts = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => {
      if (!isPubliclyVisible(p)) return false;
      if (isSaunaStonesAccessory(p)) return true;
      const cats = p.categories || [];
      return cats.includes("Heater Accessories") ||
        HEATER_ACCESSORIES_ORDER.some(c => cats.includes(c));
    });
  }, [localProds]);

  // Sauna Controls and Heater Accessories are diverse enough (controls,
  // sensors, spare parts / guards, collars, tanks) to need the same
  // sub-grouping their own dedicated pages already use, instead of one
  // flat pile. Steam Generators/Controls stay a flat, consistently-sorted
  // grid — neither dedicated page groups them either.
  const groupedSaunaControls = useMemo(
    () => groupByKeywords(saunaControlsProducts, SAUNA_CONTROLS_ORDER, SAUNA_CONTROLS_KEYWORDS, SAUNA_CONTROLS_NAME_ONLY)
      .map(g => ({ ...g, products: sortProducts(g.products) })),
    [saunaControlsProducts]
  );

  const groupedHeaterAccessories = useMemo(
    () => groupByCategory(heaterAccessoriesProducts, HEATER_ACCESSORIES_ORDER, HEATER_ACCESSORIES_LABELS)
      .map(g => ({ ...g, products: sortProducts(g.products) })),
    [heaterAccessoriesProducts]
  );

  const sortedSteamGenerators = useMemo(() => sortProducts(steamGeneratorsProducts), [steamGeneratorsProducts]);
  const sortedSteamControls = useMemo(() => sortProducts(steamControlsProducts), [steamControlsProducts]);

  // Scroll spy for rooms sidebar
  useEffect(() => {
    if (activeTab !== "rooms") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      ROOM_SECTIONS.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = section.id;
        }
      });
      if (closest) setActiveRoomSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // Scroll spy for heaters sidebar
  useEffect(() => {
    if (activeTab !== "heaters") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      HEATER_SECTIONS.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = section.id;
        }
      });
      if (closest) setActiveHeaterSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // Scroll spy for accessories sidebar
  useEffect(() => {
    if (activeTab !== "accessories") return;
    const handleScroll = () => {
      let closestSection = null;
      let closestOffset = Infinity;
      CATEGORY_SECTIONS.forEach(section => {
        const element = document.getElementById(section.id);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closestSection = section.id;
        }
      });
      if (closestSection) setActiveCategoryAccessories(closestSection);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  const handleRoomClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveRoomSection(sectionId);
    }
  };

  const handleHeaterClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeaterSection(sectionId);
    }
  };

  const handleAccessoriesClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveCategoryAccessories(sectionId);
    }
  };

  if (loading || roomsLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 120 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <p style={{ color: "#a67853" }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="All Products"
        description="Browse SAWO's complete product range: sauna heaters, sauna rooms, and accessories, all in one searchable catalogue."
        path="/products"
      />
      <style>{`
        @keyframes skS {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .products-tabs-wrap {
          padding: 32px 40px 8px;
          background: #fff;
          border-bottom: 1px solid #edddd0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .products-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .products-tab-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 12px 22px;
          border-radius: 8px;
          border: 1.5px solid #af8564;
          background: transparent;
          color: #af8564;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .products-tab-btn:hover {
          background: rgba(175,133,100,0.08);
        }

        .products-tab-btn.active {
          background: #af8564;
          color: #fff;
        }

        @media screen and (max-width: 768px) {
          .products-tabs-wrap { padding: 24px 24px 8px; }
        }

        .products-wrapper {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 70px;
          width: 100%;
          padding: 50px 60px 40px;
          min-height: 100vh;
        }

        .products-flat-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 50px 60px 40px;
          min-height: 60vh;
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

        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e4d0bf; border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #b5886b; }

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

        .sidebar-btn:hover { background: #faf4ef; color: #af8564; }
        .sidebar-btn:hover::before { transform: translateY(-50%) scaleY(0.6); }

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
          margin-bottom: 40px;
        }

        .category-section-title h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #af8564;
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .category-section-title .underline {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, #d9c4b0 0%, #d1bda6 100%);
          border-radius: 3px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px 16px;
        }

        @media screen and (max-width: 1400px) {
          .products-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media screen and (max-width: 1100px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media screen and (max-width: 1024px) {
          .products-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }
          .category-buttons-sidebar { display: none; }
          .products-grid { grid-template-columns: repeat(4, 1fr); gap: 20px 14px; }
          .products-flat-wrapper { padding: 50px 40px 40px; }
        }

        @media screen and (max-width: 768px) {
          .products-wrapper { padding: 40px 24px 40px; }
          .products-flat-wrapper { padding: 40px 24px 40px; }
          .products-grid { grid-template-columns: repeat(3, 1fr); gap: 16px 12px; }
        }

        @media screen and (max-width: 480px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); gap: 14px 10px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        <CategoryHero
          heroImg={heroImg}
          eyebrow="Complete Collection"
          title="All Products"
          description="Browse SAWO's complete product range: sauna heaters, controls, steam generators, rooms, and accessories, all in one searchable catalogue."
        />

        {/* ── Category tabs (below hero, matches /support/manuals) ── */}
        <div className="products-tabs-wrap">
          <div className="products-tabs">
            {TAB_DEFS.map(tab => (
              <button
                key={tab.id}
                className={`products-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── HEATERS ── */}
        {activeTab === "heaters" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {HEATER_SECTIONS.map(section => {
                  const count = (productsByHeaterSection[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeHeaterSection === section.id ? "active" : ""}`}
                      onClick={() => handleHeaterClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {HEATER_SECTIONS.map(section => {
                const products = productsByHeaterSection[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
                    </div>
                    <div className="products-grid">
                      {products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {saunaHeaters.length === 0 && (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No sauna heaters available</p>
              )}
            </div>
          </div>
        )}

        {/* ── ROOMS ── */}
        {activeTab === "rooms" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {ROOM_SECTIONS.map(section => {
                  const count = (productsByRoomSection[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeRoomSection === section.id ? "active" : ""}`}
                      onClick={() => handleRoomClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {ROOM_SECTIONS.map(section => {
                const products = productsByRoomSection[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
                    </div>
                    <div className="products-grid">
                      {products.map(product => (
                        <ProductCard key={product.id || product.slug} product={{ ...product, type: "room" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {saunaRooms.length === 0 && (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No sauna rooms available</p>
              )}
            </div>
          </div>
        )}

        {/* ── SAUNA CONTROLS ── */}
        {activeTab === "sauna-controls" && (
          <div className="products-flat-wrapper">
            {groupedSaunaControls.length === 0 ? (
              <p style={{ color: "#a67853", fontSize: "1rem", textAlign: "center" }}>No sauna controls available</p>
            ) : (
              <div className="main-content">
                {groupedSaunaControls.map(group => (
                  <div key={group.label} className="category-section">
                    <div className="category-section-title"><h2>{group.label}</h2></div>
                    <div className="products-grid">
                      {group.products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEAM GENERATORS ── */}
        {activeTab === "steam-generators" && (
          <div className="products-flat-wrapper">
            {sortedSteamGenerators.length === 0 ? (
              <p style={{ color: "#a67853", fontSize: "1rem", textAlign: "center" }}>No steam generators available</p>
            ) : (
              <div className="products-grid">
                {sortedSteamGenerators.map(product => (
                  <ProductCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEAM GENERATOR CONTROLS ── */}
        {activeTab === "steam-controls" && (
          <div className="products-flat-wrapper">
            {sortedSteamControls.length === 0 ? (
              <p style={{ color: "#a67853", fontSize: "1rem", textAlign: "center" }}>No steam generator controls available</p>
            ) : (
              <div className="products-grid">
                {sortedSteamControls.map(product => (
                  <ProductCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HEATER ACCESSORIES ── */}
        {activeTab === "heater-accessories" && (
          <div className="products-flat-wrapper">
            {groupedHeaterAccessories.length === 0 ? (
              <p style={{ color: "#a67853", fontSize: "1rem", textAlign: "center" }}>No heater accessories available</p>
            ) : (
              <div className="main-content">
                {groupedHeaterAccessories.map(group => (
                  <div key={group.label} className="category-section">
                    <div className="category-section-title"><h2>{group.label}</h2></div>
                    <div className="products-grid">
                      {group.products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ACCESSORIES ── */}
        {activeTab === "accessories" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Categories</p>
              </div>
              <div className="sidebar-scroll">
                {CATEGORY_SECTIONS.map(section => {
                  const count = (productsByAccessoryCategory[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeCategoryAccessories === section.id ? "active" : ""}`}
                      onClick={() => handleAccessoriesClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {CATEGORY_SECTIONS.map(section => {
                const products = productsByAccessoryCategory[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
                    </div>
                    <div className="products-grid">
                      {products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <ScrollToTop />
    </>
  );
}
