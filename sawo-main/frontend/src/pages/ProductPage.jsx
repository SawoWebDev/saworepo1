// src/pages/ProductPage.jsx
// Changes:
// - Right column: top-aligned (not centered)
// - Removed categories/tags display from left column
// - Removed "Click to zoom" overlay on carousel images
// - Spec images moved to Section 1 right side, above Resources (compact, no bg, no zoom label, still clickable)
// - Related Products: removed short_description
// - Section 2 no longer shows spec images (they're now in Section 1)

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../Administrator/supabase";
import { ImageWithLoader } from "../components/ImageWithLoader";

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
    const h = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose, prev, next]);

  const handleWheel = e => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 1), 4));
  };

  const handleMouseDown = e => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = e => {
    if (!dragging || !dragStart.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "ppFadeIn 0.2s ease",
      }}
    >
      <button onClick={onClose} style={{
        position: "absolute", top: 18, right: 18,
        background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
        width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: "1rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s", zIndex: 10,
      }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
      >
        <i className="fa-solid fa-xmark" />
      </button>

      {images.length > 1 && (
        <div style={{
          position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.12)", color: "#fff",
          padding: "4px 14px", borderRadius: 20,
          fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 600,
        }}>
          {idx + 1} / {images.length}
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
        padding: "4px 14px", borderRadius: 20,
        fontFamily: "'Montserrat',sans-serif", fontSize: "0.65rem",
        pointerEvents: "none",
      }}>
        Scroll to zoom · Drag to pan · Esc to close
      </div>

      {images.length > 1 && (
        <>
          {[{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
            <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{
              position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
              width: 44, height: 44, cursor: "pointer", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.85rem", transition: "background 0.2s", zIndex: 10,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            >
              <i className={`fa-solid ${icon}`} />
            </button>
          ))}
        </>
      )}

      <div
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          maxWidth: "88vw", maxHeight: "88vh",
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
        }}
      >
        <ImageWithLoader
          src={images[idx]}
          alt=""
          style={{
            maxWidth: "88vw", maxHeight: "88vh",
            objectFit: "contain", borderRadius: 10,
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: dragging ? "none" : "transform 0.15s ease",
            display: "block",
          }}
        />
      </div>

      {images.length > 1 && (
        <div style={{
          position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 6,
        }} onClick={e => e.stopPropagation()}>
          {images.map((url, i) => (
            <button key={i} onClick={() => { setIdx(i); setScale(1); setOffset({ x: 0, y: 0 }); }}
              style={{
                width: 44, height: 44, borderRadius: 6, overflow: "hidden",
                border: `2px solid ${i === idx ? "#a67853" : "rgba(255,255,255,0.25)"}`,
                background: "rgba(0,0,0,0.4)", cursor: "pointer", padding: 0,
                transition: "border-color 0.18s", flexShrink: 0,
              }}>
              <ImageWithLoader
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Image Carousel ───────────────────────────────────────────────── */
function Carousel({ images, thumbnail, onImageClick }) {
  const all = [
    ...(thumbnail ? [thumbnail] : []),
    ...(images || []).filter(u => u !== thumbnail),
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState({});

  if (!all.length) {
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

  const prev = () => setIdx(i => (i - 1 + all.length) % all.length);
  const next = () => setIdx(i => (i + 1) % all.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{
        position: "relative", borderRadius: 0, overflow: "visible",
        background: "transparent", border: "none",
        aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "zoom-in",
      }}
        onClick={() => onImageClick(all, idx)}
      >
        {!err[idx] && (
          <ImageWithLoader
            key={idx}
            src={all[idx]}
            alt=""
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

        {/* REMOVED: "Click to zoom" overlay */}

        {all.length > 1 && (
          <>
            {[{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
              <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{
                position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none",
                borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "none", transition: "all 0.2s", color: "#a67853",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#8b5e3c"; e.currentTarget.style.transform = "translateY(-50%) scale(1.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#a67853"; e.currentTarget.style.transform = "translateY(-50%)"; }}
              >
                <i className={`fa-solid ${icon}`} style={{ fontSize: "1.2rem", fontWeight: "bold" }} />
              </button>
            ))}
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
              {all.map((_, i) => (
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
              {idx + 1} / {all.length}
            </span>
          </>
        )}
      </div>

      {all.length > 1 && (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {all.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{
                flexShrink: 0, width: 58, height: 58, borderRadius: 8, overflow: "hidden",
                border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`,
                background: "#faf7f4", cursor: "pointer", padding: 0, transition: "border-color 0.18s",
              }}>
              {!err[i] && (
                <ImageWithLoader
                  src={url}
                  alt=""
                  onError={() => setErr(e => ({ ...e, [i]: true }))}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }}
                />
              )}
              {err[i] && (
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
function CompactSpecImages({ images, onImageClick }) {
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
          alt=""
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
                alt=""
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

  if (!files?.length) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", minHeight: 180, color: "#c4a882",
      fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", textAlign: "center", gap: 10,
    }}>
      <i className="fa-regular fa-folder-open" style={{ fontSize: "2rem", color: "#ddc9b4" }} />
      No resources available
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

/* ── Related Products ─────────────────────────────────────────────── */
function RelatedProducts({ currentSlug, categories }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!categories?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("id,name,slug,thumbnail,categories")
          .eq("status", "published")
          .eq("visible", true)
          .neq("slug", currentSlug)
          .contains("categories", categories.slice(0, 1))
          .limit(4);
        if (!cancelled && data) setRelated(data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [currentSlug, categories]);

  if (!related.length) return null;

  return (
    <>
      <Divider />
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "52px 32px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{
            fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
            fontSize: "0.67rem", letterSpacing: "0.14em", textTransform: "uppercase",
            color: "#a67853", margin: "0 0 6px",
          }}>
            You might also like
          </p>
          <h2 style={{
            fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
            fontSize: "1.5rem", color: "#2c1a0e", margin: 0, lineHeight: 1.2,
          }}>
            Related Products
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 24,
        }}>
          {related.map(p => (
            <Link
              key={p.id || p.slug}
              to={`/products/${p.slug}`}
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
                  {p.thumbnail ? (
                    <ImageWithLoader
                      src={p.thumbnail}
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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const openLightbox = (images, index) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);

    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .eq("visible", true)
          .single();

        if (err || !data) {
          if (!cancelled) setError("Product not found.");
        } else {
          if (!cancelled) setProduct(data);
        }
      } catch {
        if (!cancelled) setError("Connection error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

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
      <h2 style={{ color: "#2c1a0e", margin: "0 0 8px" }}>Product Not Found</h2>
      <p style={{ color: "#a67853", margin: "0 0 24px", fontStyle: "italic", fontSize: "0.88rem" }}>
        {error || "This product doesn't exist or isn't published yet."}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/products" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", background: "linear-gradient(135deg,#8b5e3c,#a67853)", color: "#fff", textDecoration: "none", fontWeight: 700, borderRadius: 7, fontSize: "0.82rem" }}>
          Browse Products
        </Link>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", border: "1.5px solid #a67853", color: "#a67853", textDecoration: "none", fontWeight: 700, borderRadius: 7, fontSize: "0.82rem" }}>
          Home
        </Link>
      </div>
    </div>
  );

  const files        = product.files || [];
  const hasShortDesc = !!product.short_description;
  const hasDesc      = !!product.description;
  const hasFeatures  = (product.features || []).length > 0;
  const hasSpec      = (product.spec_images || []).length > 0;
  const hasSpecTable = product.spec_table?.headers?.length > 0;
  const hasResources = files.length > 0;
  const hasSection2  = hasDesc || hasSpecTable;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
        @keyframes ppFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          background-color: #fff;
          border: 1px solid #d5b99a;
        }

        table th {
          background-color: #f0e8df;
          color: #5a4030;
          font-weight: 600;
          padding: 8px 10px;
          text-align: center;
          border-bottom: 1px solid #ddc9b4;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.2;
          white-space: normal;
          word-break: break-word;
        }

        table td {
          padding: 8px 10px;
          color: #5a4030;
          border-bottom: 1px solid #edddd0;
          background-color: transparent;
          text-align: center;
          font-size: 0.77rem;
        }

        table td:first-child {
          white-space: nowrap;
          text-align: center;
          font-weight: 500;
        }

        table tbody tr:nth-child(odd) {
          background-color: #fdfaf7;
        }

        table tbody tr:hover {
          background-color: #f5ede3;
        }

        table tbody tr:last-child td {
          border-bottom: none;
        }

        @media(max-width: 768px) {
          table { font-size: 0.72rem; }
          table th, table td { padding: 7px 8px; }
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
                images={product.images}
                thumbnail={product.thumbnail}
                onImageClick={openLightbox}
              />
              {/* Resources — below images (only show on left if Diagram exists) */}
              {hasResources && hasSpec && (
                <div>
                  <SectionLabel text="Resources" />
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
                  <SectionLabel text="Features" />
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
                  <SectionLabel text="Diagram" />
                  <CompactSpecImages images={product.spec_images} onImageClick={openLightbox} />
                </div>
              )}

              {/* Resources — on right side if no Diagram */}
              {hasResources && !hasSpec && (
                <div>
                  <SectionLabel text="Resources" />
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
              <SectionLabel text="Specifications" />

              {/* Full Description */}
              {hasDesc && (
                <div style={{ marginBottom: hasSpecTable ? 32 : 0 }}>
                  <div
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
                  <div style={{ overflowX: "auto", borderRadius: 10, border: "2px solid #d5b99a", background: "#fafaf8" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Montserrat',sans-serif", fontSize: "0.8rem" }}>
                      <thead>
                        <tr style={{ background: "#faf7f4" }}>
                          {product.spec_table.headers.map((h, i) => (
                            <th key={i} style={{
                              padding: "9px 14px", textAlign: "left", color: "#8b5e3c",
                              fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase",
                              letterSpacing: "0.07em", borderBottom: "1px solid #edddd0", whiteSpace: "nowrap",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(product.spec_table.rows || []).map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: ri < product.spec_table.rows.length - 1 ? "1px solid #f5ede3" : "none" }}>
                            {product.spec_table.headers.map((h, ci) => (
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

        {/* ── SECTION 3: Related Products ───────────────────────────── */}
        <RelatedProducts currentSlug={slug} categories={product.categories} />

      </div>
    </>
  );
}