// Displays the individual product (heater) detail page when clicked from the products listing or catalog

import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLocalProducts } from "../../Administrator/Local/useLocalProducts";
import { ImageWithLoader } from "../../components/ImageWithLoader";
import { Lightbox } from "../../components/Lightbox";
import SEO from "../../components/SEO";
import { isPubliclyVisible } from "../../local-storage/visibility";
import { getVariationsArray } from "./DispAccessories";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}
function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl;
}
function getImageUrl(product, field) {
  return resolveUrl(localOrRemote(product, field));
}
function getImagesArray(product, field) {
  const local = product?.[`local_${field}`];
  const remote = product?.[field];
  const arr = (local?.length ? local : remote) || [];
  return arr.map(resolveUrl).filter(Boolean);
}
function getFilesArray(product) {
  const local = product?.local_files;
  const remote = product?.files;
  if (local?.length) return local.map(f => ({ name: f.name, url: resolveUrl(f.path || f.url) }));
  return (remote || []).map(f => ({ name: f.name, url: f.url }));
}

/* ── Image Carousel ───────────────────────────────────────────────── */
function Carousel({ images, thumbnail, videoUrl, onImageClick, productName }) {
  const items = [
    ...(thumbnail ? [{ type: 'image', url: thumbnail }] : []),
    ...(images || []).filter(u => u !== thumbnail).map(u => ({ type: 'image', url: u })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl }] : []),
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState({});

  if (!items.length) {
    return (
      <div style={{
        width: "100%", aspectRatio: "1/1", background: "#faf7f4",
        borderRadius: 14, display: "flex", alignItems: "center",
        justifyContent: "center", border: "1px solid #edddd0",
      }}>
        <i className="fa-regular fa-image" style={{ fontSize: "3.5rem", color: "#d5b99a" }} />
      </div>
    );
  }

  const prev = () => setIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setIdx(i => (i + 1) % items.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{
        position: "relative", borderRadius: 0, overflow: "hidden",
        background: "transparent", border: "none",
        aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: items[idx]?.type === 'image' ? "zoom-in" : "default",
        width: "100%",
      }}
        onClick={() => items[idx]?.type === 'image' && onImageClick([items[idx].url], 0)}
      >
        {items[idx]?.type === 'image' ? (
          <>
            {!err[idx] && (
              <ImageWithLoader
                key={idx}
                src={items[idx].url}
                alt={productName || ""}
                onError={() => setErr(e => ({ ...e, [idx]: true }))}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  padding: 0,
                  animation: "ppFadeIn 0.25s ease",
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
            {err[idx] && (
              <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
            )}
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", overflow: "hidden" }}>
            <video
              src={items[idx]?.url}
              autoPlay
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                animation: "ppFadeIn 0.25s ease",
              }}
            />
          </div>
        )}

        {items.length > 1 && (
          <>
            {[{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
              <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{
                position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none",
                borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "none", transition: "all 0.2s", color: "#a67853", zIndex: 10,
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#8b5e3c"; e.currentTarget.style.transform = "translateY(-50%) scale(1.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#a67853"; e.currentTarget.style.transform = "translateY(-50%)"; }}
              >
                <i className={`fa-solid ${icon}`} style={{ fontSize: "1.2rem", fontWeight: "bold" }} />
              </button>
            ))}
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
              {items.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                  style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, padding: 0, border: "none", cursor: "pointer", transition: "all 0.22s", background: i === idx ? "#a67853" : "rgba(139,94,60,0.25)" }} />
              ))}
            </div>
            <span style={{
              position: "absolute", top: 10, right: 10,
              background: "rgba(44,26,14,0.55)", color: "#fff",
              fontSize: "0.65rem", fontFamily: "'Montserrat',sans-serif",
              fontWeight: 600, padding: "2px 8px", borderRadius: 20,
            }}>
              {idx + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{
                flexShrink: 0, width: 58, height: 58, borderRadius: 8, overflow: "hidden",
                border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`,
                background: "#faf7f4", cursor: "pointer", padding: 0, transition: "border-color 0.18s",
              }}>
              {item.type === 'video' ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#edddd0" }}>
                  <i className="fa-solid fa-play" style={{ color: "#a67853", fontSize: "1rem" }} />
                </div>
              ) : !err[i] ? (
                <ImageWithLoader
                  src={item.url}
                  alt={productName ? `${productName} thumbnail ${i + 1}` : ""}
                  onError={() => setErr(e => ({ ...e, [i]: true }))}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }}
                />
              ) : (
                <i className="fa-regular fa-image" style={{ color: "#d5b99a", fontSize: "1rem" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Compact Spec Image Strip (for Section 1 right column) ────────── */
function CompactSpecImages({ images, onImageClick, productName }) {
  const [idx, setIdx] = useState(0);
  if (!images || !images.length) return null;
  const single = images.length === 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        minHeight: 100,
      }} onClick={() => onImageClick(images, idx)}>
        <ImageWithLoader
          key={idx}
          src={images[idx]}
          alt={productName ? `${productName} diagram ${idx + 1}` : ""}
          style={{
            width: "100%", objectFit: "contain",
            display: "block", animation: "ppFadeIn 0.2s ease",
          }}
        />
        {!single && (
          <>
            <span style={{
              position: "absolute", top: 4, right: 4,
              background: "rgba(44,26,14,0.45)", color: "#fff",
              fontSize: "0.6rem", fontFamily: "'Montserrat',sans-serif",
              fontWeight: 600, padding: "2px 7px", borderRadius: 20, pointerEvents: "none",
            }}>
              {idx + 1} / {images.length}
            </span>
            {[
              { fn: () => setIdx(i => (i - 1 + images.length) % images.length), side: "left", icon: "fa-chevron-left" },
              { fn: () => setIdx(i => (i + 1) % images.length), side: "right", icon: "fa-chevron-right" },
            ].map(({ fn, side, icon }) => (
              <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{
                position: "absolute", [side]: 2, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none",
                borderRadius: "50%", width: 26, height: 26, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#a67853", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#8b5e3c"; e.currentTarget.style.transform = "translateY(-50%) scale(1.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#a67853"; e.currentTarget.style.transform = "translateY(-50%)"; }}
              >
                <i className={`fa-solid ${icon}`} style={{ fontSize: "0.9rem" }} />
              </button>
            ))}
          </>
        )}
      </div>

      {!single && (
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
          {images.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{
                flexShrink: 0, width: 40, height: 40, borderRadius: 6, overflow: "hidden",
                border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`,
                background: "transparent", cursor: "pointer", padding: 0, transition: "border-color 0.18s",
              }}>
              <ImageWithLoader
                src={url}
                alt={productName ? `${productName} diagram ${i + 1}` : ""}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── PDF Resources Panel ──────────────────────────────────────────── */
