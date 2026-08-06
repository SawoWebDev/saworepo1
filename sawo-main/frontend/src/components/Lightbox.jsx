import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ImageWithLoader } from "./ImageWithLoader";

const navBtnStyle = side => ({
  position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
  width: 44, height: 44, cursor: "pointer", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.9rem", transition: "background 0.2s", zIndex: 10,
});

export function Lightbox({ images, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    // This site keeps <html> (not <body>) as the actual scrolling element —
    // see the overflow-x:clip comment in index.css — so body.style.overflow
    // does nothing here; the root element has to be locked instead.
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); root.style.overflow = prevOverflow; };
  }, [onClose, prev, next]);

  if (!images?.length) return null;

  // Portalled straight to <body>: MainLayout's <main> (position:relative +
  // z-0) establishes its own stacking context, which traps any z-index —
  // even 9999 — inside it below the fixed z-50 Header. Escaping via a
  // portal is the only way for the lightbox to actually paint on top.
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "ppFadeIn 0.2s ease",
      }}
    >
      <button onClick={onClose} aria-label="Close" style={{
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
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous image" style={navBtnStyle("left")}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button onClick={e => { e.stopPropagation(); next(); }} aria-label="Next image" style={navBtnStyle("right")}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
          <div style={{
            position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.12)", color: "#fff",
            padding: "4px 14px", borderRadius: 20,
            fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 600,
          }}>
            {idx + 1} / {images.length}
          </div>
        </>
      )}

      <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
        <ImageWithLoader
          src={images[idx]}
          alt=""
          style={{
            maxWidth: "90vw", maxHeight: "90vh",
            objectFit: "contain", borderRadius: 10,
            display: "block",
          }}
        />
      </div>
    </div>,
    document.body
  );
}
