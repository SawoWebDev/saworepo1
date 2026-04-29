// src/pages/SaunaRoomDisplay.jsx

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { ImageWithLoader } from "../components/ImageWithLoader";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

const ROOM_TYPE_LABELS = {
  traditional: "Traditional",
  infrared:    "Infrared",
  steam:       "Steam",
  combo:       "Combo",
  glassfront:  "Glass Front",
};
const SIZE_LABELS = {
  compact:    "Compact · 1–2 Person",
  small:      "Small · 2–3 Person",
  medium:     "Medium · 3–4 Person",
  large:      "Large · 4–6 Person",
  xl:         "XL · 6+ Person",
  commercial: "Commercial",
};

function resolveUrl(p) {
  if (!p) return null;
  if (String(p).includes("://")) return p;
  return `${GITHUB_RAW}${p}`;
}
function parseJsonField(val, fallback) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

/* ── Lightbox ─────────────────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const prev = useCallback(() => { setIdx(i => (i - 1 + images.length) % images.length); setScale(1); setOffset({ x: 0, y: 0 }); }, [images.length]);
  const next = useCallback(() => { setIdx(i => (i + 1) % images.length); setScale(1); setOffset({ x: 0, y: 0 }); }, [images.length]);
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose, prev, next]);
  const handleWheel = e => { e.preventDefault(); setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 1), 4)); };
  const handleMouseDown = e => { if (scale <= 1) return; setDragging(true); dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; };
  const handleMouseMove = e => { if (!dragging || !dragStart.current) return; setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const handleMouseUp = () => setDragging(false);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", animation: "ppFadeIn 0.2s ease" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", zIndex: 10 }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>
        <i className="fa-solid fa-xmark" />
      </button>
      {images.length > 1 && <div style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.12)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 600 }}>{idx + 1} / {images.length}</div>}
      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "4px 14px", borderRadius: 20, fontFamily: "'Montserrat',sans-serif", fontSize: "0.65rem", pointerEvents: "none" }}>Scroll to zoom · Drag to pan · Esc to close</div>
      {images.length > 1 && [{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
        <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{ position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", transition: "background 0.2s", zIndex: 10 }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>
          <i className={`fa-solid ${icon}`} />
        </button>
      ))}
      <div onClick={e => e.stopPropagation()} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ maxWidth: "88vw", maxHeight: "88vh", cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default", userSelect: "none" }}>
        <ImageWithLoader src={images[idx]} alt="" style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10, transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`, transition: dragging ? "none" : "transform 0.15s ease", display: "block" }} />
      </div>
      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          {images.map((url, i) => (
            <button key={i} onClick={() => { setIdx(i); setScale(1); setOffset({ x: 0, y: 0 }); }} style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "rgba(255,255,255,0.25)"}`, background: "rgba(0,0,0,0.4)", cursor: "pointer", padding: 0, transition: "border-color 0.18s", flexShrink: 0 }}>
              <ImageWithLoader src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Carousel ─────────────────────────────────────────────────────── */
