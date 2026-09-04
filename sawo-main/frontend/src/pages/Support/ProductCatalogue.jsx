import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { useLocalSaunaRooms } from "../../Administrator/Local/useLocalSaunaRooms";
import { isAccessoryProduct } from "../IndividualDisplay/DispAccessories";
import SEO from "../../components/SEO";
import { isPubliclyVisible } from "../../local-storage/visibility";
import ButtonClear from "../../components/Buttons/ButtonClear";
import towerWallScene from "../../assets/Support/sawo-tower-wall-scene.webp";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

const PRODUCT_CATALOGUE_PDF_URL =
  "https://www.sawo.com/wp-content/uploads/2026/05/SAWO-Product-Catalogue-040526.pdf";

// ─── Tab taxonomy ─────────────────────────────────────────────────────────────
// Classification is FIRST MATCH WINS over this array, so every product lands in
// exactly one tab and can never be double-counted.
//
// The order is load-bearing: a heater guard carries "Heater Guard" AND
// "Sauna Accessories" AND "Heater Accessories" simultaneously, so the
// heater-accessory tab has to be tested before the general accessories tab or
// guards/collars would be swallowed by the latter.
//
// This replaces the previous three-bucket model, whose `heaters` bucket was a
// catch-all (`!isAccessoryProduct(p) && p.type !== "room"`) that piled 203
// products — heaters, controls, steam, infrared, guards, collars, spare parts —
// under one "Sauna Heaters" heading.
// Labels are translated via t("catalogue.tabs.<id>") at render time, not
// stored here.
const CATALOGUE_TABS = [
  {
    id: "heaters",
    categories: ["Towers", "Wall-Mounted", "Floor", "Combi", "Dragonfire", "Stones"],
  },
  {
    id: "controls",
    categories: ["Sauna Controls", "Controls"],
  },
  {
    id: "steam",
    categories: ["Steam Generators", "Steam Controls", "Steam Accessories"],
  },
  {
    id: "infrared",
    categories: ["Infrared"],
  },
  {
    id: "heater-acc",
    categories: ["Heater Guard", "Integration Collar", "Humidifiers", "Sauna Stones"],
    // Safety switches and the Helius hood only carry the broad "Sauna
    // Accessories" tag, so category matching alone would drop them into the
    // catch-all. They're matched on `type` instead, which is specific.
    types: ["Safety Switch", "Heater Hood"],
    // Explicit sub-group order (categories + the two type buckets above).
    groupOrder: [
      "Heater Guard", "Integration Collar", "Humidifiers",
      "Sauna Stones", "Safety Switch", "Heater Hood",
    ],
  },
  {
    id: "accessories",
    categories: [
      "Pails", "Ladles", "Pail Shower", "Thermometers", "Clocks & Timers",
      "Sauna Lights", "Headrest & Backrest", "Doors & Handles", "Benches",
      "Cloth Hangers", "Wooden Floor Mats", "Kivistone",
      "Ventilation & Miscellaneous", "Accessory Sets",
    ],
  },
  // Rooms live in a separate Supabase table (`sauna_rooms`), not `products` —
  // the old code filtered `p.type === "room"` against `products`, which matches
  // zero rows, so this section silently never rendered at all.
  {
    id: "rooms", source: "rooms",
    groupOrder: ["standard", "glassfront", "infrared"],
  },
  // Safety net: anything with an unrecognised category (e.g. Spare Parts, or a
  // category added in the CMS later) still shows up here instead of vanishing.
  { id: "other", catchAll: true },
];

// Friendly sub-group headings, keyed by the raw category string — translated
// via t("catalogue.seriesLabels.<category>"), falling back to the raw
// category string for anything not in that map.
function seriesLabel(category, t) {
  const translated = t(`catalogue.seriesLabels.${category}`);
  return translated === `catalogue.seriesLabels.${category}` ? category : translated;
}

// Tab shown on first load. Named explicitly rather than CATALOGUE_TABS[0] so
// reordering the array above cannot silently change which tab opens.
const DEFAULT_TAB_ID = "heaters";

// How many cards to mount per batch. The rest stay unrendered until the
// sentinel below the grid scrolls into view.
const BATCH_SIZE = 24;

function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl;
}

