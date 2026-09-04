// src/pages/Sauna/SaunaCalculator.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import img_CUB3_Ni2_InsideSaunaRoom from "../../assets/CUB3-Ni2_InsideSaunaRoom.webp";
import SEO from "../../components/SEO";
import { isPubliclyVisible } from "../../local-storage/visibility";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field) {
  const path = localOrRemote(product, field);
  if (!path) return null;
  return path;
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

// Meters <-> feet
const M_PER_FT = 1 / 3.28084;

// Standard SAWO heater sizing table: kW rating -> min/max room volume (m³) it heats.
// Sourced from SAWO heater spec sheets (matches the WordPress sauna calculator shortcode).
const SAWO_RANGE_TABLE = [
  { kw: 2.3, min: 1,  max: 3  },
  { kw: 3.0, min: 2,  max: 4  },
  { kw: 3.6, min: 3,  max: 5  },
  { kw: 4.5, min: 3,  max: 6  },
  { kw: 6.0, min: 5,  max: 9  },
  { kw: 8.0, min: 7,  max: 13 },
  { kw: 9.0, min: 8,  max: 14 },
  { kw: 12.0, min: 11, max: 18 },
];

// Picks the smallest heater whose range covers the effective volume; if the
// volume exceeds every range, returns the largest heater flagged as oversized.
function sawoHcClosestKw(effectiveVolume) {
  const byMax = SAWO_RANGE_TABLE.slice().sort((a, b) => a.max - b.max);
  const fits = byMax.filter(e => effectiveVolume >= e.min && effectiveVolume <= e.max);
  if (fits.length) {
    const best = fits.reduce((a, b) => (a.max < b.max ? a : b));
    return { match: best.kw, oversized: false };
  }

  const byKw = SAWO_RANGE_TABLE.slice().sort((a, b) => a.kw - b.kw);
  const nextUp = byKw.find(e => e.min >= effectiveVolume);
  if (nextUp) return { match: nextUp.kw, oversized: false };

  const largest = byKw[byKw.length - 1];
  return { match: largest.kw, oversized: true };
}

// Limit input: max 2 digits before decimal point
function limitTwoDigits(val) {
  if (!val) return val;
  const parts = val.split(".");
  if (parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
  return parts.join(".");
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function DimField({ label, subLabel, value, onChange, placeholder, hint, unit }) {
  return (
    <div className="sawo-hc-field">
      <span className="sawo-hc-label">
        {label} {subLabel && <span className="sawo-hc-label-note">{subLabel}</span>}
      </span>
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
        <span className="sawo-hc-unit">{unit}</span>
      </div>
      {hint && <span className="sawo-hc-hint">{hint}</span>}
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, matchKw, localize }) {
  const voltages = extractKwFromTags(product.tags || []).sort((a, b) => a - b);

  return (
    <Link to={localize(`/products/${product.slug}`)} className="sawo-hc-product-card">
      <div className="sawo-hc-img-wrap">
        {getImageUrl(product, 'thumbnail') ? (
          <img
            src={getImageUrl(product, 'thumbnail')}
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
  const { products: localProds, loading: loadingProducts } = useLocalProducts();
  const t = useLocaleT("support");
  const localize = useLocalizedPath();
  const [unit, setUnit] = useState("m"); // "m" | "ft"
  const [width,  setWidth]  = useState("");
  const [height, setHeight] = useState("");
  const [depth,  setDepth]  = useState("");
  const [uninsulated, setUninsulated] = useState("");

  const imperial = unit === "ft";

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

  const allProducts = useMemo(() => {
    const visible = localProds.filter(p => isPubliclyVisible(p));
    return [...visible].sort((a, b) => {
      const sortA = a.sort_order ?? 999;
      const sortB = b.sort_order ?? 999;
      if (sortA !== sortB) return sortA - sortB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [localProds]);

  // ── Unit toggle: convert entered values in place ──────────────────────────
  function handleUnitToggle(next) {
    if (next === unit) return;
    const toImperial = next === "ft";

    const convertLen = v => {
      if (!v) return v;
      const n = parseFloat(v);
      if (Number.isNaN(n)) return v;
      return String(hcRound(toImperial ? n / M_PER_FT : n * M_PER_FT));
    };
    const convertArea = v => {
      if (!v) return v;
      const n = parseFloat(v);
      if (Number.isNaN(n)) return v;
      const f = 1 / M_PER_FT; // 3.28084
      return String(hcRound(toImperial ? n * f * f : n / (f * f)));
    };

    setWidth(w => convertLen(w));
    setHeight(h => convertLen(h));
    setDepth(d => convertLen(d));
    setUninsulated(u => convertArea(u));
    setUnit(next);
  }

  function handleClear() {
    setWidth("");
    setHeight("");
    setDepth("");
    setUninsulated("");
  }

  // ── Derived calculation ─────────────────────────────────────────────────
  const { volume, effectiveVolume, matchKw, oversized, showResult } = useMemo(() => {
    const w = parseFloat(width)  || 0;
    const h = parseFloat(height) || 0;
    const d = parseFloat(depth)  || 0;
    const u = parseFloat(uninsulated) || 0;

    if (!w || !h || !d) {
      return { volume: null, effectiveVolume: null, matchKw: null, oversized: false, showResult: false };
    }

    const factor = imperial ? M_PER_FT : 1;
    const vol = hcRound(w * factor * h * factor * d * factor);
    const uninsulatedM2 = hcRound(u * factor * factor);
    // Every m² of uninsulated surface (glass, tile, stone, concrete) effectively
    // adds 1.2 m³ to the volume the heater needs to warm.
    const effVol = hcRound(vol + uninsulatedM2 * 1.2);
    const { match, oversized: over } = sawoHcClosestKw(effVol);

    return { volume: vol, effectiveVolume: effVol, matchKw: match, oversized: over, showResult: true };
  }, [width, height, depth, uninsulated, imperial]);

  const matched = useMemo(() => {
    if (matchKw === null || allProducts.length === 0) return [];
    return allProducts.filter(p =>
      extractKwFromTags(p.tags || []).some(v => Math.abs(v - matchKw) < 0.05)
    );
  }, [allProducts, matchKw]);

  const lenUnit = imperial ? "ft" : "m";
  const areaUnit = imperial ? "ft²" : "m²";
  const placeholders = imperial ? ["7.9", "6.9", "5.9"] : ["2.4", "2.1", "1.8"];
  const dimHints = imperial
    ? t("calculator.fields.hints.imperial", { returnObjects: true })
    : t("calculator.fields.hints.metric", { returnObjects: true });

  const volSubParts = [];
  if (showResult) {
    if (imperial) volSubParts.push(`(${hcRound(volume * 35.3147)} ft³)`);
    if (parseFloat(uninsulated) > 0) volSubParts.push(t("calculator.result.effective", { val: effectiveVolume }));
  }

  return (
    <div id="sawo-hc-wrap">
      <SEO
        title={t("calculator.meta.title")}
        description={t("calculator.meta.description")}
        path={localize("/support/sauna-calculator")}
        hreflangAlternates={{ en: "/support/sauna-calculator", zh: "/zh/support/sauna-calculator" }}
      />
      <style>{`

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
        #sawo-hc-wrap .sawo-hc-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 28px;
        }
        #sawo-hc-wrap .sawo-hc-card-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #af8564;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        #sawo-hc-wrap .sawo-hc-card-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        #sawo-hc-wrap .sawo-hc-unit-toggle {
          display: flex;
          align-items: center;
          background: rgba(175,133,100,0.08);
          border: 1.5px solid rgba(175,133,100,0.25);
          border-radius: 6px;
          overflow: hidden;
        }
        #sawo-hc-wrap .sawo-hc-unit-btn {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #af8564;
          background: transparent;
          border: none;
          padding: 5px 12px;
          cursor: pointer;
          line-height: 1;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        #sawo-hc-wrap .sawo-hc-unit-btn.active {
          background: #af8564;
          color: #fff;
        }
        #sawo-hc-wrap .sawo-hc-unit-btn:hover:not(.active) {
          background: rgba(175,133,100,0.15);
        }
        #sawo-hc-wrap .sawo-hc-clear-btn {
          background: rgba(175,133,100,0.08);
          border: 1.5px solid rgba(175,133,100,0.25);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #af8564;
          cursor: pointer;
          padding: 5px 12px;
          line-height: 1;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        #sawo-hc-wrap .sawo-hc-clear-btn:hover {
          background: rgba(175,133,100,0.18);
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
        #sawo-hc-wrap .sawo-hc-vol-sub {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.62);
          margin-top: 6px;
          min-height: 16px;
          line-height: 1;
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
        #sawo-hc-wrap .sawo-hc-label-note {
          font-weight: 500;
          letter-spacing: normal;
          text-transform: none;
          color: rgba(255,255,255,0.5);
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
        #sawo-hc-wrap .sawo-hc-reco-warn {
          font-size: 13px;
          font-weight: 600;
          color: #b45309;
          background: rgba(180,83,9,0.08);
          border: 1px solid rgba(180,83,9,0.2);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 18px;
        }

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
        <h2>{t("calculator.intro.title")}</h2>
        <p>
          {t("calculator.intro.desc")}
        </p>
      </div>

      {/* ── Input card ────────────────────────────────────────────────────── */}
      <div className="sawo-hc-card">
        <div className="sawo-hc-card-header">
          <div className="sawo-hc-card-title">{t("calculator.card.title")}</div>
          <div className="sawo-hc-card-controls">
            {(width || height || depth || uninsulated) && (
              <button type="button" className="sawo-hc-clear-btn" onClick={handleClear}>{t("calculator.card.clear")}</button>
            )}
            <div className="sawo-hc-unit-toggle">
              <button
                type="button"
                className={`sawo-hc-unit-btn${!imperial ? " active" : ""}`}
                onClick={() => handleUnitToggle("m")}
              >m</button>
              <button
                type="button"
                className={`sawo-hc-unit-btn${imperial ? " active" : ""}`}
                onClick={() => handleUnitToggle("ft")}
              >ft</button>
            </div>
          </div>
        </div>

        <div className="sawo-hc-dim-row">
          {/* Left: inputs — ref tracked for height sync */}
          <div className="sawo-hc-dim-inputs" ref={leftColRef}>
            <DimField
              label={t("calculator.fields.width.label")} subLabel={t("calculator.fields.width.subLabel")}
              value={width} onChange={setWidth}
              placeholder={placeholders[0]} hint={dimHints.w} unit={lenUnit}
            />
            <DimField
              label={t("calculator.fields.height.label")} subLabel={t("calculator.fields.height.subLabel")}
              value={height} onChange={setHeight}
              placeholder={placeholders[1]} hint={dimHints.h} unit={lenUnit}
            />
            <DimField
              label={t("calculator.fields.depth.label")} subLabel={t("calculator.fields.depth.subLabel")}
              value={depth} onChange={setDepth}
              placeholder={placeholders[2]} hint={dimHints.d} unit={lenUnit}
            />
            <DimField
              label={t("calculator.fields.uninsulated.label")} subLabel={t("calculator.fields.uninsulated.subLabel")}
              value={uninsulated} onChange={setUninsulated}
              placeholder="0" hint={t("calculator.fields.uninsulated.hint")} unit={areaUnit}
            />
          </div>

          {/* Right: image — height synced to left column via ResizeObserver */}
          <div
            className="sawo-hc-dim-image"
            style={leftHeight ? { height: leftHeight } : {}}
          >
            <img
              src={img_CUB3_Ni2_InsideSaunaRoom}
              alt={t("calculator.imageAlt")}
            />
            <div className="sawo-hc-dim-image-overlay" />
          </div>
        </div>

        {/* Result bar */}
        <div className={`sawo-hc-result-row-wrap${showResult ? " visible" : ""}`}>
          <div className="sawo-hc-result-combined">
            <div className="sawo-hc-result-half">
              <div className="sawo-hc-result-card-label">{t("calculator.result.volumeLabel")}</div>
              <div className="sawo-hc-result-card-val">
                {volume !== null ? volume : "-"}
                <small>m³</small>
              </div>
              <div className="sawo-hc-vol-sub">{volSubParts.join(" · ")}</div>
            </div>
            <div className="sawo-hc-result-sep" />
            <div className="sawo-hc-result-half">
              <div className="sawo-hc-result-card-label">{t("calculator.result.heaterLabel")}</div>
              <div className="sawo-hc-result-card-val">
                {matchKw !== null ? matchKw : "-"}
                <small>kW</small>
              </div>
              <div className="sawo-hc-vol-sub">{oversized ? t("calculator.result.oversized") : ""}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommendations ───────────────────────────────────────────────── */}
      <div className={`sawo-hc-reco-section${showResult ? " visible" : ""}`}>
        <div className="sawo-hc-reco-header">
          <h3 className="sawo-hc-reco-title">{t("calculator.reco.title")}</h3>
          {!loadingProducts && matched.length > 0 && (
            <span className="sawo-hc-reco-badge">
              {t("calculator.reco.badge", { count: matched.length })}
            </span>
          )}
        </div>

        {showResult && matched.length > 0 && (
          <p
            className="sawo-hc-reco-sub"
            dangerouslySetInnerHTML={{ __html: t("calculator.reco.sub", { kw: matchKw, volume }) }}
          />
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
              {t("calculator.reco.noResultPrefix")}{" "}
              <a href={localize("/contact")} style={{ color:"#af8564", fontWeight:700 }}>{t("calculator.reco.noResultLink")}</a>{" "}
              {t("calculator.reco.noResultSuffix")}
            </p>
          )}

          {!loadingProducts &&
            matched.map(p => (
              <ProductCard key={p.id || p.slug} product={p} matchKw={matchKw} localize={localize} />
            ))}
        </div>
      </div>
    </div>
  );
}
