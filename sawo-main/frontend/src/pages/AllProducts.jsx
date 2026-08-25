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
import useDragScroll from "../hooks/useDragScroll";
import { PANEL_SLUGS as INFRARED_PANEL_SLUGS } from "./Infrared/InfraredPanels";
import { CONTROL_SLUGS as INFRARED_CONTROL_SLUGS } from "./Infrared/InfraredControls";

const HEATER_SECTIONS = [
  { label: "Wall-Mounted", id: "heater-wall-mounted" },
  { label: "Tower",        id: "heater-tower" },
  { label: "Stone",        id: "heater-stone" },
  { label: "Floor",        id: "heater-floor" },
  { label: "Combi",        id: "heater-combi" },
  { label: "Dragonfire",   id: "heater-dragonfire" },
];

// Category-only classifier, mirroring the admin CMS's own
// getHeaterSubcategory() (Administrator/Products.jsx) so /products always
// agrees with /admin/products and the dedicated heater catalogue pages
// (HeatersCatalog.jsx, Tower.jsx, WallMounted.jsx). "Wall" appearing in a
// product's own name (SAWO30 Wall, Tower Wall, Aries Wall, Heaterking Wall)
// is a Tower-family SHAPE variant — the heater's flush-to-wall design — not
// a genuine wall-mounted (hanging) heater; those are a separate CMS category
// ("Wall-Mounted"/"Wall Mounted", covering Nordex/Mini/Scandia/Krios/
// Scandifire). So classification must never look at name/type — category
// only, same precedence order as the admin CMS.
function classifyHeaterSection(product) {
  const cats = (product.categories || []).map(c => c.toLowerCase());
  if (cats.some(c => c === "wall-mounted" || c === "wall mounted")) return "heater-wall-mounted";
  if (cats.some(c => c === "tower" || c === "towers")) return "heater-tower";
  if (cats.some(c => c === "stone" || c === "stones")) return "heater-stone";
  if (cats.some(c => c === "floor")) return "heater-floor";
  if (cats.some(c => c === "combi")) return "heater-combi";
  if (cats.some(c => c === "dragonfire")) return "heater-dragonfire";
  return null;
}

// Brand precedence within the Tower section, matching Tower.jsx's
// FIXED_ORDER exactly (SAWO30 first). Applied as a stable secondary sort
// after sortProducts(), so each brand's own variant pairing (Ni2/NS/NB,
// Black, Round/Wall/Corner) is preserved — this pass only reorders which
// brand's products come first.
const TOWER_BRAND_ORDER = ["SAWO30", "Tower", "Aries", "Cubos", "Heaterking", "Phoenix", "Fiberjungle"];

function prioritizeBrands(products, brandOrder) {
  const rankOf = (name) => {
    const n = (name || "").toUpperCase();
    for (let i = 0; i < brandOrder.length; i++) {
      if (n.includes(brandOrder[i].toUpperCase())) return i;
    }
    return brandOrder.length;
  };
  return products.slice().sort((a, b) => rankOf(a.name) - rankOf(b.name));
}

// Infrared saunas get their own top-level tab (see INFRARED handling below),
// so Rooms only carries Standard/Glass Front now.
const ROOM_SECTIONS = [
  { label: "Standard",    id: "room-standard",    match: p => p.room_type === "standard"    || p.room_type === "traditional" || (p.categories || []).some(c => c.toLowerCase() === "standard") },
  { label: "Glass Front", id: "room-glass-front", match: p => p.room_type === "glassfront"  || p.room_type === "glass-front"  || (p.categories || []).some(c => c.toLowerCase().replace(/\s+/g, "") === "glassfront") },
  { label: "Compact",     id: "room-compact",     match: p => p.room_type === "compact"     || (p.categories || []).some(c => c.toLowerCase() === "compact") },
];

const INFRARED_MATCH = p => p.room_type === "infrared" || (p.categories || []).some(c => c.toLowerCase() === "infrared");