function getImageUrl(product) {
  const local = product?.local_thumbnail;
  const remote = product?.thumbnail;
  return resolveUrl(local || remote);
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// The image is not fetched until the card actually scrolls into view — same
// IntersectionObserver approach already proven in AllProducts.jsx, so a tab
// holding 150 items issues a handful of image requests instead of 150.
function ProductCard({ product, localize }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const cardRef = useRef(null);

  const link = localize(product.__isRoom
    ? `/sauna/rooms/${product.slug}`
    : isAccessoryProduct(product)
      ? `/accessories/${product.slug}`
      : `/products/${product.slug}`);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const fullUrl = getImageUrl(product);
          if (fullUrl) setImageSrc(fullUrl);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "150px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [product]);

  return (
    <Link to={link} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div ref={cardRef} className="pc-card">
        {/* Image bay — fixed height so every row lines up regardless of art */}
        <div className="pc-card-img">
          {getImageUrl(product) ? (
            <>
              {!imageLoaded && <div className="pc-shimmer" />}
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: imageLoaded ? 1 : 0,
                    transition: "opacity 0.35s ease, transform 0.3s ease",
                  }}
                />
              )}
            </>
          ) : (
            <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
          )}
        </div>

        <div className="pc-card-body">
          {/* Clamped to exactly 2 lines so a one-word name and a long
              "Integration Collar – Cubos Corner (Stainless)" produce the
              same card height. */}
          <p className="pc-card-name">{product.name}</p>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="pc-card pc-card--skeleton">
      <div className="pc-card-img"><div className="pc-shimmer" /></div>
      <div className="pc-card-body">
        <div className="pc-skel-line" style={{ width: "80%" }} />
        <div className="pc-skel-line" style={{ width: "55%" }} />
      </div>
    </div>
  );
}

