// src/components/DevCacheToggle.jsx
//
// Floating toggle for the 24h public-data cache (see
// Administrator/Local/publicDataCache.js) that public pages use for
// products/sauna rooms. Only ever renders on localhost — this must never
// appear for real visitors on the production domain — so it's safe to mount
// unconditionally at the app level.
//
// When switched to "LIVE DATA", every reload skips the cache entirely and
// fetches straight from Supabase, so a CMS/DB edit shows up immediately
// instead of possibly waiting up to 24h (or requiring a manual localStorage
// clear) to appear on a product page.
import { useState, useRef, useEffect } from "react";
import { isDevCacheBypassed, setDevCacheBypass } from "../Administrator/Local/publicDataCache";
import { setCache } from "../Administrator/adminCache";

const IS_LOCALHOST =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const PRODUCTS_STORAGE_KEY = "sawo_public_products_cache_v1";
const ROOMS_STORAGE_KEY = "sawo_public_sauna_rooms_cache_v1";
const PRODUCTS_CACHE_KEY = "public:products:data";
const ROOMS_CACHE_KEY = "public:sauna-rooms:data";
const POS_STORAGE_KEY = "sawo_dev_cache_toggle_pos";

function loadPos() {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return typeof p?.x === "number" && typeof p?.y === "number" ? p : null;
  } catch {
    return null;
  }
}

function savePos(pos) {
  try {
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

export default function DevCacheToggle() {
  const [on, setOn] = useState(() => isDevCacheBypassed());
  const [pos, setPos] = useState(() => loadPos());
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (!IS_LOCALHOST) return;

    const onMove = (e) => {
      if (!draggingRef.current) return;
      movedRef.current = true;
      const el = btnRef.current;
      const w = el?.offsetWidth || 0;
      const h = el?.offsetHeight || 0;
      const x = Math.min(Math.max(0, e.clientX - offsetRef.current.x), window.innerWidth - w);
      const y = Math.min(Math.max(0, e.clientY - offsetRef.current.y), window.innerHeight - h);
      setPos({ x, y });
    };
    const onUp = () => {
      if (draggingRef.current && movedRef.current) {
        // Snap to whichever side of the screen it's closer to, keeping the
        // y position it was dropped at.
        const el = btnRef.current;
        const w = el?.offsetWidth || 0;
        setPos((p) => {
          if (!p) return p;
          const centerX = p.x + w / 2;
          const snappedX = centerX < window.innerWidth / 2 ? 16 : Math.max(16, window.innerWidth - w - 16);
          const snapped = { x: snappedX, y: p.y };
          savePos(snapped);
          return snapped;
        });
      }
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (!IS_LOCALHOST) return null;

  const startDrag = (e) => {
    movedRef.current = false;
    draggingRef.current = true;
    const rect = btnRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const toggle = () => {
    // A drag ending on the button shouldn't also fire the toggle.
    if (movedRef.current) return;

    const next = !on;
    setDevCacheBypass(next);
    // Drop any already-cached snapshot so the flip is visible on this same
    // reload, not just future ones.
    try {
      localStorage.removeItem(PRODUCTS_STORAGE_KEY);
      localStorage.removeItem(ROOMS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setCache(PRODUCTS_CACHE_KEY, undefined);
    setCache(ROOMS_CACHE_KEY, undefined);
    setOn(next);
    window.location.reload();
  };

  const positionStyle = pos
    ? { top: pos.y, left: pos.x }
    : { bottom: 16, left: 16 };

  return (
    <button
      ref={btnRef}
      onMouseDown={startDrag}
      onClick={toggle}
      title={
        on
          ? "Live data mode is ON — every reload fetches fresh from Supabase. Click to re-enable the normal 24h cache. Drag to move."
          : "24h cache is active — a DB edit may not show up right away. Click to bypass it so every reload is live. Drag to move."
      }
      style={{
        position: "fixed",
        ...positionStyle,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        border: "none",
        background: on ? "#1f9d55" : "#c0392b",
        color: "#fff",
        fontFamily: "'Montserrat',sans-serif",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: draggingRef.current ? "grabbing" : "grab",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        userSelect: "none",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#fff",
          opacity: 0.85,
          flexShrink: 0,
        }}
      />
      {on ? "Live" : "Cached"}
    </button>
  );
}
