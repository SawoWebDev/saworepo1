// src/pages/Sauna/SaunaCalculator.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVisibleProductsCached } from "../../local-storage/supabaseReader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hcRound(n) {
  return Math.round(n * 10) / 10;
}

function extractKwFromTags(tags = []) {
  const results = [];
  tags.forEach(tag => {
    const m = tag.match(/^(\d+(?:\.\d+)?)\s*kW$/i);
    if (m) results.push(parseFloat(m[1]));
  });
  return results;
}

function closestKw(targetKw, allProducts) {
  const allKws = [
    ...new Set(allProducts.flatMap(p => extractKwFromTags(p.tags || []))),
  ].sort((a, b) => a - b);
  if (!allKws.length) return targetKw;
  return allKws.reduce((prev, curr) =>
    Math.abs(curr - targetKw) < Math.abs(prev - targetKw) ? curr : prev
  );
}

// ─── Local cache helpers (component-level, not Supabase cache) ─────────────────
const HC_CACHE_KEY = "sawo_hc_products";
const HC_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached() {
  try {
    const stored = localStorage.getItem(HC_CACHE_KEY);
    if (!stored) return null;
    const { data, time } = JSON.parse(stored);
    if (data && Date.now() - time < HC_CACHE_TTL) return data;
    return null;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(HC_CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

// Limit input: max 2 digits before decimal point
function limitTwoDigits(val) {
  if (!val) return val;
  const parts = val.split(".");
  if (parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
  return parts.join(".");
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function DimField({ label, value, onChange, placeholder, hint }) {
  return (
    <div className="sawo-hc-field">
      <span className="sawo-hc-label">{label}</span>
      <div className="sawo-hc-input-wrap">
        <input
          className="sawo-hc-inp"
          type="number"
          step="0.1"
          min="0"
          max="99.9"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(limitTwoDigits(e.target.value))}
        />
        <span className="sawo-hc-unit">m</span>
      </div>
      <span className="sawo-hc-hint">{hint}</span>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, matchKw }) {
  const voltages = extractKwFromTags(product.tags || []).sort((a, b) => a - b);

  return (
    <Link to={`/products/${product.slug}`} className="sawo-hc-product-card">
      <div className="sawo-hc-img-wrap">
        {localOrRemote(product, 'thumbnail') ? (
          <img
            src={localOrRemote(product, 'thumbnail')}
            alt={product.name}
            className="sawo-hc-product-img"
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#c4a882" }}>
            <i className="fas fa-image" style={{ fontSize:"2rem" }} />
          </div>
        )}
      </div>
      <div className="sawo-hc-product-body">
        <div className="sawo-hc-product-name">{product.name}</div>
        <div className="sawo-hc-voltage-list">
          {voltages.map(v => (
            <span
              key={v}
              className={`sawo-hc-voltage-pill${Math.abs(v - matchKw) < 0.05 ? " sawo-hc-match" : ""}`}
            >
              {v} kW
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SaunaCalculator() {
  const [width,  setWidth]  = useState("");
  const [height, setHeight] = useState("");
  const [depth,  setDepth]  = useState("");
  const [volume,  setVolume]  = useState(null);
  const [matchKw, setMatchKw] = useState(null);

  const [allProducts,     setAllProducts]     = useState(() => getCached() || []);
  const [loadingProducts, setLoadingProducts] = useState(allProducts.length === 0);

  // Track left column height so image always matches it
  const leftColRef   = useRef(null);
  const [leftHeight, setLeftHeight] = useState(null);

  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setLeftHeight(el.offsetHeight || null);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Fetch products ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchProducts() {
      const cached = getCached();
      if (cached) {
        setAllProducts(cached);
        setLoadingProducts(false);
      } else {
        setLoadingProducts(true);
      }
      try {
        let data = await getVisibleProductsCached();
        // Sort by sort_order first, then by created_at descending
        data.sort((a, b) => {
          const sortA = a.sort_order ?? 999;
          const sortB = b.sort_order ?? 999;
          if (sortA !== sortB) return sortA - sortB;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        const raw = data || [];
        setCache(raw);
        setAllProducts(raw);
      } catch (err) {
        console.error("SaunaCalculator: Supabase fetch failed", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // ── Auto-calculate whenever inputs change ──────────────────────────────────
  useEffect(() => {
    const w = parseFloat(width)  || 0;
    const h = parseFloat(height) || 0;
    const d = parseFloat(depth)  || 0;
    if (!w || !h || !d) { setVolume(null); setMatchKw(null); return; }
    const vol = hcRound(w * h * d);
    setVolume(vol);
    if (allProducts.length > 0) setMatchKw(closestKw(vol, allProducts));
  }, [width, height, depth, allProducts]);

  const matched = useMemo(() => {
    if (matchKw === null || allProducts.length === 0) return [];
    return allProducts.filter(p =>
      extractKwFromTags(p.tags || []).some(v => Math.abs(v - matchKw) < 0.05)
    );
  }, [allProducts, matchKw]);

  const showResult = volume !== null && matchKw !== null;

  return (
    <div id="sawo-hc-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

        #sawo-hc-wrap,
        #sawo-hc-wrap * {
          box-sizing: border-box;
          font-family: 'Montserrat', sans-serif;
        }
        #sawo-hc-wrap {
          color: rgb(51,51,51);
          width: 100%;
          /* Match FAQ.jsx: max-width 1200, padding 56px 40px 80px, margin 0 auto */
          max-width: 1200px;
          margin: 0 auto;
          padding: 140px 40px 80px;
        }

        /* ── Intro ── */
        #sawo-hc-wrap .sawo-hc-intro {
          margin-bottom: 40px;
          text-align: center;
        }
        #sawo-hc-wrap .sawo-hc-intro h2 {
          font-family: 'Montserrat', sans-serif;
          font-size: 32px;
          font-weight: 700;
          font-style: normal;
          color: rgb(175,133,100);
          margin: 0 0 12px;
          line-height: 1.2;
        }
        #sawo-hc-wrap .sawo-hc-intro p {
          font-family: 'Montserrat', sans-serif;
          font-size: 20px;
          font-weight: 400;
          font-style: normal;
          color: rgb(51,51,51);
          line-height: 1.55;
          max-width: 800px;
          margin: 0 auto;
        }
        /* ── Card ── */
        #sawo-hc-wrap .sawo-hc-card {
          background: #fff;
          border: 1.5px solid rgba(175,133,100,0.22);
          border-radius: 16px;
          padding: 36px 40px;
          margin-bottom: 20px;
          box-shadow: 0 2px 16px rgba(175,133,100,0.06);
          transition: box-shadow 0.25s;
        }
        #sawo-hc-wrap .sawo-hc-card:hover {
          box-shadow: 0 8px 32px rgba(175,133,100,0.12);
        }
        #sawo-hc-wrap .sawo-hc-card-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #af8564;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        #sawo-hc-wrap .sawo-hc-card-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(175,133,100,0.16);
        }

        /* ── Dim grid ── */
        #sawo-hc-wrap .sawo-hc-dim-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        #sawo-hc-wrap .sawo-hc-dim-inputs {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Image always matches left column height via inline style */
        #sawo-hc-wrap .sawo-hc-dim-image {
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          min-height: 260px;
        }
        #sawo-hc-wrap .sawo-hc-dim-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.45s ease;
        }
        #sawo-hc-wrap .sawo-hc-dim-image:hover img { transform: scale(1.05); }
        #sawo-hc-wrap .sawo-hc-dim-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 55%, rgba(50,25,8,0.42) 100%);
          pointer-events: none;
        }
        #sawo-hc-wrap .sawo-hc-dim-image-label {
          position: absolute;
          bottom: 14px;
          left: 16px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.82);
        }

        /* ── Result bar ── */
        #sawo-hc-wrap .sawo-hc-result-row-wrap {
          display: none;
          margin-top: 28px;
        }
        #sawo-hc-wrap .sawo-hc-result-row-wrap.visible { display: block; }
        #sawo-hc-wrap .sawo-hc-result-combined {
          background: linear-gradient(135deg, #8b5e3c 0%, #b08560 100%);
          border-radius: 14px;
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          align-items: center;
          overflow: hidden;
          box-shadow:
            0 8px 28px rgba(139,94,60,0.22),
            inset 0 1px 0 rgba(255,255,255,0.16);
          transform: translateY(-2px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        #sawo-hc-wrap .sawo-hc-result-combined:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(139,94,60,0.28), inset 0 1px 0 rgba(255,255,255,0.16);
        }
        #sawo-hc-wrap .sawo-hc-result-half { padding: 30px 40px; text-align: center; }
        #sawo-hc-wrap .sawo-hc-result-sep {
          width: 1px;
          height: 56px;
          background: rgba(255,255,255,0.22);
          align-self: center;
        }
        #sawo-hc-wrap .sawo-hc-result-card-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.62);
          margin-bottom: 10px;
        }
        #sawo-hc-wrap .sawo-hc-result-card-val {
          font-size: 44px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
        }
        #sawo-hc-wrap .sawo-hc-result-card-val small {
          font-size: 18px;
          font-weight: 500;
          color: rgba(255,255,255,0.58);
          margin-left: 6px;
        }

        /* ── Input fields ── */
        #sawo-hc-wrap .sawo-hc-field {
          background: linear-gradient(135deg, #b08560 0%, #9a7250 100%);
          border: 1.5px solid rgba(255,255,255,0.18);
          border-radius: 12px;
          padding: 18px 20px 14px;
          display: flex;
          flex-direction: column;
          position: relative;
          flex: 1;
          transition: border-color 0.15s, transform 0.2s, box-shadow 0.2s;
        }
        #sawo-hc-wrap .sawo-hc-field:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139,94,60,0.2);
        }
        #sawo-hc-wrap .sawo-hc-field:focus-within {
          border-color: rgba(255,255,255,0.5);
          box-shadow: 0 6px 20px rgba(139,94,60,0.22);
        }
        #sawo-hc-wrap .sawo-hc-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.72);
          margin-bottom: 8px;
        }
        #sawo-hc-wrap .sawo-hc-input-wrap {
          position: relative;
          display: flex;
          align-items: baseline;
        }
        #sawo-hc-wrap .sawo-hc-inp {
          flex: 1;
          width: 100%;
          font-size: 30px;
          font-weight: 800;
          color: #fff;
          border: none;
          border-bottom: 2px solid rgba(255,255,255,0.32);
          border-radius: 0;
          padding: 2px 42px 6px 0;
          outline: none;
          background: transparent;
          transition: border-color 0.15s;
          -moz-appearance: textfield;
          appearance: textfield;
        }
        #sawo-hc-wrap .sawo-hc-inp::-webkit-inner-spin-button,
        #sawo-hc-wrap .sawo-hc-inp::-webkit-outer-spin-button { -webkit-appearance: none; }
        #sawo-hc-wrap .sawo-hc-inp:focus { border-bottom-color: rgba(255,255,255,0.82); }
        #sawo-hc-wrap .sawo-hc-inp::placeholder {
          color: rgba(255,255,255,0.32);
          font-weight: 400;
          font-size: 22px;
        }
        #sawo-hc-wrap .sawo-hc-unit {
          position: absolute;
          right: 0;
          bottom: 8px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.72);
        }
        #sawo-hc-wrap .sawo-hc-hint {
          font-size: 10.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.58);
          margin-top: 8px;
          letter-spacing: 0.04em;
        }

        /* ── Recommendations ── */
        #sawo-hc-wrap .sawo-hc-reco-section { display: none; }
        #sawo-hc-wrap .sawo-hc-reco-section.visible { display: block; }
        #sawo-hc-wrap .sawo-hc-reco-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        #sawo-hc-wrap .sawo-hc-reco-title {
          font-size: 26px;
          font-weight: 700;
          color: #8b5e3c;
          margin: 0;
          line-height: 1.2;
        }
        #sawo-hc-wrap .sawo-hc-reco-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(175,133,100,0.1);
          border: 1px solid rgba(175,133,100,0.24);
          border-radius: 50px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #af8564;
          white-space: nowrap;
        }
        #sawo-hc-wrap .sawo-hc-reco-sub {
          font-size: 14px;
          font-weight: 400;
          color: #7a6150;
          margin-bottom: 22px;
          line-height: 1.6;
        }
        #sawo-hc-wrap .sawo-hc-reco-sub strong { font-weight: 700; color: #af8564; }

        /* ── Product grid ── */
        #sawo-hc-wrap .sawo-hc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }
        #sawo-hc-wrap .sawo-hc-product-card {
          display: block;
          text-decoration: none;
          color: inherit;
          background: #fff;
          border: 1.5px solid rgba(175,133,100,0.18);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.22s, transform 0.22s, box-shadow 0.22s;
        }
        #sawo-hc-wrap .sawo-hc-product-card:hover {
          border-color: #af8564;
          transform: translateY(-5px);
          box-shadow: 0 14px 36px rgba(175,133,100,0.18);
        }
        #sawo-hc-wrap .sawo-hc-img-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          background: #f7f5f2;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: background 0.2s;
        }
        #sawo-hc-wrap .sawo-hc-product-card:hover .sawo-hc-img-wrap { background: #f0ebe4; }
        #sawo-hc-wrap .sawo-hc-product-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
          padding: 12px;
          transition: transform 0.35s ease;
        }
        #sawo-hc-wrap .sawo-hc-product-card:hover .sawo-hc-product-img { transform: scale(1.06); }
        #sawo-hc-wrap .sawo-hc-product-body { padding: 14px 16px 16px; }
        #sawo-hc-wrap .sawo-hc-product-name {
          font-size: 13px;
          font-weight: 700;
          color: rgb(51,51,51);
          margin-bottom: 10px;
          line-height: 1.35;
          transition: color 0.2s;
        }
        #sawo-hc-wrap .sawo-hc-product-card:hover .sawo-hc-product-name { color: #af8564; }
        #sawo-hc-wrap .sawo-hc-voltage-list { display: flex; flex-wrap: wrap; gap: 5px; }
        #sawo-hc-wrap .sawo-hc-voltage-pill {
          font-size: 10.5px;
          font-weight: 700;
          color: #af8564;
          background: rgba(175,133,100,0.09);
          border: 1px solid rgba(175,133,100,0.22);
          padding: 3px 8px;
          line-height: 1.4;
          border-radius: 4px;
        }
        #sawo-hc-wrap .sawo-hc-voltage-pill.sawo-hc-match {
          background: #af8564;
          color: #fff;
          border-color: #af8564;
        }
        #sawo-hc-wrap .sawo-hc-no-result {
          font-size: 14px;
          font-weight: 400;
          color: #7a6150;
          padding: 24px 0;
        }

        /* ── Skeleton ── */
        @keyframes sawo-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        #sawo-hc-wrap .sawo-hc-skeleton {
          background: #f7f5f2;
          border: 1.5px solid rgba(175,133,100,0.12);
          border-radius: 14px;
          overflow: hidden;
        }
        #sawo-hc-wrap .sawo-hc-skeleton-img {
          width: 100%;
          aspect-ratio: 4 / 3;
          background: linear-gradient(90deg, #f0ebe3 25%, #faf8f5 50%, #f0ebe3 75%);
          background-size: 200% 100%;
          animation: sawo-shimmer 1.5s infinite;
        }
        #sawo-hc-wrap .sawo-hc-skeleton-body { padding: 14px 16px 16px; }
        #sawo-hc-wrap .sawo-hc-skeleton-line {
          height: 11px;
          background: linear-gradient(90deg, #f0ebe3 25%, #faf8f5 50%, #f0ebe3 75%);
          background-size: 200% 100%;
          animation: sawo-shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 8px;
          width: 68%;
        }
        #sawo-hc-wrap .sawo-hc-skeleton-line2 {
          height: 9px;
          background: linear-gradient(90deg, #f0ebe3 25%, #faf8f5 50%, #f0ebe3 75%);
          background-size: 200% 100%;
          animation: sawo-shimmer 1.5s infinite;
          border-radius: 4px;
          width: 42%;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          #sawo-hc-wrap { padding: 120px 40px 60px; }
        }
        @media (max-width: 768px) {
          #sawo-hc-wrap { padding: 110px 24px 60px; }
          #sawo-hc-wrap .sawo-hc-card { padding: 24px 20px; }
          #sawo-hc-wrap .sawo-hc-dim-row { grid-template-columns: 1fr; }
          #sawo-hc-wrap .sawo-hc-dim-image { min-height: 220px; height: 220px !important; }
          #sawo-hc-wrap .sawo-hc-result-half { padding: 22px 20px; }
          #sawo-hc-wrap .sawo-hc-result-card-val { font-size: 32px; }
        }
        @media (max-width: 480px) {
          #sawo-hc-wrap { padding: 100px 16px 48px; }
          #sawo-hc-wrap .sawo-hc-intro h2 { font-size: 24px; }
          #sawo-hc-wrap .sawo-hc-intro p  { font-size: 16px; }
          #sawo-hc-wrap .sawo-hc-inp { font-size: 24px; }
          #sawo-hc-wrap .sawo-hc-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        }
      `}</style>

      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <div className="sawo-hc-intro">
        <h2>Sauna Volume Calculator</h2>
        <p>
          The size of your sauna directly affects the heater power required. Use this sauna volume
          calculator to measure your sauna room dimensions and get a precise heater recommendation
          in kW for optimal performance.
        </p>
      </div>

      {/* ── Input card ────────────────────────────────────────────────────── */}
      <div className="sawo-hc-card">
        <div className="sawo-hc-card-title">
          Room Dimensions
        </div>

        <div className="sawo-hc-dim-row">
          {/* Left: inputs — ref tracked for height sync */}
          <div className="sawo-hc-dim-inputs" ref={leftColRef}>
            <DimField label="Width"  value={width}  onChange={setWidth}  placeholder="2.4" hint="Wall to wall" />
            <DimField label="Height" value={height} onChange={setHeight} placeholder="2.1" hint="Floor to ceiling" />
            <DimField label="Depth"  value={depth}  onChange={setDepth}  placeholder="1.8" hint="Front to back" />
          </div>

          {/* Right: image — height synced to left column via ResizeObserver */}
          <div
            className="sawo-hc-dim-image"
            style={leftHeight ? { height: leftHeight } : {}}
          >
            <img
              src="https://www.sawo.com/wp-content/uploads/2026/03/CUB3-Ni2_InsideSaunaRoom.webp"
              alt="Inside a SAWO sauna room"
            />
            <div className="sawo-hc-dim-image-overlay" />
            <span className="sawo-hc-dim-image-label">SAWO Sauna Room</span>
          </div>
        </div>

        {/* Result bar */}
        <div className={`sawo-hc-result-row-wrap${showResult ? " visible" : ""}`}>
          <div className="sawo-hc-result-combined">
            <div className="sawo-hc-result-half">
              <div className="sawo-hc-result-card-label">Sauna Volume</div>
              <div className="sawo-hc-result-card-val">
                {volume !== null ? volume : "—"}
                <small>m³</small>
              </div>
            </div>
            <div className="sawo-hc-result-sep" />
            <div className="sawo-hc-result-half">
              <div className="sawo-hc-result-card-label">Recommended Power</div>
              <div className="sawo-hc-result-card-val">
                {matchKw !== null ? matchKw : "—"}
                <small>kW</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommendations ───────────────────────────────────────────────── */}
      <div className={`sawo-hc-reco-section${showResult ? " visible" : ""}`}>
        <div className="sawo-hc-reco-header">
          <h3 className="sawo-hc-reco-title">Recommended Heaters</h3>
          {!loadingProducts && matched.length > 0 && (
            <span className="sawo-hc-reco-badge">
              {matched.length} heater{matched.length !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        {showResult && matched.length > 0 && (
          <p className="sawo-hc-reco-sub">
            Showing heaters compatible with <strong>{matchKw} kW</strong> for a{" "}
            <strong>{volume} m³</strong> sauna.
          </p>
        )}

        <div className="sawo-hc-grid">
          {loadingProducts &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sawo-hc-skeleton">
                <div className="sawo-hc-skeleton-img" />
                <div className="sawo-hc-skeleton-body">
                  <div className="sawo-hc-skeleton-line" />
                  <div className="sawo-hc-skeleton-line2" />
                </div>
              </div>
            ))}

          {!loadingProducts && showResult && matched.length === 0 && (
            <p className="sawo-hc-no-result">
              No heaters found for this power rating. Please{" "}
              <a href="/contact" style={{ color:"#af8564", fontWeight:700 }}>contact us</a>{" "}
              for advice.
            </p>
          )}

          {!loadingProducts &&
            matched.map(p => (
              <ProductCard key={p.id || p.slug} product={p} matchKw={matchKw} />
            ))}
        </div>
      </div>
    </div>
  );
}