function Carousel({ images, onImageClick }) {
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState({});
  useEffect(() => { setIdx(0); setErr({}); }, [images]);

  if (!images?.length) return (
    <div style={{ width: "100%", aspectRatio: "1/1", background: "#faf7f4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #edddd0" }}>
      <i className="fa-regular fa-image" style={{ fontSize: "3.5rem", color: "#d5b99a" }} />
    </div>
  );
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative", borderRadius: 0, overflow: "visible", background: "transparent", border: "none", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-in" }} onClick={() => onImageClick(images, idx)}>
        {!err[idx] ? (
          <ImageWithLoader key={`${images[idx]}-${idx}`} src={images[idx]} alt="" onError={() => setErr(e => ({ ...e, [idx]: true }))} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", width: "100%", height: "100%", animation: "ppFadeIn 0.25s ease" }} />
        ) : (
          <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
        )}
        {images.length > 1 && (
          <>
            {[{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
              <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{ position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#a67853", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#8b5e3c"; e.currentTarget.style.transform = "translateY(-50%) scale(1.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#a67853"; e.currentTarget.style.transform = "translateY(-50%)"; }}>
                <i className={`fa-solid ${icon}`} style={{ fontSize: "1.2rem" }} />
              </button>
            ))}
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, padding: 0, border: "none", cursor: "pointer", transition: "all 0.22s", background: i === idx ? "#a67853" : "rgba(139,94,60,0.25)" }} />
              ))}
            </div>
            <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(44,26,14,0.55)", color: "#fff", fontSize: "0.65rem", fontFamily: "'Montserrat',sans-serif", fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{idx + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {images.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ flexShrink: 0, width: 58, height: 58, borderRadius: 8, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`, background: "#faf7f4", cursor: "pointer", padding: 0, transition: "border-color 0.18s" }}>
              {!err[i] ? (
                <ImageWithLoader src={url} alt="" onError={() => setErr(e => ({ ...e, [i]: true }))} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
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

/* ── Section Label ────────────────────────────────────────────────── */
function SectionLabel({ icon, text }) {
  return (
    <h3 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b5e3c", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
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

/* ── Stat Chip ────────────────────────────────────────────────────── */
function StatChip({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", background: "#faf7f4", borderRadius: 10, border: "1px solid #edddd0", flex: "1 1 0", minWidth: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#a67853" }}>
        <i className={icon} style={{ fontSize: "0.78rem" }} />
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.86rem", fontWeight: 700, color: "#2c1a0e", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

/* ── PDF Resources Panel ──────────────────────────────────────────── */
function ResourcesPanel({ files }) {
  const [expanded, setExpanded] = useState(false);
  if (!files?.length) return null;
  if (files.length === 1) return (
    <a href={files[0].url} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#faf7f4", borderRadius: 10, border: "1px solid #edddd0", color: "#2c1a0e", textDecoration: "none", fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; e.currentTarget.style.borderColor = "#d4b896"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#faf7f4"; e.currentTarget.style.borderColor = "#edddd0"; }}>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: "linear-gradient(135deg,#8b5e3c,#a67853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "1rem" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{files[0].name}</div>
        <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>PDF · Click to open</div>
      </div>
      <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.7rem", flexShrink: 0 }} />
    </a>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#faf7f4", borderRadius: expanded ? "10px 10px 0 0" : 10, border: "1px solid #edddd0", color: "#2c1a0e", cursor: "pointer", fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", fontWeight: 700, transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; }} onMouseLeave={e => { e.currentTarget.style.background = "#faf7f4"; }}>
        <div style={{ width: 40, height: 40, borderRadius: 9, background: "linear-gradient(135deg,#8b5e3c,#a67853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "0.9rem" }} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e" }}>{files.length} Documents</div>
          <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>Click to {expanded ? "collapse" : "expand"}</div>
        </div>
        <i className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`} style={{ color: "#a67853", fontSize: "0.7rem", flexShrink: 0 }} />
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 0", borderTop: "1px solid #edddd0" }}>
          {files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fdf8f5", borderRadius: 8, color: "#2c1a0e", textDecoration: "none", fontFamily: "'Montserrat',sans-serif", fontSize: "0.80rem", transition: "all 0.2s", marginLeft: 8 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fdf8f5"; }}>
              <i className="fa-solid fa-file-pdf" style={{ color: "#a67853", fontSize: "0.85rem", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.65rem", flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
function SkeletonPage() {
  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px 60px" }}>
      <style>{`@keyframes skS{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div style={{ aspectRatio: "1/1", borderRadius: 14, background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)", backgroundSize: "200% 100%", animation: "skS 1.4s infinite" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[35, 55, 80, 70, 60, 90, 55].map((w, i) => (
            <div key={i} style={{ height: i === 0 ? 26 : 12, width: `${w}%`, borderRadius: 6, background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)", backgroundSize: "200% 100%", animation: "skS 1.4s infinite" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Related Rooms by Type ────────────────────────────────────────── */
function RelatedRooms({ currentSlug, roomType, allRooms }) {
  const related = useMemo(() => {
    if (!roomType || !allRooms.length) return [];
    return allRooms
      .filter(r => r.status === "published" && r.visible !== false && r.slug !== currentSlug && r.room_type === roomType)
      .slice(0, 4);
  }, [currentSlug, roomType, allRooms]);

  if (!related.length) return null;

  const typeLabel = ROOM_TYPE_LABELS[roomType] || roomType;

  return (
    <>
      <Divider />
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "52px 32px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "0.67rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#a67853", margin: "0 0 6px" }}>
            More {typeLabel} Rooms
          </p>
          <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#2c1a0e", margin: 0, lineHeight: 1.2 }}>
            Related Sauna Rooms
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 24 }}>
          {related.map(r => {
            const configs = parseJsonField(r.configurations, {});
            const firstConfig = Object.values(configs)[0];
            const thumb = r.thumbnail || firstConfig?.images?.[0] || null;
            return (
              <Link key={r.id || r.slug} to={`/sauna/rooms/${r.slug}`} style={{ textDecoration: "none" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 12, border: "2px solid transparent", transition: "all 0.25s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.border = "2px solid #a67853"; e.currentTarget.style.background = "rgba(246,242,237,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.border = "2px solid transparent"; e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, borderRadius: 8 }}>
                    {thumb ? (
                      <ImageWithLoader src={resolveUrl(thumb)} alt={r.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <i className="fa-regular fa-image" style={{ color: "#d5b99a", fontSize: "2rem" }} />
                    )}
                  </div>
                  {r.model_code && (
                    <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a67853", margin: 0, textAlign: "center" }}>{r.model_code}</p>
                  )}
                  <p style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e", margin: 0, lineHeight: 1.4, textAlign: "center" }}>{r.name}</p>
                  {r.capacity_label && (
                    <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.7rem", color: "#a67853", margin: 0, textAlign: "center" }}>
                      <i className="fa-solid fa-user" style={{ marginRight: 4 }} />{r.capacity_label}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function SaunaRoomDisplay() {
  const { slug } = useParams();
  const [lightbox, setLightbox] = useState(null);
  const [activeConfig, setActiveConfig] = useState(null);
  const { rooms: allRooms, loading } = useLocalSaunaRooms();

  const room = useMemo(() => {
    if (!allRooms.length) return null;
    return allRooms.find(r => r.slug === slug && r.status === "published" && r.visible !== false) || null;
  }, [allRooms, slug]);

  const error = !loading && !room;

  // Parse JSONB fields
  const configurations = useMemo(() => parseJsonField(room?.configurations, {}), [room]);
  const doorOptions    = useMemo(() => parseJsonField(room?.door_options, []), [room]);
  const featureTabs    = useMemo(() => parseJsonField(room?.feature_tabs, []), [room]);
  const files          = useMemo(() => {
    const raw = parseJsonField(room?.files, []);
    return raw.map(f => ({ name: f.name, url: f.url || resolveUrl(f.path) }));
  }, [room]);

  const configKeys   = useMemo(() => room?.side_order?.filter(k => configurations[k]) || Object.keys(configurations), [room, configurations]);
  const hasMultiConf = configKeys.length > 1;

  useEffect(() => {
    if (configKeys.length) setActiveConfig(configKeys[0]);
  }, [configKeys]);

  const currentConf = configurations[activeConfig] || Object.values(configurations)[0] || null;

  // Collect images: config images + thumbnail, deduplicated
  const carouselImages = useMemo(() => {
    const seen = new Set();
    const add = url => { const r = resolveUrl(url); if (r && !seen.has(r)) { seen.add(r); return r; } return null; };
    const imgs = [];
    if (currentConf?.images?.length) currentConf.images.forEach(u => { const r = add(u); if (r) imgs.push(r); });
    if (room?.thumbnail) { const r = add(room.thumbnail); if (r) imgs.push(r); }
    if (room?.images?.length) room.images.forEach(u => { const r = add(u); if (r) imgs.push(r); });
    return imgs;
  }, [currentConf, room]);

  const specImages = useMemo(() => {
    const seen = new Set();
    const imgs = [];
    if (currentConf?.panel_image) { const r = resolveUrl(currentConf.panel_image); if (r && !seen.has(r)) { seen.add(r); imgs.push(r); } }
    if (room?.spec_images?.length) room.spec_images.forEach(u => { const r = resolveUrl(u); if (r && !seen.has(r)) { seen.add(r); imgs.push(r); } });
    return imgs;
  }, [currentConf, room]);

  // Wood options
  const woodOptions = useMemo(() => {
    const opts = room?.wood_options || [];
    const enabled = room?.wood_options_enabled || [];
    return opts.map((w, i) => ({ name: w, enabled: enabled[i] === true || enabled[i] === "true" }));
  }, [room]);
  const enabledWoods = woodOptions.filter(w => w.enabled);

  // IR data
  const hasIR = room && [room.ir_panel_wattage_w, room.ir_total_power_w, room.ir_voltage_v, room.ir_session_time_min].some(v => v !== null && v !== undefined);

  // Ordered door options using side_order
  const orderedDoorOptions = useMemo(() => {
    if (!doorOptions.length) return [];
    if (!room?.side_order?.length) return doorOptions;
    const map = Object.fromEntries(doorOptions.map(d => [d.value, d]));
    return room.side_order.map(k => map[k]).filter(Boolean);
  }, [doorOptions, room]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (loading) return <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 80 }}><SkeletonPage /></div>;

  if (error || !room) return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", fontFamily: "'Montserrat',sans-serif", textAlign: "center", padding: "100px 24px 60px" }}>
      <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#8b5e3c,#a67853)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 28px rgba(139,94,60,0.28)" }}>
        <i className="fa-solid fa-magnifying-glass" style={{ color: "#fff", fontSize: "1.6rem" }} />
      </div>
      <h2 style={{ color: "#2c1a0e", margin: "0 0 8px" }}>Sauna Room Not Found</h2>
      <p style={{ color: "#a67853", margin: "0 0 24px", fontStyle: "italic", fontSize: "0.88rem" }}>This sauna room doesn't exist or isn't published yet.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/sauna/rooms" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", background: "linear-gradient(135deg,#8b5e3c,#a67853)", color: "#fff", textDecoration: "none", fontWeight: 700, borderRadius: 7, fontSize: "0.82rem" }}>Browse Rooms</Link>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", border: "1.5px solid #a67853", color: "#a67853", textDecoration: "none", fontWeight: 700, borderRadius: 7, fontSize: "0.82rem" }}>Home</Link>
      </div>
    </div>
  );

  const hasDesc      = !!room.description;
  const hasFeatures  = (room.features || []).length > 0;
  const hasSpecTable = room.spec_table?.headers?.length > 0;
  const hasSection2  = hasDesc || hasFeatures || hasSpecTable || featureTabs.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
        @keyframes ppFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:900px){ .pp-s1-grid { grid-template-columns: 1fr !important; gap: 28px !important; } }
        @media(max-width:600px){ .pp-outer { padding-left: 16px !important; padding-right: 16px !important; } }
      `}</style>

      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>

        {/* ── SECTION 1: Carousel + Info ── */}
        <div className="pp-outer" style={{ maxWidth: 1140, margin: "0 auto", padding: "10px 32px 32px", paddingTop: 160 }}>
          <div className="pp-s1-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

            {/* LEFT: Carousel + Resources */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Carousel images={carouselImages} onImageClick={(imgs, i) => setLightbox({ images: imgs, index: i })} />

              {/* Resources */}
              {files.length > 0 && (
                <div>
                  <SectionLabel icon="fa-solid fa-file-pdf" text="Resources" />
                  <ResourcesPanel files={files} />
                </div>
              )}
            </div>

            {/* RIGHT: Badges, Model, Name, Stats, Door Options, Wood Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {room.room_type && (
                  <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a67853", background: "rgba(166,120,83,0.1)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(166,120,83,0.25)" }}>
                    {ROOM_TYPE_LABELS[room.room_type] || room.room_type}
                  </span>
                )}
                {room.size_category && (
                  <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b5e3c", background: "rgba(139,94,60,0.08)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(139,94,60,0.2)" }}>
                    {SIZE_LABELS[room.size_category] || room.size_category}
                  </span>
                )}
                {room.featured && (
                  <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b45309", background: "rgba(180,83,9,0.08)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(180,83,9,0.2)" }}>
                    <i className="fa-solid fa-star" style={{ marginRight: 4 }} />Featured
                  </span>
                )}
                {room.is_best_seller && (
                  <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b45309", background: "rgba(245,158,11,0.1)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(245,158,11,0.25)" }}>
                    <i className="fa-solid fa-fire" style={{ marginRight: 4 }} />Best Seller
                  </span>
                )}
              </div>

              {/* Model + Name */}
              {room.model_code && (
                <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c4a882", margin: 0 }}>
                  Model {room.model_code}{room.sku ? ` · SKU ${room.sku}` : ""}
                </p>
              )}
              <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "clamp(1.2rem,2.2vw,1.65rem)", color: "#2c1a0e", margin: 0, lineHeight: 1.2 }}>
                {room.name}
              </h1>

              {/* Stat chips */}
              {(room.capacity_label || room.width_m || room.height_m) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <StatChip icon="fa-solid fa-user-group"      label="Capacity"   value={room.capacity_label} />
                  {(room.width_m && room.depth_m) && (
                    <StatChip icon="fa-solid fa-ruler-combined" label="Floor Size" value={`${room.width_m} × ${room.depth_m} m`} />
                  )}
                  {room.height_m && (
                    <StatChip icon="fa-solid fa-arrows-up-down" label="Height"    value={`${room.height_m} m`} />
                  )}
                </div>
              )}

              {/* Door options — below stat chips */}
              {room.has_door_filter && orderedDoorOptions.length > 0 && (
                <div>
                  <SectionLabel icon="fa-solid fa-door-open" text="Available Door Positions" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {orderedDoorOptions.map(opt => (
                      <span key={opt.value}
                        style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.7rem", fontWeight: 600, padding: "5px 11px", borderRadius: 6, background: "#faf7f4", border: "1px solid #edddd0", color: "#5a4030", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.65rem", fontWeight: 700, color: "#a67853" }}>{opt.value}</span>
                        {opt.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Wood options — below door options */}
              {woodOptions.length > 0 && (
                <div>
                  <SectionLabel icon="fa-solid fa-tree" text="Wood Options" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {woodOptions.map(w => (
                      <span key={w.name}
                        style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 600, padding: "6px 12px", borderRadius: 7, transition: "all 0.15s", border: `1.5px solid ${w.enabled ? "#a67853" : "#e0d4c8"}`, background: w.enabled ? "rgba(166,120,83,0.1)" : "#f7f3ef", color: w.enabled ? "#8b5e3c" : "#b8a898", display: "flex", alignItems: "center", gap: 6 }}>
                        {w.enabled ? (
                          <i className="fa-solid fa-check" style={{ fontSize: "0.6rem", color: "#a67853" }} />
                        ) : (
                          <i className="fa-solid fa-circle-xmark" style={{ fontSize: "0.6rem", color: "#c9b8aa" }} />
                        )}
                        {w.name}
                        {!w.enabled && <span style={{ fontSize: "0.6rem", fontWeight: 400, opacity: 0.7 }}>(unavailable)</span>}
                      </span>
                    ))}
                  </div>
                  {enabledWoods.length === 0 && (
                    <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", color: "#c4a882", fontStyle: "italic", margin: "6px 0 0" }}>No wood options currently available.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── SECTION 1.5: Floor Plan + Bench & IR ── */}
        {(specImages.length > 0 || hasMultiConf || (!hasMultiConf && currentConf?.bench_name) || hasIR) && (
          <>
            <Divider />
            <div className="pp-outer" style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 32px" }}>
              <div className="pp-s1-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

                {/* LEFT: Floor Plan */}
                <div>
                  {specImages.length > 0 && (
                    <>
                      <SectionLabel icon="fa-solid fa-vector-square" text="Floor Plan" />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
                        {specImages.map((url, i) => (
                          <div key={i} onClick={() => setLightbox({ images: specImages, index: i })} style={{ cursor: "zoom-in" }}>
                            <ImageWithLoader src={url} alt="Floor plan" style={{ width: "100%", objectFit: "contain", display: "block" }} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* RIGHT: Bench Configuration + IR Specs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {hasMultiConf && (
                    <div>
                      <SectionLabel icon="fa-solid fa-diagram-project" text="Bench Configuration" />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {configKeys.map(key => (
                          <button key={key} onClick={() => setActiveConfig(key)}
                            style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 700, padding: "7px 14px", borderRadius: 7, cursor: "pointer", transition: "all 0.18s", border: `1.5px solid ${activeConfig === key ? "#a67853" : "#edddd0"}`, background: activeConfig === key ? "rgba(166,120,83,0.12)" : "#faf7f4", color: activeConfig === key ? "#8b5e3c" : "#7a5c45" }}>
                            {configurations[key]?.bench_name || key}
                          </button>
                        ))}
                      </div>
                      {currentConf?.bench_name && (
                        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", color: "#a67853", margin: "8px 0 0", fontStyle: "italic" }}>
                          {currentConf.bench_name}
                        </p>
                      )}
                    </div>
                  )}
                  {!hasMultiConf && currentConf?.bench_name && (
                    <div>
                      <SectionLabel icon="fa-solid fa-diagram-project" text="Bench Configuration" />
                      <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", color: "#5a4030", margin: 0 }}>{currentConf.bench_name}</p>
                    </div>
                  )}
                  {hasIR && (
                    <div>
                      <SectionLabel icon="fa-solid fa-bolt" text="Infrared Specifications" />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <StatChip icon="fa-solid fa-plug"        label="Voltage"       value={room.ir_voltage_v        ? `${room.ir_voltage_v} V`        : null} />
                        <StatChip icon="fa-solid fa-solar-panel" label="Panel Wattage" value={room.ir_panel_wattage_w  ? `${room.ir_panel_wattage_w} W`  : null} />
                        <StatChip icon="fa-solid fa-bolt"        label="Total Power"   value={room.ir_total_power_w    ? `${room.ir_total_power_w} W`    : null} />
                        <StatChip icon="fa-solid fa-clock"       label="Session Time"  value={room.ir_session_time_min ? `${room.ir_session_time_min} min`: null} />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

        {/* ── SECTION 2: Details ── */}
        {hasSection2 && (
          <>
            <Divider />
            <div className="pp-outer" style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 32px" }}>

              {/* Features */}
              {hasFeatures && (
                <div style={{ marginBottom: 32 }}>
                  <SectionLabel icon="fa-solid fa-list-check" text="Features" />
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "6px 24px" }}>
                    {room.features.map((f, i) => (
                      <li key={i} style={{ fontFamily: "'Montserrat',sans-serif", color: "#5a4030", fontSize: "0.78rem", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <i className="fa-solid fa-check" style={{ color: "#a67853", fontSize: "0.68rem", marginTop: 4, flexShrink: 0 }} />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feature tabs */}
              {featureTabs.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <SectionLabel icon="fa-solid fa-layer-group" text="Details" />
                  <FeatureTabs tabs={featureTabs} />
                </div>
              )}

              {/* Description */}
              {hasDesc && (
                <div style={{ marginBottom: hasSpecTable ? 32 : 0 }}>
                  <SectionLabel icon="fa-solid fa-align-left" text="Description" />
                  <div style={{ fontFamily: "'Montserrat',sans-serif", color: "#5a4030", lineHeight: 1.7, fontSize: "0.82rem", whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: room.description }} />
                </div>
              )}

              {/* Spec table */}
              {hasSpecTable && (
                <div>
                  <SectionLabel icon="fa-solid fa-table" text="Technical Data" />
                  <div style={{ overflowX: "auto", borderRadius: 10, border: "2px solid #d5b99a", background: "#fafaf8" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Montserrat',sans-serif", fontSize: "0.8rem" }}>
                      <thead>
                        <tr style={{ background: "#faf7f4" }}>
                          {room.spec_table.headers.map((h, i) => (
                            <th key={i} style={{ padding: "9px 14px", textAlign: "left", color: "#8b5e3c", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #edddd0", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(room.spec_table.rows || []).map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: ri < room.spec_table.rows.length - 1 ? "1px solid #f5ede3" : "none" }}>
                            {room.spec_table.headers.map((h, ci) => (
                              <td key={ci} style={{ padding: "8px 14px", color: "#5a4030", fontSize: "0.8rem" }}>{row[h] || "–"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SECTION 3: Related by type ── */}
        <RelatedRooms currentSlug={slug} roomType={room.room_type} allRooms={allRooms} />

      </div>
    </>
  );
}

/* ── Feature Tabs ─────────────────────────────────────────────────── */
function FeatureTabs({ tabs }) {
  const [active, setActive] = useState(0);
  if (!tabs?.length) return null;
  const tab = tabs[active];
  return (
    <div>
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #edddd0", marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 700, padding: "9px 16px", border: "none", borderBottom: `2px solid ${active === i ? "#a67853" : "transparent"}`, marginBottom: -2, background: "transparent", color: active === i ? "#a67853" : "#a09080", cursor: "pointer", transition: "all 0.18s", letterSpacing: "0.05em" }}>
            {t.title || `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      {tab?.content && (
        <div style={{ fontFamily: "'Montserrat',sans-serif", color: "#5a4030", lineHeight: 1.7, fontSize: "0.82rem", whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{ __html: tab.content }} />
      )}
      {tab?.items?.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
          {tab.items.map((item, i) => (
            <li key={i} style={{ fontFamily: "'Montserrat',sans-serif", color: "#5a4030", fontSize: "0.78rem", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 7 }}>
              <i className="fa-solid fa-check" style={{ color: "#a67853", fontSize: "0.68rem", marginTop: 4, flexShrink: 0 }} />{item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
