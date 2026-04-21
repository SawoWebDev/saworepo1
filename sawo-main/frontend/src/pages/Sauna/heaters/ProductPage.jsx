// src/pages/ProductPage.jsx
// Public product detail page — fetches product by slug + layout config
// URL: /products/:slug
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

const CACHE_KEY    = (slug) => `sawo_product_${slug}`;
const LAYOUT_KEY   = "sawo_product_layout";
const LAYOUT_TTL   = 5 * 60 * 1000; // 5 minutes
const LAYOUT_TS    = "sawo_product_layout_ts";

function getCached(key) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; }
}
function setCache(key, d) {
  try { localStorage.setItem(key, JSON.stringify(d)); } catch {}
}

// Default blocks shown when the API returns no layout config
const DEFAULT_BLOCKS = [
  { id: "hero",        type: "hero",        enabled: true,  order: 1, settings: { showBrand: true, showType: true } },
  { id: "short_desc",  type: "short_desc",  enabled: true,  order: 2, settings: {} },
  { id: "gallery",     type: "gallery",     enabled: true,  order: 3, settings: { columns: 4 } },
  { id: "description", type: "description", enabled: true,  order: 4, settings: {} },
  { id: "features",    type: "features",    enabled: true,  order: 5, settings: { style: "bullets" } },
  { id: "spec_images", type: "spec_images", enabled: true,  order: 6, settings: {} },
  { id: "tags",        type: "tags",        enabled: true,  order: 7, settings: {} },
];

// ── Styles ────────────────────────────────────────────────────────────
const S = {
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: "18px 24px",
    marginBottom: 16,
    boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
  },
  label: {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    color: "#af8564",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    margin: "0 0 12px",
  },
};