// The Infrared tab covers the same three sub-pages as the header's Infrared
// dropdown (Rooms / Panels / Controls), given its own sidebar like
// Heaters/Rooms/Steam. Rooms come from the sauna-rooms table (INFRARED_MATCH
// above); Panels/Controls are ordinary products, selected by the same slug
// allowlists InfraredPanels.jsx/InfraredControls.jsx use (see those files —
// every infrared product shares one CMS category, "Infrared", so slugs are
// the only way to tell panels and controls apart today).
const INFRARED_SECTIONS = [
  { label: "Sauna Rooms", id: "infrared-rooms" },
  { label: "Panels",      id: "infrared-panels" },
  { label: "Controls",    id: "infrared-controls" },
];

// "Steam Generators" tab bundles all three steam categories under one
// sidebar (Generators / Controls / Accessories), the same sidebar pattern
// Heaters and Rooms use.
const STEAM_SECTIONS = [
  { label: "Steam Generators",  id: "steam-generators",  category: "Steam Generators" },
  { label: "Steam Controls",    id: "steam-controls",    category: "Steam Controls" },
  { label: "Steam Accessories", id: "steam-accessories", category: "Steam Accessories" },
];

// Matches the category set UserManuals.jsx's CATEGORY_TABS exposes, so the
// full catalogue (not just heaters/rooms/general accessories) is reachable
// from /products.
const TAB_DEFS = [
  { id: "heaters", label: "Sauna Heaters" },
  { id: "rooms", label: "Sauna Rooms" },
  { id: "sauna-controls", label: "Sauna Controls" },
  { id: "steam", label: "Steam" },
  { id: "infrared", label: "Infrared" },
  { id: "heater-accessories", label: "Heater Accessories" },
  { id: "accessories", label: "Sauna Accessories" },
];