function ResourcesPanel({ files }) {
  const [expanded, setExpanded] = useState(false);
  const isMultiple = files?.length > 1;
  const t = useLocaleT("product");

  if (!files?.length) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", minHeight: 180, color: "#c4a882",
      fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", textAlign: "center", gap: 10,
    }}>
      <i className="fa-regular fa-folder-open" style={{ fontSize: "2rem", color: "#ddc9b4" }} />
      {t("noResourcesAvailable")}
    </div>
  );

  // Single file: show normally
  if (!isMultiple) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {files.map((f, i) => (
          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              background: "#faf7f4", borderRadius: 10, border: "1px solid #edddd0",
              color: "#2c1a0e", textDecoration: "none",
              fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; e.currentTarget.style.borderColor = "#d4b896"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#faf7f4"; e.currentTarget.style.borderColor = "#edddd0"; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 9,
              background: "linear-gradient(135deg,#8b5e3c,#a67853)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "1rem" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>PDF · Click to open</div>
            </div>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.7rem", flexShrink: 0 }} />
          </a>
        ))}
      </div>
    );
  }

  // Multiple files: show with dropdown toggle
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Dropdown toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          background: "#faf7f4", borderRadius: expanded ? "10px 10px 0 0" : 10,
          border: "1px solid #edddd0", borderBottom: expanded ? "1px solid #edddd0" : "1px solid #edddd0",
          color: "#2c1a0e", cursor: "pointer", textDecoration: "none",
          fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", fontWeight: 700,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; e.currentTarget.style.borderColor = "#d4b896"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#faf7f4"; e.currentTarget.style.borderColor = "#edddd0"; }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 9,
          background: "linear-gradient(135deg,#8b5e3c,#a67853)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "0.9rem" }} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e" }}>
            {files.length} Documents
          </div>
          <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>Click to {expanded ? "collapse" : "expand"}</div>
        </div>
        <i
          className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`}
          style={{ color: "#a67853", fontSize: "0.7rem", flexShrink: 0, transition: "transform 0.2s" }}
        />
      </button>

      {/* Expanded list */}
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0", borderTop: "1px solid #edddd0" }}>
          {files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                background: "#fdf8f5", borderRadius: 8,
                color: "#2c1a0e", textDecoration: "none",
                fontFamily: "'Montserrat',sans-serif", fontSize: "0.80rem",
                transition: "all 0.2s",
                marginLeft: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fdf8f5"; }}
            >
              <i className="fa-solid fa-file-pdf" style={{ color: "#a67853", fontSize: "0.85rem", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.name}
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.65rem", flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Section Label ────────────────────────────────────────────────── */
function SectionLabel({ icon, text }) {
  return (
    <h3 style={{
      fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
      fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase",
      color: "#8b5e3c", margin: "0 0 10px",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      {icon && <i className={icon} style={{ opacity: 0.75 }} />}
      {text}
    </h3>
  );
}

/* ── Divider ──────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 32px" }}>
      <div style={{ height: 1, background: "linear-gradient(to right,transparent,#edddd0,transparent)" }} />
    </div>
  );
}

/* ── Curated accessory pairings ──────────────────────────────────────
   Manual "goes with this heater" list — these accessories don't share a
   category with the heater (Towers vs. Heater Guard/Sauna Accessories/
   Humidifiers/Sauna Stones), so the category-match fallback below can't
   find them on its own. Keyed by slug *prefix* so it covers every
   NB/Ni2/NS + Black variant of the SAWO30 Wall heater. */
const CURATED_RELATED_BY_SLUG_PREFIX = [
  {
    prefix: "sawo30-wall",
    slugs: [
      "heater-guard-sawo30-wall",
      "integration-collar-wall-wooden",
      "integration-collar-sawo30-wall-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "sawo30-round",
    slugs: [
      "heater-guard-sawo30-round",
      "integration-collar-round-wooden",
      "integration-collar-round-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "sawo30-corner",
    slugs: [
      "heater-guard-sawo30-corner",
      "integration-collar-corner-wooden",
      "integration-collar-sawo30-corner-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "tower-round",
    slugs: [
      "heater-guard-tower-round",
      "integration-collar-round-wooden",
      "integration-collar-round-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "tower-wall",
    slugs: [
      "heater-guard-tower-wall",
      "integration-collar-wall-wooden",
      "integration-collar-tower-wall-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "tower-corner",
    slugs: [
      "heater-guard-tower-corner",
      "integration-collar-corner-wooden",
      "integration-collar-tower-corner-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "aries-round",
    slugs: [
      "heater-guard-aries-round",
      "integration-collar-round-wooden",
      "integration-collar-round-stainless",
      "integration-collar-round-v2-stainless",
      "safety-switch-for-heaters",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "aries-wall",
    slugs: [
      "heater-guard-aries-wall",
      "integration-collar-wall-wooden",
      "integration-collar-tower-wall-stainless",
      "safety-switch-for-heaters",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "aries-corner",
    slugs: [
      "heater-guard-aries-corner",
      "integration-collar-corner-wooden",
      "integration-collar-tower-corner-stainless",
      "safety-switch-for-heaters",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "cubos",
    slugs: [
      "heater-guard-cubos-middle",
      "heater-guard-cubos-wall",
      "heater-guard-cubos-corner",
      "integration-collar-cubos-middle-wooden",
      "integration-collar-cubos-wall-wooden",
      "integration-collar-cubos-corner-wooden",
      "integration-collar-cubos-middle-stainless",
      "integration-collar-cubos-wall-stainless",
      "integration-collar-cubos-corner-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "heaterking-wall",
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "heaterking-corner",
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "heaterking-round",
    slugs: [
      "heater-guard-heaterking-round-w2",
      "heater-guard-heaterking-round-w4",
      "heater-guard-heaterking-round-w6",
      "heater-guard-heaterking-round-w9",
      "heater-guard-heaterking-round-w12",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "phoenix",
    slugs: [
      "heater-guard-phoenix",
      "integration-collar-round-wooden",
      "integration-collar-phoenix-stainless",
      "integration-collar-round-v2-stainless",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "fiberjungle-ns",
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  ...["nordex-nb", "nordex-black-nb", "nordex-ni2", "nordex-black-ni2", "nordex-ns", "nordex-black-ns"].map(prefix => ({
    prefix,
    slugs: [
      "heater-guard-nordex-wall",
      "safety-switch-for-heaters",
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  ...["nordex-mini-combi-ns", "nordex-mini-combi-black-ns"].map(prefix => ({
    prefix,
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  {
    prefix: "nordex-mini",
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  ...["nordex-combi-ns", "nordex-combi-black-ns"].map(prefix => ({
    prefix,
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  ...["mini-nb", "mini-fibercoated-nb"].map(prefix => ({
    prefix,
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  {
    prefix: "mini-x",
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "mini-combi",
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  ...["scandia-nb", "scandia-ns", "scandia-fibercoated-nb", "scandia-fibercoated-ns"].map(prefix => ({
    prefix,
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  {
    prefix: "scandia-combi",
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
      "safety-switch-for-heaters",
    ],
  },
  ...["krios-nb", "krios-ni2", "krios-ni2a", "krios-ns"].map(prefix => ({
    prefix,
    slugs: [
      "heater-guard-krios-wall",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
      "safety-switch-for-heaters",
    ],
  })),
  {
    prefix: "scandifire",
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "cumulus",
    slugs: [
      "cozy-tank-13l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "nimbus-ns",
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "helius",
    slugs: [
      "heater-guard-helius",
      "helius-heater-hood",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "taurus-d-ns",
    slugs: [
      "heater-guard-taurus",
      "cozy-tank-13l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  ...["savonia-ns", "savonia-fiber-coated-ns"].map(prefix => ({
    prefix,
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  {
    prefix: "nordex-pro-ns",
    slugs: [
      "heater-guard-nordex-pro",
      "safety-switch-for-heaters",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "nordex-pro-combi-ns",
    slugs: [
      "heater-guard-nordex-pro-combi",
      "safety-switch-for-heaters",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  ...["nordex-s-ns", "nordex-s-black-ns"].map(prefix => ({
    prefix,
    slugs: [
      "heater-guard-nordex-s",
      "cozy-tank-13l",
      "safety-switch-for-heaters",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  ...["nordex-s-combi-ns", "nordex-s-combi-black-ns"].map(prefix => ({
    prefix,
    slugs: [
      "heater-guard-nordex-s-combi",
      "safety-switch-for-heaters",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  ...["nordex-floor-ns", "nordex-floor-black-ns"].map(prefix => ({
    prefix,
    slugs: [
      "cozy-tank-13l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  {
    prefix: "taurus-d-combi-ns",
    slugs: [
      "heater-guard-taurus",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  ...["savonia-combi-ns", "savonia-combi-fiber-coated-ns"].map(prefix => ({
    prefix,
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  })),
  {
    prefix: "nimbus-combi-ns",
    slugs: [
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
  {
    prefix: "minidragon",
    slugs: [
      "cozy-tank-03l",
      "cozy-tank-06l",
      "sauna-stones-olivine-diabase-rounded-20kg",
      "decorative-sauna-stones-white-quartz-rounded-10kg",
    ],
  },
];

/* ── Related Products grid (shared by every group below) ────────────── */
function RelatedProductsGrid({ eyebrow, title, items }) {
  const localize = useLocalizedPath();
  if (!items.length) return null;
  return (
    <>
      <Divider />
      {/* Symmetric top/bottom padding — this grid renders back-to-back with
          another one of itself (Accessories, then Other Heaters), so a
          lopsided bottom padding here would stack with this one's own top
          padding and blow the gap between them out to ~130px. */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "44px 32px" }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
            fontSize: "0.67rem", letterSpacing: "0.14em", textTransform: "uppercase",
            color: "#a67853", margin: "0 0 6px",
          }}>
            {eyebrow}
          </p>
          <h2 style={{
            fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
            fontSize: "1.5rem", color: "#2c1a0e", margin: 0, lineHeight: 1.2,
          }}>
            {title}
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 24,
        }}>
          {items.map(p => (
            <Link
              key={p.id || p.slug}
              to={localize(`/products/${p.slug}`)}
              style={{ textDecoration: "none", cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex", flexDirection: "column", gap: 12,
                  transition: "all 0.25s ease",
                  padding: 12,
                  borderRadius: 12,
                  border: "2px solid transparent",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = "2px solid #a67853";
                  e.currentTarget.style.background = "rgba(246, 242, 237, 0.5)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = "2px solid transparent";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Image */}
                <div style={{
                  aspectRatio: "1/1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 12,
                  borderRadius: 8,
                }}>
                  {getImageUrl(p, 'thumbnail') ? (
                    <ImageWithLoader
                      src={getImageUrl(p, 'thumbnail')}
                      alt={p.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <i className="fa-regular fa-image" style={{ color: "#d5b99a", fontSize: "2rem" }} />
                  )}
                </div>

                {/* Name - Centered */}
                <p style={{
                  fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                  fontSize: "0.82rem", color: "#2c1a0e", margin: 0, lineHeight: 1.4,
                  textAlign: "center",
                }}>
                  {p.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Related Products ─────────────────────────────────────────────── */
function RelatedProducts({ currentSlug, categories, allProducts = [] }) {
  const t = useLocaleT("product");
  const { accessories, otherHeaters, generic } = useMemo(() => {
    const empty = { accessories: [], otherHeaters: [], generic: [] };
    if (!allProducts.length) return empty;

    const sameCategory = (cats) => {
      if (!cats?.length) return [];
      const lower = cats.slice(0, 1).map(c => c.toLowerCase());
      return allProducts
        .filter(p =>
          isPubliclyVisible(p) &&
          p.slug !== currentSlug &&
          (p.categories || []).some(c => lower.includes(c.toLowerCase()))
        )
        .slice(0, 4);
    };

    const curated = CURATED_RELATED_BY_SLUG_PREFIX.find(c => currentSlug?.startsWith(c.prefix));
    if (curated) {
      const bySlug = new Map(allProducts.map(p => [p.slug, p]));
      const accessories = curated.slugs
        .map(s => bySlug.get(s))
        .filter(p => p && isPubliclyVisible(p) && p.slug !== currentSlug);
      return { accessories, otherHeaters: sameCategory(categories), generic: [] };
    }

    return { accessories: [], otherHeaters: [], generic: sameCategory(categories) };
  }, [currentSlug, categories, allProducts]);

  if (!accessories.length && !otherHeaters.length && !generic.length) return null;

  if (accessories.length || otherHeaters.length) {
    return (
      <>
        <RelatedProductsGrid eyebrow={t("related.youMightAlsoLike")} title={t("related.saunaAccessories")} items={accessories} />
        <RelatedProductsGrid eyebrow={t("related.youMightAlsoLike")} title={t("related.otherHeaters")} items={otherHeaters} />
      </>
    );
  }

  return <RelatedProductsGrid eyebrow={t("related.youMightAlsoLike")} title={t("related.relatedProducts")} items={generic} />;
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function SkeletonPage() {
  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px 60px" }}>
      <style>{`@keyframes skS{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div style={{ aspectRatio: "1/1", borderRadius: 14, background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)", backgroundSize: "200% 100%", animation: "skS 1.4s infinite" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          {[35, 55, 80, 70, 60, 90, 55].map((w, i) => (
            <div key={i} style={{ height: i === 0 ? 26 : 12, width: `${w}%`, borderRadius: 6, background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)", backgroundSize: "200% 100%", animation: "skS 1.4s infinite" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Utility: Clean inline styles from HTML ────────────────────────── */
function cleanHTMLStyles(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Remove all style attributes from all elements, but preserve br tags
  const allElements = temp.querySelectorAll("*");
  allElements.forEach(el => {
    // Keep br tags without any attributes
    if (el.tagName === "BR") {
      el.removeAttribute("style");
      return;
    }
    el.removeAttribute("style");
  });

  // Ensure proper spacing between paragraphs
  let result = temp.innerHTML;
  // Add margin-bottom to paragraphs for spacing
  result = result.replace(/<p>/g, '<p margin-top: 0;">');

  return result;
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function ProductPage() {
  const { slug } = useParams();
  const [lightbox, setLightbox] = useState(null);
  const { products: localProds, loading } = useLocalProducts();
  const t = useLocaleT("product");
  const localize = useLocalizedPath();

  const product = useMemo(() => {
    if (!localProds.length) return null;
    return localProds.find(p => p.slug === slug && isPubliclyVisible(p)) || null;
  }, [localProds, slug]);

  const error = !loading && !product ? "Product not found." : null;

  const openLightbox = (images, index) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 80 }}>
      <SkeletonPage />
    </div>
  );

  if (error || !product) return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#fff",
      fontFamily: "'Montserrat',sans-serif", textAlign: "center", padding: "100px 24px 60px",
    }}>
      <div style={{
        width: 72, height: 72, background: "linear-gradient(135deg,#8b5e3c,#a67853)",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", boxShadow: "0 8px 28px rgba(139,94,60,0.28)",
      }}>
        <i className="fa-solid fa-magnifying-glass" style={{ color: "#fff", fontSize: "1.6rem" }} />
      </div>
      <h2 style={{ color: "#2c1a0e", margin: "0 0 8px" }}>{t("notFound.title")}</h2>
      <p style={{ color: "#a67853", margin: "0 0 24px", fontStyle: "italic", fontSize: "0.88rem" }}>
        {error || t("notFound.description")}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to={localize("/products")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", background: "linear-gradient(135deg,#8b5e3c,#a67853)", color: "#fff", textDecoration: "none", fontWeight: 700, borderRadius: 7, fontSize: "0.82rem" }}>
          {t("notFound.browseProducts")}
        </Link>
        <Link to={localize("/")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", border: "1.5px solid #a67853", color: "#a67853", textDecoration: "none", fontWeight: 700, borderRadius: 7, fontSize: "0.82rem" }}>
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );

  const files        = getFilesArray(product);
  const images       = getImagesArray(product, 'images');
  const thumbnail    = getImageUrl(product, 'thumbnail');
  const specImages   = getImagesArray(product, 'spec_images');
  const videoUrl     = product?.resources?.video || null;
  const hasShortDesc = !!product.short_description;
  const hasDesc      = !!product.description;
  const hasFeatures  = (product.features || []).length > 0;
  const hasSpec      = specImages.length > 0;
  const specHeaders  = product.spec_table?.headers || [];
  const specRows     = product.spec_table?.rows || [];
  const specCell     = (row, h, ci) => Array.isArray(row) ? row[ci] : row?.[h];
  const hasSpecTable = specHeaders.length > 0 && specRows.some(
    row => specHeaders.some((h, ci) => {
      const v = specCell(row, h, ci);
      return v !== null && v !== undefined && String(v).trim() !== "" && String(v).trim() !== "–";
    })
  );
  const hasResources = files.length > 0;
  // Reads through the unified `variations` column (falling back to the
  // legacy `heating_element_groups`/`variants` columns for not-yet-migrated
  // products) — see getVariationsArray() in DispAccessories.jsx. Filtered
  // down to entries that actually carry config-group-style content
  // (description/features/table), so a plain color/style variation with
  // just a name+color doesn't render an empty-looking group card here.
  const heatingGroups = getVariationsArray(product).filter(g => g && (g.description || g.spec_table || g.features?.length));
  const hasHeatingGroups = heatingGroups.length > 0;
  const hasSection2  = hasDesc || hasSpecTable || hasHeatingGroups;
  const includedItems = (product.included_items || []).filter(i => i && (i.image || i.title));
  const hasIncludedItems = includedItems.length > 0;

  // Plain-text meta description from whichever product copy is available —
  // short_description/description are HTML (rendered via dangerouslySetInnerHTML
  // above), so strip tags before handing to <SEO>.
  const seoDescription = (() => {
    const raw = product.short_description || product.description || "";
    const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return `${product.name} by SAWO. Premium Finnish sauna equipment.`;
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  })();

  return (
    <>
      <SEO
        title={product.meta_title || product.name}
        description={product.meta_description || seoDescription}
        path={`/products/${product.slug}`}
        image={product.og_image || thumbnail || undefined}
      />
      <style>{`
        @keyframes ppFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        .pp-richtext {
          max-width: 100%;
          overflow-x: auto;
        }

        /* Scoped to .pp-richtext (the Description field's raw pasted HTML)
           — these were previously bare "table"/"table th"/"table td"
           selectors with no scoping, which leaked onto every table on the
           page including the JSX-rendered Technical Data tables below,
           silently overriding their own inline background/color styling
           (table cell backgrounds paint over row backgrounds, so an
           unscoped "table th { background-color }" rule always won
           regardless of what the row's own inline background said).

           min-width: max-content lets the table grow to its natural content
           width (so nowrap headers actually stay on one line) instead of
           being force-compressed to width:100% — that compression was what
           made narrow header text wrap letter-by-letter on mobile. The
           .pp-richtext wrapper above scrolls horizontally when this
           overflows, instead of squeezing the table into the page. */
        .pp-richtext table {
          width: 100%;
          min-width: max-content;
          border-collapse: collapse;
          margin: 12px 0;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          background-color: #fff;
          border: 1px solid #d5b99a;
          border-radius: 10px;
          overflow: hidden;
        }

        /* Same brand-gradient header treatment as the JSX-rendered
           Technical Data tables, so a product whose spec table happens to
           be raw pasted HTML (still true for ~130+ products migrated from
           WordPress) looks identical to one using the structured
           Specifications Table field. */
        .pp-richtext table th {
          background: #8b5e3c;
          color: #fff;
          font-weight: 700;
          padding: 10px 14px;
          text-align: center;
          border-bottom: none;
          border-right: 1px solid rgba(255,255,255,0.25);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1.2;
        }

        .pp-richtext table th:last-child { border-right: none; }

        .pp-richtext table td {
          padding: 8px 14px;
          color: #5a4030;
          border-bottom: 1px solid #edddd0;
          border-right: 1px solid #edddd0;
          background-color: transparent;
          text-align: center;
          font-size: 0.8rem;
        }

        .pp-richtext table td:last-child { border-right: none; }

        .pp-richtext table td:first-child {
          white-space: nowrap;
          text-align: center;
          font-weight: 500;
        }

        .pp-richtext table tbody tr:nth-child(even) {
          background-color: #faf7f4;
        }

        .pp-richtext table tbody tr:hover {
          background-color: #f5ede3;
        }

        .pp-richtext table tbody tr:last-child td {
          border-bottom: none;
        }

        @media(max-width: 768px) {
          .pp-richtext table { font-size: 0.72rem; }
          .pp-richtext table th, .pp-richtext table td { padding: 7px 8px; }
        }

        @media(max-width:900px){
          .pp-s1-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .pp-s3-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
        @media(max-width:600px){
          .pp-outer { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>

      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={closeLightbox} />
      )}

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>

        {/* ── SECTION 1: Images + Info ─────────────────────────────── */}
        <div
          className="pp-outer"
          style={{ maxWidth: 1140, margin: "0 auto", padding: "10px 8px 13px", paddingTop: 160 }}
        >
          <div
            className="pp-s1-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}
          >
            {/* LEFT: Carousel + Resources (only if Diagram exists) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Carousel
                images={images}
                thumbnail={thumbnail}
                videoUrl={videoUrl}
                onImageClick={openLightbox}
                productName={product.name}
              />
              {/* Resources — below images (only show on left if Diagram exists) */}
              {hasResources && hasSpec && (
                <div>
                  <SectionLabel text={t("sections.resources")} />
                  <ResourcesPanel files={files} />
                </div>
              )}
            </div>

            {/* RIGHT: Brand, Name, Short Desc, Features, Spec Images — top aligned */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {(product.brand || product.type) && (
                <p style={{
                  fontFamily: "'Montserrat',sans-serif", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase", color: "#a67853", margin: 0,
                }}>
                  {[product.brand, product.type].filter(Boolean).join(" · ")}
                </p>
              )}

              <h1 style={{
                fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                fontSize: "clamp(1.2rem,2.2vw,1.6rem)", color: "#2c1a0e",
                margin: 0, lineHeight: 1.2,
              }}>
                {product.name}
              </h1>

              {hasShortDesc && (
                <div style={{ paddingBottom: 16, borderBottom: "1px solid #edddd0", textAlign: "left" }}>
                  <div
                    className="pp-richtext"
                    style={{
                      fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem",
                      color: "#7a5c45", lineHeight: 1.6, margin: 0,
                      whiteSpace: "pre-wrap", wordWrap: "break-word",
                    }}
                    dangerouslySetInnerHTML={{ __html: cleanHTMLStyles(product.short_description) }}
                  />
                </div>
              )}

              {hasFeatures && (
                <div>
                  <SectionLabel text={t("sections.features")} />
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {product.features.map((f, i) => (
                      <li key={i} style={{
                        fontFamily: "'Montserrat',sans-serif", color: "#5a4030",
                        fontSize: "0.78rem", lineHeight: 1.4,
                        display: "flex", alignItems: "flex-start", gap: 7,
                      }}>
                        <i className="fa-solid fa-check" style={{ color: "#a67853", fontSize: "0.68rem", marginTop: 4, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!hasShortDesc && !hasFeatures && (
                <p style={{ fontFamily: "'Montserrat',sans-serif", color: "#a67853", fontStyle: "italic", fontSize: "0.86rem", margin: 0 }}>
                  More details coming soon.
                </p>
              )}

              {/* Spec Images — compact, no bg, no zoom label, still clickable */}
              {hasSpec && (
                <div>
                  <SectionLabel text={t("sections.diagram")} />
                  <CompactSpecImages images={specImages} onImageClick={openLightbox} productName={product.name} />
                </div>
              )}

              {/* Resources — on right side if no Diagram */}
              {hasResources && !hasSpec && (
                <div>
                  <SectionLabel text={t("sections.resources")} />
                  <ResourcesPanel files={files} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Specifications (Full Description + Spec Table) ── */}
        {hasSection2 && (
          <>
            <Divider />
            <div
              className="pp-outer"
              style={{ maxWidth: 1140, margin: "0 auto", padding: "12px 8px" }}
            >
              <SectionLabel text={t("sections.specifications")} />

              {/* Full Description */}
              {hasDesc && (
                <div style={{ marginBottom: hasSpecTable ? 32 : 0 }}>
                  <div
                    className="pp-richtext"
                    style={{
                      fontFamily: "'Montserrat',sans-serif", color: "#5a4030",
                      lineHeight: 1.7, fontSize: "0.82rem",
                      maxWidth: "100%",
                      whiteSpace: "pre-wrap", wordWrap: "break-word",
                    }}
                    dangerouslySetInnerHTML={{ __html: cleanHTMLStyles(product.description) }}
                  />
                </div>
              )}

              {/* Technical Data Table */}
              {hasSpecTable && (
                <div>
                  <h4 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#8b5e3c", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Technical Data</h4>
                  {/* min-width scales with column count, same as the admin
                      Specifications Table editor — long multi-word headers
                      (e.g. "Minimum Safety Distances A|B|C|D") get room to
                      wrap onto 2 lines instead of squeezing every column
                      down to unreadable widths. */}
                  <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #d5b99a" }}>
                    <table style={{ width: "100%", minWidth: Math.max(360, specHeaders.length * 130), borderCollapse: "collapse", fontFamily: "'Montserrat',sans-serif", fontSize: "0.8rem" }}>
                      <thead>
                        <tr style={{ background: "#8b5e3c" }}>
                          {specHeaders.map((h, i) => (
                            <th key={i} style={{
                              padding: "10px 14px", textAlign: "center", color: "#fff",
                              fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase",
                              letterSpacing: "0.06em", lineHeight: 1.2,
                              borderRight: i < specHeaders.length - 1 ? "1px solid rgba(255,255,255,0.25)" : "none",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {specRows.map((row, ri) => (
                          <tr key={ri} style={{ background: ri % 2 === 1 ? "#faf7f4" : "#fff", borderTop: "1px solid #edddd0" }}>
                            {specHeaders.map((h, ci) => (
                              <td key={ci} style={{
                                padding: "8px 14px", color: "#5a4030", fontSize: "0.8rem", textAlign: "center",
                                borderRight: ci < specHeaders.length - 1 ? "1px solid #edddd0" : "none",
                              }}>{specCell(row, h, ci) || "–"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Heating Element Group Options — e.g. "2/3/6 Heating Elements"
                  variants of a steam generator, each with its own photo,
                  feature bullets, and technical-data table (product.heating_
                  element_groups). Independent of the single spec_table above,
                  which stays for products that only need one flat table. */}
              {hasHeatingGroups && (
                <div style={{ marginTop: hasDesc || hasSpecTable ? 40 : 0, display: "flex", flexDirection: "column", gap: 36 }}>
                  {heatingGroups.map((group, gi) => {
                    const gHeaders = group.spec_table?.headers || [];
                    const gRows    = group.spec_table?.rows || [];
                    const gHasTable = gHeaders.length > 0 && gRows.length > 0;
                    return (
                      <div key={gi} style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
                        {group.image && (
                          <img src={group.image} alt={group.name || `Configuration option ${gi + 1}`}
                            style={{ width: 220, maxWidth: "100%", height: "auto", flexShrink: 0, margin: "0 auto" }} />
                        )}
                        <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                          {group.name && (
                            <h4 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#8b5e3c", margin: "0 0 12px" }}>{group.name}</h4>
                          )}
                          {group.description && (
                            <p style={{ fontFamily: "'Montserrat',sans-serif", color: "#5a4030", fontSize: "0.8rem", lineHeight: 1.7, margin: "0 0 12px" }}>{group.description}</p>
                          )}
                          {(group.features || []).length > 0 && (
                            <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 0, fontFamily: "'Montserrat',sans-serif", color: "#5a4030", fontSize: "0.8rem", lineHeight: 1.7 }}>
                              {group.features.map((f, fi) => (
                                <li key={fi} style={{ display: "flex", gap: 8 }}>
                                  <span style={{ color: "#8b5e3c", flexShrink: 0 }}>»</span>
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {gHasTable && (
                          <div style={{ width: "100%", overflowX: "auto", borderRadius: 10, border: "1px solid #d5b99a" }}>
                            <table style={{ width: "100%", minWidth: Math.max(360, gHeaders.length * 130), borderCollapse: "collapse", fontFamily: "'Montserrat',sans-serif", fontSize: "0.8rem" }}>
                              <thead>
                                <tr style={{ background: "#8b5e3c" }}>
                                  {gHeaders.map((h, i) => (
                                    <th key={i} style={{
                                      padding: "10px 14px", textAlign: "center", color: "#fff",
                                      fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase",
                                      letterSpacing: "0.06em", lineHeight: 1.2,
                                      borderRight: i < gHeaders.length - 1 ? "1px solid rgba(255,255,255,0.25)" : "none",
                                    }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {gRows.map((row, ri) => (
                                  <tr key={ri} style={{ background: ri % 2 === 1 ? "#faf7f4" : "#fff", borderTop: "1px solid #edddd0" }}>
                                    {gHeaders.map((h, ci) => (
                                      <td key={ci} style={{
                                        padding: "8px 14px", color: "#5a4030", fontSize: "0.8rem", textAlign: "center",
                                        borderRight: ci < gHeaders.length - 1 ? "1px solid #edddd0" : "none",
                                      }}>{specCell(row, h, ci) || "–"}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── "Included in the Package" — product.included_items, an
              optional row of {image, title, note} accessories/parts that
              ship with the product (e.g. a steam generator's electronics
              compartment, autodrain, steam head, cables, sensor). ───── */}
        {hasIncludedItems && (
          <>
            <Divider />
            <div className="pp-outer" style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 8px" }}>
              <h3 style={{
                textAlign: "center", fontFamily: "'Montserrat',sans-serif", fontSize: "1.4rem",
                fontWeight: 400, color: "#a67853", letterSpacing: "0.04em", textTransform: "uppercase",
                margin: "0 0 36px",
              }}>{t("sections.includedInPackage")}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", gap: "32px 24px" }}>
                {includedItems.map((item, i) => {
                  const Wrapper = item.slug ? Link : "div";
                  const wrapperProps = item.slug
                    ? { to: localize(`/products/${item.slug}`), style: { textDecoration: "none", color: "inherit", cursor: "pointer" } }
                    : {};
                  return (
                    <Wrapper
                      key={i}
                      {...wrapperProps}
                      className="pp-included-item"
                      style={{
                        ...(wrapperProps.style || {}),
                        width: 160, display: "flex", flexDirection: "column",
                        alignItems: "center", textAlign: "center",
                        padding: 10, borderRadius: 12,
                        border: "2px solid transparent", transition: "all 0.2s ease",
                      }}
                      onMouseEnter={item.slug ? e => { e.currentTarget.style.border = "2px solid #a67853"; e.currentTarget.style.background = "rgba(246, 242, 237, 0.5)"; } : undefined}
                      onMouseLeave={item.slug ? e => { e.currentTarget.style.border = "2px solid transparent"; e.currentTarget.style.background = "transparent"; } : undefined}
                    >
                      <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                        {item.image && (
                          <img src={item.image} alt={item.title || ""} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        )}
                      </div>
                      {item.title && (
                        <p style={{
                          fontFamily: "'Montserrat',sans-serif", fontSize: "0.85rem", color: "#2c1a0e",
                          margin: 0, lineHeight: 1.4, minHeight: "2.8em",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{item.title}</p>
                      )}
                      {item.note && (
                        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.78rem", color: "#a67853", margin: "2px 0 0", lineHeight: 1.4 }}>{item.note}</p>
                      )}
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── SECTION 3: Related Products ───────────────────────────── */}
        <RelatedProducts currentSlug={slug} categories={product.categories} allProducts={localProds} />

      </div>
    </>
  );
}