function ProductCatalogue() {
  const { products: localProds, loading } = useLocalProducts();
  const { rooms: localRooms, loading: roomsLoading } = useLocalSaunaRooms();
  const t = useLocaleT("support");
  const localize = useLocalizedPath();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB_ID);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);

  const publishedProducts = useMemo(
    () => localProds.filter((p) => isPubliclyVisible(p)),
    [localProds]
  );

  // Rooms come from a different table and have no `categories` we group on, so
  // they're tagged (__isRoom) for link resolution and grouped by room_type.
  const publishedRooms = useMemo(
    () =>
      localRooms
        .filter((r) => isPubliclyVisible(r))
        .map((r) => ({ ...r, __isRoom: true, __group: r.room_type || "standard" })),
    [localRooms]
  );

  // First-match-wins classification into exactly one tab.
  const byTab = useMemo(() => {
    const lists = {};
    CATALOGUE_TABS.forEach((t) => { lists[t.id] = []; });

    const categoryTabs = CATALOGUE_TABS.filter((t) => t.categories || t.types);
    const catchAll = CATALOGUE_TABS.find((t) => t.catchAll);

    publishedProducts.forEach((p) => {
      const cats = (p.categories || []).map((c) => String(c).toLowerCase());
      const type = String(p.type || "").toLowerCase();

      const hit = categoryTabs.find((t) =>
        (t.categories || []).some((c) => cats.includes(c.toLowerCase())) ||
        (t.types || []).some((ty) => ty.toLowerCase() === type)
      );

      if (hit) {
        // Remember which bucket matched so the sub-group split below is
        // consistent with the tab that claimed the product. Category match
        // wins the label; a type-only match groups under its type.
        const matchedCat = (hit.categories || []).find((c) => cats.includes(c.toLowerCase()));
        const matchedType = (hit.types || []).find((ty) => ty.toLowerCase() === type);
        lists[hit.id].push({ ...p, __group: matchedCat || matchedType || "Other" });
      } else if (catchAll) {
        lists[catchAll.id].push({ ...p, __group: "Other" });
      }
    });

    const roomsTab = CATALOGUE_TABS.find((t) => t.source === "rooms");
    if (roomsTab) lists[roomsTab.id] = publishedRooms;

    return lists;
  }, [publishedProducts, publishedRooms]);

  const tabs = useMemo(
    () =>
      CATALOGUE_TABS
        .map((t) => ({ ...t, count: (byTab[t.id] || []).length }))
        .filter((t) => t.count > 0),
    [byTab]
  );

  // Keep the active tab valid once data arrives (the default may be empty).
  useEffect(() => {
    if (!tabs.length) return;
    if (tabs.some((t) => t.id === activeTab)) return;
    // Prefer the default over whatever happens to sort first.
    const fallback = tabs.find((t) => t.id === DEFAULT_TAB_ID) || tabs[0];
    setActiveTab(fallback.id);
  }, [tabs, activeTab]);

  // Switching tabs restarts the batch, so we never mount a big tab all at once.
  useEffect(() => { setVisibleCount(BATCH_SIZE); }, [activeTab]);

  // Memoised, not `byTab[activeTab] || []` inline: the `|| []` fallback builds a
  // fresh array on every render, which would change `grouped`'s dependency each
  // time and defeat the memoisation below.
  const activeList = useMemo(() => byTab[activeTab] || [], [byTab, activeTab]);

  // Sub-group the active tab, ordered by the tab's own category list, and sort
  // inside each group (sort_order first, then name) — the old page did no
  // sorting at all, which is why it looked arbitrary.
  const grouped = useMemo(() => {
    const tab = CATALOGUE_TABS.find((t) => t.id === activeTab);
    const order = tab ? (tab.groupOrder || tab.categories || []) : [];

    const groups = new Map();
    activeList.forEach((p) => {
      const key = p.__group || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });

    const keys = order.length
      ? [...order.filter((c) => groups.has(c)), ...[...groups.keys()].filter((k) => !order.includes(k))]
      : [...groups.keys()].sort();

    return keys.map((key) => ({
      group: key,
      products: [...groups.get(key)].sort((a, b) => {
        const sa = a.sort_order ?? 999;
        const sb = b.sort_order ?? 999;
        if (sa !== sb) return sa - sb;
        return (a.name || "").localeCompare(b.name || "");
      }),
    }));
  }, [activeList, activeTab]);

  // Flatten back out, then cap at visibleCount — the batch limit applies across
  // the whole tab so sub-group headings appear progressively too.
  const flat = useMemo(
    () => grouped.flatMap((g) => g.products.map((p) => ({ ...p, __groupKey: g.group }))),
    [grouped]
  );
  const visible = flat.slice(0, visibleCount);
  const hasMore = visibleCount < flat.length;

  const visibleGroups = useMemo(() => {
    const out = [];
    visible.forEach((p) => {
      const last = out[out.length - 1];
      if (last && last.group === p.__groupKey) last.products.push(p);
      else out.push({ group: p.__groupKey, products: [p] });
    });
    return out;
  }, [visible]);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + BATCH_SIZE, flat.length));
  }, [flat.length]);

  // Sentinel below the grid: reaching it mounts the next batch.
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) loadMore(); },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const isLoading = loading || roomsLoading;

  return (
    <>
      <SEO
        title={t("catalogue.meta.title")}
        description={t("catalogue.meta.description")}
        path={localize("/support/catalogue")}
        hreflangAlternates={{ en: "/support/catalogue", zh: "/zh/support/catalogue" }}
      />
      <style>{`
        @keyframes pcShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .pc-outer {
          max-width: 1140px;
          margin: 0 auto;
          padding: 60px 32px 80px;
        }

        /* ── Tabs ───────────────────────────────────────────────── */
        .pc-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-bottom: 36px;
        }
        .pc-tab-btn {
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pc-tab-btn:hover { background: rgba(175,133,100,0.08); }
        .pc-tab-btn.active { background: #af8564; color: #fff; }
        .pc-tab-count {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 10px;
          background: #f5ede3;
          color: #c4a882;
        }
        .pc-tab-btn.active .pc-tab-count {
          background: rgba(255,255,255,0.18);
          color: #f6e9d8;
        }

        /* ── Group heading ──────────────────────────────────────── */
        .pc-group-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #af8564;
          margin: 0 0 18px;
          padding-bottom: 10px;
          border-bottom: 1px solid #edddd0;
        }

        /* ── Grid: caps at 4, only ever steps down ──────────────── */
        .pc-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px 18px;
        }
        @media screen and (max-width: 1100px) {
          .pc-grid { grid-template-columns: repeat(3, 1fr); gap: 20px 14px; }
        }
        @media screen and (max-width: 768px) {
          .pc-grid { grid-template-columns: repeat(2, 1fr); gap: 16px 12px; }
          .pc-outer { padding: 40px 20px 60px; }
        }
        @media screen and (max-width: 480px) {
          .pc-grid { grid-template-columns: 1fr; }
        }

        /* ── Card: fixed height so rows are never ragged ────────── */
        .pc-card {
          background: #fff;
          border-radius: 14px;
          border: 1.5px solid rgba(175,133,100,0.18);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 316px;
          transition: border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
          cursor: pointer;
        }
        .pc-card:hover {
          border-color: #af8564;
          transform: translateY(-5px);
          box-shadow: 0 14px 36px rgba(175,133,100,0.18);
        }
        .pc-card--skeleton { cursor: default; }
        .pc-card--skeleton:hover {
          border-color: rgba(175,133,100,0.18);
          transform: none;
          box-shadow: none;
        }
        .pc-card:hover .pc-card-img img { transform: scale(1.06); }

        .pc-card-img {
          /* Taller bay + no tinted background: the image sits directly on the
             card. objectFit: contain keeps the whole product visible, and the
             padding leaves room for the hover scale so nothing clips. */
          height: 216px;
          flex-shrink: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          position: relative;
          overflow: hidden;
        }

        .pc-card-body {
          padding: 12px 14px 14px;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }

        .pc-card-name {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 14.5px;
          /* Dark grey, not the old #af8564 brown — that was ~3.3:1 on white. */
          color: rgb(51,51,51);
          margin: 0;
          line-height: 1.35;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Bottom CTA ─────────────────────────────────────────── */
        .pc-cta {
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          border-radius: 20px;
          padding: 44px 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          flex-wrap: wrap;
          box-shadow: 0 16px 48px rgba(139,94,60,0.24);
        }
        .pc-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 26px;
          border-radius: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-decoration: none;
          white-space: nowrap;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }
        .pc-cta-btn--solid { background: #fff; color: #a67853; }
        .pc-cta-btn--solid:hover {
          background: transparent;
          color: #fff;
          border-color: #fff;
        }
        @media screen and (max-width: 600px) {
          .pc-cta { padding: 32px 26px; }
          .pc-cta-btn { flex: 1 1 auto; justify-content: center; }
        }

        .pc-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%);
          background-size: 200% 100%;
          animation: pcShimmer 1.4s infinite;
        }
        .pc-skel-line {
          height: 11px;
          border-radius: 4px;
          margin: 0 auto;
          background: linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%);
          background-size: 200% 100%;
          animation: pcShimmer 1.4s infinite;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
        {/* ── Header band — scene photo + dark overlay, white type ──── */}
        <div style={{
          width: "100%",
          padding: "160px 60px 70px",
          textAlign: "center",
          position: "relative",
          backgroundImage: `linear-gradient(rgba(20,14,10,0.6), rgba(20,14,10,0.6)), url(${towerWallScene})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          <p style={{
            fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.82)", margin: "0 0 12px",
          }}>
            {t("catalogue.header.eyebrow")}
          </p>
          <h1 style={{
            fontSize: "2.4rem", fontWeight: 700, color: "#ffffff",
            margin: "0 0 16px", lineHeight: 1.2,
          }}>
            {t("catalogue.header.title")}
          </h1>
          <p style={{
            fontSize: "1rem", color: "rgba(255,255,255,0.9)", margin: "0 auto",
            maxWidth: 700, lineHeight: 1.6,
          }}>
            {t("catalogue.header.desc")}
          </p>
          <div style={{ marginTop: "28px" }}>
            <ButtonClear
              text={t("catalogue.header.pdfBtn")}
              href={PRODUCT_CATALOGUE_PDF_URL}
              target="_blank"
            />
          </div>
        </div>

        <div className="pc-outer">
          {/* ── Tabs ───────────────────────────────────────────────── */}
          {!isLoading && tabs.length > 1 && (
            <div className="pc-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`pc-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {t(`catalogue.tabs.${tab.id}`)}
                  <span className="pc-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Loading skeletons ──────────────────────────────────── */}
          {isLoading && (
            <div className="pc-grid">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── Empty state ────────────────────────────────────────── */}
          {!isLoading && tabs.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "80px 0", textAlign: "center", gap: 14,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#faf7f4", border: "1px dashed #e0cfc0",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="fa-regular fa-folder-open" style={{ fontSize: "1.6rem", color: "#ddc9b4" }} />
              </div>
              <p style={{ color: "#a67853", margin: 0, fontSize: "0.88rem", fontStyle: "italic" }}>
                {t("catalogue.empty")}
              </p>
            </div>
          )}

          {/* ── Grouped, batched grid ──────────────────────────────── */}
          {!isLoading && visibleGroups.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {visibleGroups.map((g, gi) => (
                <div key={`${g.group}-${gi}`}>
                  {grouped.length > 1 && (
                    <h3 className="pc-group-title">{seriesLabel(g.group, t)}</h3>
                  )}
                  <div className="pc-grid">
                    {g.products.map((p) => (
                      <ProductCard key={p.id || p.slug} product={p} localize={localize} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sentinel — mounting the next batch happens when this scrolls near */}
          {!isLoading && hasMore && (
            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────── */}
        {!isLoading && (
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 32px 80px" }}>
            <div className="pc-cta">
              <div>
                <h3 style={{
                  fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                  fontSize: "1.4rem", color: "#fff", margin: "0 0 8px",
                }}>
                  {t("catalogue.banner.title")}
                </h3>
                <p style={{
                  fontFamily: "'Montserrat',sans-serif", fontWeight: 400,
                  fontSize: "0.92rem", color: "rgba(255,255,255,0.82)",
                  margin: 0, lineHeight: 1.6,
                }}>
                  {t("catalogue.banner.desc")}
                </p>
              </div>
              <Link to={localize("/contact")} className="pc-cta-btn pc-cta-btn--solid">
                {t("catalogue.banner.cta")}
                <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem" }} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ProductCatalogue;