// ── Block renderers ───────────────────────────────────────────────────
function HeroBlock({ product, settings }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
      {product.thumbnail && (
        <div style={{ width: "100%", maxHeight: 420, overflow: "hidden", background: "#f5f0eb", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img
            src={product.thumbnail}
            alt={product.name}
            style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain" }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      )}
      <div style={{ padding: "24px 28px" }}>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: "#2c1f13", margin: "0 0 8px", fontSize: "1.8rem", lineHeight: 1.2 }}>
          {product.name}
        </h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {settings?.showBrand && product.brand && (
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.82rem", color: "#af8564", fontWeight: 600 }}>
              {product.brand}
            </span>
          )}
          {settings?.showType && product.type && (
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.82rem", color: "#a08060" }}>
              · {product.type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ShortDescBlock({ product }) {
  if (!product.short_description) return null;
  return (
    <div style={S.card}>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1rem", color: "#6b5040", lineHeight: 1.75, margin: 0 }}>
        {product.short_description}
      </p>
    </div>
  );
}

function GalleryBlock({ product, settings }) {
  const [active, setActive] = useState(null);
  const images = product.images || [];
  if (!images.length) return null;
  const cols = settings?.columns || 4;
  return (
    <div style={S.card}>
      <h3 style={S.label}>Gallery</h3>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {images.map((url, i) => (
          <div
            key={i}
            onClick={() => setActive(url)}
            style={{ aspectRatio: "1/1", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "#f5f0eb" }}
          >
            <img
              src={url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        ))}
      </div>
      {/* Lightbox */}
      {active && (
        <div
          onClick={() => setActive(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <img src={active} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
          <button
            onClick={() => setActive(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#fff", fontSize: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function DescriptionBlock({ product }) {
  if (!product.description) return null;
  return (
    <div style={S.card}>
      <h3 style={S.label}>Description</h3>
      <div
        style={{ fontFamily: "'Montserrat', sans-serif", color: "#6b5040", lineHeight: 1.8, fontSize: "0.9rem" }}
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    </div>
  );
}

function FeaturesBlock({ product, settings }) {
  if (!product.features?.length) return null;
  const asPills = settings?.style === "pills";
  return (
    <div style={S.card}>
      <h3 style={S.label}>Features</h3>
      {asPills ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {product.features.map((f, i) => (
            <span key={i} style={{ background: "#f5ede3", color: "#af8564", padding: "5px 14px", borderRadius: 20, fontFamily: "'Montserrat', sans-serif", fontSize: "0.82rem", fontWeight: 500 }}>
              {f}
            </span>
          ))}
        </div>
      ) : (
        <ul style={{ margin: 0, padding: "0 0 0 18px" }}>
          {product.features.map((f, i) => (
            <li key={i} style={{ fontFamily: "'Montserrat', sans-serif", color: "#6b5040", fontSize: "0.88rem", marginBottom: 6, lineHeight: 1.5 }}>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpecImagesBlock({ product }) {
  if (!product.spec_images?.length) return null;
  return (
    <div style={S.card}>
      <h3 style={S.label}>Specifications</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {product.spec_images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            style={{ maxHeight: 200, borderRadius: 8, border: "1px solid #e8ddd3" }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        ))}
      </div>
    </div>
  );
}

function TagsBlock({ product }) {
  const cats = product.categories || [];
  const tags = product.tags || [];
  if (!cats.length && !tags.length) return null;
  return (
    <div style={S.card}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {cats.map((c, i) => (
          <span key={`c-${i}`} style={{ background: "#f5ede3", color: "#af8564", padding: "3px 12px", borderRadius: 20, fontFamily: "'Montserrat', sans-serif", fontSize: "0.72rem", fontWeight: 600 }}>
            {c}
          </span>
        ))}
        {tags.map((t, i) => (
          <span key={`t-${i}`} style={{ background: "#ebf5fb", color: "#2980b9", padding: "3px 12px", borderRadius: 20, fontFamily: "'Montserrat', sans-serif", fontSize: "0.72rem", fontWeight: 600 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 60px" }}>
      {[320, 80, 200, 150].map((h, i) => (
        <div key={i} style={{ background: "linear-gradient(90deg,#f0ebe3 25%,#faf8f5 50%,#f0ebe3 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s infinite", borderRadius: 10, height: h, marginBottom: 16 }} />
      ))}
      <style>{`@keyframes skeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(() => getCached(CACHE_KEY(slug)));
  const [layout,  setLayout]  = useState(() => {
    // Only use cached layout if it's fresh
    const ts = parseInt(localStorage.getItem(LAYOUT_TS) || "0");
    return Date.now() - ts < LAYOUT_TTL ? getCached(LAYOUT_KEY) : null;
  });
  const [loading, setLoading] = useState(!getCached(CACHE_KEY(slug)));
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    async function load() {
      if (!product) setLoading(true);

      try {
        // Fetch product and layout in parallel
        const [prodRes, layRes] = await Promise.allSettled([
          fetch(`${API}/api/public/products/${slug}`),
          fetch(`${API}/api/product-layout`),
        ]);

        if (cancelled) return;

        // Handle product response
        if (prodRes.status === "fulfilled" && prodRes.value.ok) {
          const prod = await prodRes.value.json();
          if (!cancelled) {
            setProduct(prod);
            setCache(CACHE_KEY(slug), prod);
          }
        } else if (prodRes.status === "rejected" || (prodRes.status === "fulfilled" && !prodRes.value.ok)) {
          // Try to get product from the full list as fallback
          try {
            const listRes = await fetch(`${API}/api/public/products`);
            if (listRes.ok) {
              const list = await listRes.json();
              const found = list.find(p => p.slug === slug);
              if (found && !cancelled) {
                setProduct(found);
                setCache(CACHE_KEY(slug), found);
              } else if (!cancelled) {
                setError("Product not found.");
              }
            } else if (!cancelled) {
              setError("Could not load product.");
            }
          } catch {
            if (!cancelled) setError("Could not load product.");
          }
        }

        // Handle layout response
        if (layRes.status === "fulfilled" && layRes.value.ok) {
          const lay = await layRes.value.json();
          if (!cancelled) {
            setLayout(lay);
            setCache(LAYOUT_KEY, lay);
            localStorage.setItem(LAYOUT_TS, String(Date.now()));
          }
        }
        // If layout fails, DEFAULT_BLOCKS is used below — no error needed
      } catch (err) {
        if (!cancelled) setError("Failed to load. Please check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading state ──
  if (loading && !product) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f5" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e8ddd3", padding: "10px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", fontFamily: "'Montserrat', sans-serif", fontSize: "0.78rem", color: "#a08060" }}>
            Loading…
          </div>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  // ── Error / not found state ──
  if (error || !product) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#faf8f5", fontFamily: "'Montserrat', sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: "#2c1f13", margin: "0 0 8px" }}>Product Not Found</h2>
        <p style={{ color: "#a08060", margin: "0 0 24px" }}>{error || "This product doesn't exist or isn't published yet."}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/" style={{ color: "#fff", background: "#af8564", textDecoration: "none", fontWeight: 600, padding: "10px 20px", borderRadius: 8 }}>
            ← Home
          </Link>
          <Link to="/sauna/heaters/wall-mounted" style={{ color: "#af8564", textDecoration: "none", fontWeight: 600, padding: "10px 20px", borderRadius: 8, border: "1.5px solid #af8564" }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // Resolve blocks: use layout from API, or fall back to defaults
  const rawBlocks = layout?.blocks?.length ? layout.blocks : DEFAULT_BLOCKS;
  const blocks = rawBlocks
    .filter(b => b.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f5" }}>
      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8ddd3", padding: "10px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", fontFamily: "'Montserrat', sans-serif", fontSize: "0.78rem", color: "#a08060", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
          <Link to="/" style={{ color: "#af8564", textDecoration: "none" }}>Home</Link>
          <span>›</span>
          <Link to="/sauna/heaters/wall-mounted" style={{ color: "#af8564", textDecoration: "none" }}>Products</Link>
          <span>›</span>
          <span style={{ color: "#2c1f13", fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 60px" }}>
        {blocks.map(block => {
          switch (block.type) {
            case "hero":        return <HeroBlock        key={block.id} product={product} settings={block.settings} />;
            case "short_desc":  return <ShortDescBlock   key={block.id} product={product} />;
            case "gallery":     return <GalleryBlock     key={block.id} product={product} settings={block.settings} />;
            case "description": return <DescriptionBlock key={block.id} product={product} />;
            case "features":    return <FeaturesBlock    key={block.id} product={product} settings={block.settings} />;
            case "spec_images": return <SpecImagesBlock  key={block.id} product={product} />;
            case "tags":        return <TagsBlock        key={block.id} product={product} />;
            default:            return null;
          }
        })}

        {/* Back link */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e8ddd3" }}>
          <Link
            to="/sauna/heaters/wall-mounted"
            style={{ color: "#af8564", textDecoration: "none", fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
}
