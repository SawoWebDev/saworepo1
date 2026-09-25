import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ImageWithLoader } from "./ImageWithLoader";
import sLogo from "../assets/SAWO-logo.webp";

const navBtnStyle = side => ({
  position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
  width: 44, height: 44, cursor: "pointer", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.9rem", transition: "background 0.2s", zIndex: 10,
});

export function Lightbox({ images, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const moved = useRef(false);

  const goTo = useCallback(i => { setIdx(i); setScale(1); setOffset({ x: 0, y: 0 }); }, []);
  const prev = useCallback(() => { setIdx(i => (i - 1 + images.length) % images.length); setScale(1); setOffset({ x: 0, y: 0 }); }, [images.length]);
  const next = useCallback(() => { setIdx(i => (i + 1) % images.length); setScale(1); setOffset({ x: 0, y: 0 }); }, [images.length]);

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

  const handleWheel = e => { setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 1), 4)); };

  // Press-and-hold to drag (pointer capture keeps the drag alive even if the
  // cursor leaves the image, and release always ends it — no "sticky" image).
  // `moved` lets the backdrop ignore the click that fires after a drag ends.
  const handlePointerDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    moved.current = false;
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y, sx: e.clientX, sy: e.clientY };
  };
  const handlePointerMove = e => {
    if (!dragging || !dragStart.current) return;
    if (Math.abs(e.clientX - dragStart.current.sx) + Math.abs(e.clientY - dragStart.current.sy) > 3) moved.current = true;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handlePointerUp = e => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
    dragStart.current = null;
  };
  const closeFromBackdrop = e => {
    e.stopPropagation();
    if (moved.current) { moved.current = false; return; }
    onClose();
  };

  // Portalled straight to <body>: MainLayout's <main> (position:relative +
  // z-0) establishes its own stacking context, which traps any z-index —
  // even 9999 — inside it below the fixed z-50 Header. Escaping via a
  // portal is the only way for the lightbox to actually paint on top.
  // Every control below carries zIndex 10 so a zoomed/dragged image (z 1)
  // can never paint over the counter, thumbnails, logo or buttons.
  return createPortal(
    <div
      onClick={closeFromBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "ppFadeIn 0.2s ease",
      }}
    >
      <img src={sLogo} alt="SAWO" draggable={false} style={{ position: "absolute", top: 16, left: 18, zIndex: 10, height: 64, width: "auto", pointerEvents: "none" }} />

      <button onClick={e => { e.stopPropagation(); onClose(); }} aria-label="Close" style={{
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
          <div style={{
            position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none",
            background: "rgba(255,255,255,0.12)", color: "#fff",
            padding: "4px 14px", borderRadius: 20,
            fontFamily: "'Montserrat',sans-serif", fontSize: "0.72rem", fontWeight: 600,
          }}>
            {idx + 1} / {images.length}
          </div>
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
        </>
      )}

      <div style={{
        position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none",
        background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
        padding: "4px 14px", borderRadius: 20, fontSize: "0.65rem", fontFamily: "'Montserrat',sans-serif",
        whiteSpace: "nowrap",
      }}>
        Scroll to zoom · Drag to pan · Esc to close
      </div>

      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", gap: 6, maxWidth: "80vw", overflowX: "auto" }} onClick={e => e.stopPropagation()}>
          {images.map((url, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Image ${i + 1}`} style={{ flex: "0 0 auto", width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "rgba(255,255,255,0.25)"}`, background: "rgba(0,0,0,0.4)", cursor: "pointer", padding: 0 }}>
              <img src={url} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
            </button>
          ))}
        </div>
      )}

      <div
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onDragStart={e => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: "relative", zIndex: 1, maxWidth: "90vw", maxHeight: "90vh",
          cursor: dragging ? "grabbing" : "grab", userSelect: "none", touchAction: "none",
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transition: dragging ? "none" : "transform 0.15s ease",
        }}
      >
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