function slugify(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Orders products within a curated group so specific, named variants land in
// an exact hand-picked sequence (e.g. "Power Controller" before "Contactor
// Unit") instead of falling back to alphabetical order. Each product is
// matched against the LONGEST entry in orderList it contains, so more
// specific entries (e.g. "Saunova 2.0 Built-In") always win over broader
// ones that happen to be substrings of them (e.g. "Saunova 2.0"). Anything
// that matches no entry sorts to the end.
function orderByExplicitList(products, orderList) {
  const rank = (name) => {
    const n = (name || "").toLowerCase();
    let bestIdx = orderList.length;
    let bestLen = -1;
    orderList.forEach((entry, idx) => {
      const e = entry.toLowerCase();
      if (n.includes(e) && e.length > bestLen) {
        bestLen = e.length;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };
  return products.slice().sort((a, b) => {
    const ra = rank(a.name), rb = rank(b.name);
    if (ra !== rb) return ra - rb;
    return (a.name || "").localeCompare(b.name || "");
  });
}

// Sub-grouping for the "Sauna Controls" tab — same keyword groups as
// SaunaControls.jsx ("/sauna/controls"), so a flat pile of 20+ controls,
// sensors, and spare parts reads the same way here as it does there.
//
// DISPLAY order (sidebar/section order) is Coming Soon, Saunova Series,
// Innova Series, Control Spare Parts, Interface Holder, Sensor. But several
// spare-part/holder products mention "Saunova"/"Innova" in their own name
// (e.g. "Innova & Saunova 2.0 Spare Rj12 – Cables", "Oval Interface Holder
// for Innova Classic Control") — if those two brand groups were checked
// first, they'd steal those products away from their real group. So MATCH
// order puts the narrow/specific groups first regardless of display order;
// groupedSaunaControls (below) re-sorts the result back into display order.
const SAUNA_CONTROLS_ORDER = ["Coming Soon", "Saunova Series", "Innova Series", "Control Spare Parts", "Interface Holder", "Sensor"];
const SAUNA_CONTROLS_MATCH_ORDER = ["Coming Soon", "Control Spare Parts", "Interface Holder", "Sensor", "Saunova Series", "Innova Series"];
const SAUNA_CONTROLS_KEYWORDS = {
  "Coming Soon":         ["SAWO Sense", "Saunova 2.0 PLUS", "Coming Soon"],
  "Control Spare Parts": ["Spare", "RJ12", "Extension Module", "Silicon Wire"],
  "Interface Holder":    ["Interface Holder", "Holder"],
  "Sensor":              ["Sensor", "Temperature", "Humidity"],
  "Saunova Series":      ["Saunova", "SAU-"],
  "Innova Series":       ["Innova", "INC-", "INP-", "INT-"],
};
const SAUNA_CONTROLS_NAME_ONLY = new Set(["Saunova Series", "Innova Series"]);

// Hand-picked in-group order per SAUNA_CONTROLS_ORDER section, matched via
// orderByExplicitList. Longest-substring-wins means e.g. "saunova 2.0" won't
// steal the match from the more specific "saunova 2.0 built-in".
const SAUNA_CONTROLS_GROUP_ORDER = {
  "Coming Soon":         ["sawo sense", "saunova 2.0 plus"],
  "Saunova Series":      ["saunova 2.0", "saunova 2.0 built-in", "saunova 2.0 power controller", "saunova 2.0 contactor unit", "saunova simple"],
  "Innova Series":       ["innova classic 2.0", "innova classic 2.0 built-in", "innova 2.0 power controller", "innova 2.0 contactor unit", "innova stainless steel touch", "innova classic", "innova classic built-in"],
  "Control Spare Parts": ["rj12", "light extension module", "silicon wire"],
  "Interface Holder":    ["rectangular interface holder for 2.0 controls", "oval interface holder for innova classic control", "rectangular interface holder for innova classic control"],
  // Full exact names, not short keywords — "temperature sensor" alone is a
  // substring of the humidity sensor's name too ("...and Temperature
  // Sensor"), which would let a shorter, unrelated entry misrank it.
  "Sensor":              ["additional humidity and temperature sensor", "additional second temperature sensor", "temperature sensor with fuse"],
};

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

// Strips control-class (Ni2/NS/NB) and finish (Black/Fiber-Coated) tokens
// from a product name, so "Nordex Floor NS" and "Nordex Floor Black NS"
// both reduce to "nordex floor" — the same base model, different variant.
function baseProductKey(name = "") {
  return name
    .replace(/\b(ni2|ns|nb)\b/gi, "")
    .replace(/black|fiber[\s-]?coated/gi, "")
    .replace(/wooden|stainless(\s+steel)?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Orders a product list so variants of the same base model always land
// next to each other (e.g. "Nordex Floor NS" beside "Nordex Floor Black
// NS"), instead of scattering if their individual featured/sort_order
// happen to differ — that noise is only used to order the base-model
// GROUPS, not to split a group apart. Within a group, variantRank (from
// wallMountedGroups.js — plain before Black/Fiber-Coated, Ni2 → NS → NB)
// decides the order.
function sortProducts(products) {
  const groups = new Map();
  products.forEach(p => {
    const key = baseProductKey(p.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });

  const groupList = [...groups.values()].map(items => ({
    items,
    featured: items.some(p => p.featured) ? 1 : 0,
    sortOrder: Math.min(...items.map(p => p.sort_order ?? 999)),
    label: items[0]?.name || "",
  }));

  groupList.sort((a, b) => {
    if (a.featured !== b.featured) return b.featured - a.featured;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });

  return groupList.flatMap(g =>
    g.items.slice().sort((a, b) => {
      const r = variantRank(a.name) - variantRank(b.name);
      return r !== 0 ? r : (a.name || "").localeCompare(b.name || "");
    })
  );
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

// Heater Guards, Integration Collars, Cozy Tanks, etc. — these carry
// category tags (e.g. "Heater Guard", "Integration Collar") that isn't in
// isAccessoryProduct's ACCESSORY_CATEGORIES list, and several of them have
// "Wall" in their own name (e.g. "Heater Guard – Aries Wall"), which used to
// let them leak into the Heaters tab's Wall-Mounted section. They belong
// only in the Heater Accessories tab.
function isHeaterAccessoryProduct(product) {
  if (isSaunaStonesAccessory(product)) return true;
  const cats = product?.categories || [];
  return cats.includes("Heater Accessories") || HEATER_ACCESSORIES_ORDER.some(c => cats.includes(c));
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
            height: 270,
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
          fontSize: "0.9rem",
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
  const { trackRef: tabsTrackRef, dragHandlers: tabsDragHandlers } = useDragScroll();
  const [activeTab, setActiveTab] = useState("heaters");
  const [activeHeaterSection, setActiveHeaterSection] = useState(HEATER_SECTIONS[0].id);
  const [activeRoomSection, setActiveRoomSection] = useState(ROOM_SECTIONS[0].id);
  const [activeCategoryAccessories, setActiveCategoryAccessories] = useState("section-pails");
  const [activeSaunaControlsSection, setActiveSaunaControlsSection] = useState(null);
  const [activeSteamSection, setActiveSteamSection] = useState(STEAM_SECTIONS[0].id);
  const [activeHeaterAccSection, setActiveHeaterAccSection] = useState(null);
  const [activeInfraredSection, setActiveInfraredSection] = useState(INFRARED_SECTIONS[0].id);

  const saunaHeaters = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => !isAccessoryProduct(p) && !isHeaterAccessoryProduct(p) && p.type !== "room" && isPubliclyVisible(p));
  }, [localProds]);

  const productsByHeaterSection = useMemo(() => {
    const grouped = {};
    HEATER_SECTIONS.forEach(section => { grouped[section.id] = []; });
    saunaHeaters.forEach(p => {
      const sectionId = classifyHeaterSection(p);
      if (sectionId && grouped[sectionId]) grouped[sectionId].push(p);
    });
    HEATER_SECTIONS.forEach(section => { grouped[section.id] = sortProducts(grouped[section.id]); });
    grouped["heater-tower"] = prioritizeBrands(grouped["heater-tower"], TOWER_BRAND_ORDER);
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

  const infraredRooms = useMemo(
    () => sortProducts(saunaRooms.filter(INFRARED_MATCH)),
    [saunaRooms]
  );

  // Panels/Controls keep the same hand-picked slug order InfraredPanels.jsx
  // / InfraredControls.jsx use, so no sortProducts() here.
  const infraredPanels = useMemo(() => {
    if (!localProds.length) return [];
    const bySlug = new Map(localProds.filter(isPubliclyVisible).map(p => [p.slug, p]));
    return INFRARED_PANEL_SLUGS.map(slug => bySlug.get(slug)).filter(Boolean);
  }, [localProds]);

  const infraredControls = useMemo(() => {
    if (!localProds.length) return [];
    const bySlug = new Map(localProds.filter(isPubliclyVisible).map(p => [p.slug, p]));
    return INFRARED_CONTROL_SLUGS.map(slug => bySlug.get(slug)).filter(Boolean);
  }, [localProds]);

  const productsByInfraredSection = useMemo(() => ({
    "infrared-rooms": infraredRooms,
    "infrared-panels": infraredPanels,
    "infrared-controls": infraredControls,
  }), [infraredRooms, infraredPanels, infraredControls]);

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

  const productsBySteamSection = useMemo(() => {
    const grouped = {};
    STEAM_SECTIONS.forEach(section => {
      grouped[section.id] = sortProducts(
        localProds.filter(p => isPubliclyVisible(p) && p.categories?.includes(section.category))
      );
    });
    return grouped;
  }, [localProds]);

  const heaterAccessoriesProducts = useMemo(() => {
    if (!localProds.length) return [];
    return localProds.filter(p => isPubliclyVisible(p) && isHeaterAccessoryProduct(p));
  }, [localProds]);

  // Sauna Controls and Heater Accessories are diverse enough (controls,
  // sensors, spare parts / guards, collars, tanks) to need the same
  // sub-grouping their own dedicated pages already use, instead of one
  // flat pile, each with its own sidebar (same pattern as Heaters/Rooms).
  // Grouped by SAUNA_CONTROLS_MATCH_ORDER (specific groups win first), then
  // re-sorted into SAUNA_CONTROLS_ORDER (the intended display order).
  const groupedSaunaControls = useMemo(() => {
    const groups = groupByKeywords(saunaControlsProducts, SAUNA_CONTROLS_MATCH_ORDER, SAUNA_CONTROLS_KEYWORDS, SAUNA_CONTROLS_NAME_ONLY);
    const byLabel = new Map(groups.map(g => [g.label, g]));
    return SAUNA_CONTROLS_ORDER
      .filter(label => byLabel.has(label))
      .map(label => byLabel.get(label))
      .concat(groups.filter(g => !SAUNA_CONTROLS_ORDER.includes(g.label)))
      .map(g => ({
        ...g,
        id: `sauna-ctrl-${slugify(g.label)}`,
        products: SAUNA_CONTROLS_GROUP_ORDER[g.label]
          ? orderByExplicitList(g.products, SAUNA_CONTROLS_GROUP_ORDER[g.label])
          : sortProducts(g.products),
      }));
  }, [saunaControlsProducts]);

  const groupedHeaterAccessories = useMemo(
    () => groupByCategory(heaterAccessoriesProducts, HEATER_ACCESSORIES_ORDER, HEATER_ACCESSORIES_LABELS)
      .map(g => ({ ...g, id: `heater-acc-${slugify(g.label)}`, products: sortProducts(g.products) })),
    [heaterAccessoriesProducts]
  );

  // Default the sauna-controls / heater-accessories sidebars to their first
  // group once the (async-loaded) data is in — HEATER_SECTIONS/ROOM_SECTIONS
  // are static so their default can be a useState initializer, but these two
  // are built dynamically from live data.
  useEffect(() => {
    if (!activeSaunaControlsSection && groupedSaunaControls.length) {
      setActiveSaunaControlsSection(groupedSaunaControls[0].id);
    }
  }, [groupedSaunaControls, activeSaunaControlsSection]);

  useEffect(() => {
    if (!activeHeaterAccSection && groupedHeaterAccessories.length) {
      setActiveHeaterAccSection(groupedHeaterAccessories[0].id);
    }
  }, [groupedHeaterAccessories, activeHeaterAccSection]);

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

  // Scroll spy for sauna controls sidebar
  useEffect(() => {
    if (activeTab !== "sauna-controls") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      groupedSaunaControls.forEach(group => {
        const el = document.getElementById(group.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = group.id;
        }
      });
      if (closest) setActiveSaunaControlsSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, groupedSaunaControls]);

  // Scroll spy for steam sidebar
  useEffect(() => {
    if (activeTab !== "steam") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      STEAM_SECTIONS.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = section.id;
        }
      });
      if (closest) setActiveSteamSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // Scroll spy for heater accessories sidebar
  useEffect(() => {
    if (activeTab !== "heater-accessories") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      groupedHeaterAccessories.forEach(group => {
        const el = document.getElementById(group.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = group.id;
        }
      });
      if (closest) setActiveHeaterAccSection(closest);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, groupedHeaterAccessories]);

  // Scroll spy for infrared sidebar
  useEffect(() => {
    if (activeTab !== "infrared") return;
    const handleScroll = () => {
      let closest = null;
      let closestOffset = Infinity;
      INFRARED_SECTIONS.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (rect.top <= window.innerHeight * 0.4 && offset < closestOffset) {
          closestOffset = offset;
          closest = section.id;
        }
      });
      if (closest) setActiveInfraredSection(closest);
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

  const handleSaunaControlsClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSaunaControlsSection(sectionId);
    }
  };

  const handleSteamClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSteamSection(sectionId);
    }
  };

  const handleHeaterAccClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeaterAccSection(sectionId);
    }
  };

  const handleInfraredClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveInfraredSection(sectionId);
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
          padding: 56px 40px 8px;
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
          .products-tabs-wrap { padding: 36px 20px 10px; }

          .products-tabs {
            flex-wrap: nowrap;
            justify-content: flex-start;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 8px;
            padding-bottom: 2px;
          }

          .products-tabs::-webkit-scrollbar { display: none; }
          .products-tabs { cursor: grab; touch-action: pan-x; }
          .products-tabs.is-dragging { cursor: grabbing; user-select: none; }

          .products-tab-btn {
            font-size: 0.72rem;
            padding: 9px 16px;
            white-space: nowrap;
            flex-shrink: 0;
          }
        }

        @media screen and (max-width: 480px) {
          .products-tab-btn { font-size: 0.68rem; padding: 8px 13px; }
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
          grid-template-columns: repeat(4, 1fr);
          gap: 36px 24px;
        }

        @media screen and (max-width: 1100px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); gap: 30px 22px; }
        }

        @media screen and (max-width: 1024px) {
          .products-wrapper {
            grid-template-columns: 1fr;
            padding: 50px 40px 40px;
            gap: 24px;
          }
          .category-buttons-sidebar { display: none; }
          .products-grid { grid-template-columns: repeat(4, 1fr); gap: 28px 20px; }
          .products-flat-wrapper { padding: 50px 40px 40px; }
        }

        @media screen and (max-width: 768px) {
          .products-wrapper { padding: 40px 24px 40px; }
          .products-flat-wrapper { padding: 40px 24px 40px; }
          .products-grid { grid-template-columns: repeat(3, 1fr); gap: 22px 16px; }
        }

        @media screen and (max-width: 480px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); gap: 18px 14px; }
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
          <div className="products-tabs" ref={tabsTrackRef} {...tabsDragHandlers}>
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
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {groupedSaunaControls.map(group => (
                  <button
                    key={group.id}
                    className={`sidebar-btn ${activeSaunaControlsSection === group.id ? "active" : ""}`}
                    onClick={() => handleSaunaControlsClick(group.id)}
                  >
                    <span>{group.label}</span>
                    <span className="sidebar-btn-count">{group.products.length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="main-content">
              {groupedSaunaControls.length === 0 ? (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No sauna controls available</p>
              ) : (
                groupedSaunaControls.map(group => (
                  <div key={group.id} id={group.id} className="category-section">
                    <div className="category-section-title"><h2>{group.label}</h2></div>
                    <div className="products-grid">
                      {group.products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── STEAM (Generators / Controls / Accessories) ── */}
        {activeTab === "steam" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {STEAM_SECTIONS.map(section => {
                  const count = (productsBySteamSection[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeSteamSection === section.id ? "active" : ""}`}
                      onClick={() => handleSteamClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {STEAM_SECTIONS.map(section => {
                const products = productsBySteamSection[section.id] || [];
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
              {STEAM_SECTIONS.every(section => (productsBySteamSection[section.id] || []).length === 0) && (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No steam products available</p>
              )}
            </div>
          </div>
        )}

        {/* ── INFRARED (Sauna Rooms / Panels / Controls) ── */}
        {activeTab === "infrared" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {INFRARED_SECTIONS.map(section => {
                  const count = (productsByInfraredSection[section.id] || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={section.id}
                      className={`sidebar-btn ${activeInfraredSection === section.id ? "active" : ""}`}
                      onClick={() => handleInfraredClick(section.id)}
                    >
                      <span>{section.label}</span>
                      <span className="sidebar-btn-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="main-content">
              {INFRARED_SECTIONS.map(section => {
                const products = productsByInfraredSection[section.id] || [];
                if (products.length === 0) return null;
                return (
                  <div key={section.id} id={section.id} className="category-section">
                    <div className="category-section-title">
                      <h2>{section.label}</h2>
                    </div>
                    <div className="products-grid">
                      {products.map(product => (
                        <ProductCard
                          key={product.id || product.slug}
                          product={section.id === "infrared-rooms" ? { ...product, type: "room" } : product}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {INFRARED_SECTIONS.every(section => (productsByInfraredSection[section.id] || []).length === 0) && (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No infrared products available</p>
              )}
            </div>
          </div>
        )}

        {/* ── HEATER ACCESSORIES ── */}
        {activeTab === "heater-accessories" && (
          <div className="products-wrapper">
            <div className="category-buttons-sidebar">
              <div className="sidebar-header">
                <p className="sidebar-header-label">Browse by</p>
                <p className="sidebar-header-title">Type</p>
              </div>
              <div className="sidebar-scroll">
                {groupedHeaterAccessories.map(group => (
                  <button
                    key={group.id}
                    className={`sidebar-btn ${activeHeaterAccSection === group.id ? "active" : ""}`}
                    onClick={() => handleHeaterAccClick(group.id)}
                  >
                    <span>{group.label}</span>
                    <span className="sidebar-btn-count">{group.products.length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="main-content">
              {groupedHeaterAccessories.length === 0 ? (
                <p style={{ color: "#a67853", fontSize: "1rem" }}>No heater accessories available</p>
              ) : (
                groupedHeaterAccessories.map(group => (
                  <div key={group.id} id={group.id} className="category-section">
                    <div className="category-section-title"><h2>{group.label}</h2></div>
                    <div className="products-grid">
                      {group.products.map(product => (
                        <ProductCard key={product.id || product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
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
