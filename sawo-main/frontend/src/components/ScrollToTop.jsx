import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const handleScroll = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // A route with a #hash (e.g. /sauna/rooms#glass-front-sauna-room, linked
  // from Home/Footer's anchored links) must scroll to THAT element, not the
  // top — this effect used to unconditionally force (0,0) on every route
  // change, which silently defeated every hash-anchored link site-wide
  // regardless of whether the target page actually had a matching element.
  // React Router doesn't scroll to a hash on client-side navigation the way
  // a full page load does, so this does it manually. The target element may
  // not exist on the very first render after navigating (e.g.
  // SaunaRoomViewer.jsx sets its section's id from the hash-selected tab
  // during its own render) — one retry after a short delay covers that
  // without polling indefinitely.
  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const scrollToHash = () => {
        const el = document.getElementById(id);
        if (!el) return false;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      };
      if (!scrollToHash()) {
        const t = setTimeout(scrollToHash, 150);
        return () => clearTimeout(t);
      }
      return undefined;
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [location.pathname, location.hash]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        // Same gradient/shadow as the header's Nav Style 2 active/hover pill
        // (Header.jsx) — kept byte-identical so every "brown pill" on the
        // site reads as the same element.
        background: "linear-gradient(135deg, #af8564 0%, #c9a97e 100%)",
        // borderStyle (not the `border` shorthand): different Chromium builds
        // serialize `border: "none"` into the DOM style attribute differently
        // (border-image: none vs border-image: initial), and this button is
        // part of the prerendered homepage snapshot — a text mismatch here
        // between the build-time browser and the visitor's browser causes a
        // real hydration failure (React errors #418/#423). borderStyle only
        // touches one longhand, avoiding the ambiguous border-image expansion.
        borderStyle: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        visibility: isVisible ? "visible" : "hidden",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.3s ease, visibility 0.3s ease, background 0.2s ease",
        zIndex: 999,
        // Layered for a raised, domed button rather than a flat pill:
        //  1) big soft shadow  = elevation off the page
        //  2) tight dark shadow = contact/grounding shadow right at the base
        //  3) inset top highlight = glossy light catching the top of the dome
        //  4) inset bottom shadow = bevel giving the disc physical thickness
        boxShadow:
          "0 10px 20px rgba(139,94,60,0.38), " +
          "0 3px 6px rgba(0,0,0,0.22), " +
          "inset 0 2px 1px rgba(255,255,255,0.5), " +
          "inset 0 -4px 6px rgba(0,0,0,0.28)",
        fontFamily: "'Montserrat', sans-serif",
      }}
      title="Scroll to top"
      aria-label="Scroll to top"
      onMouseEnter={(e) => {
        if (!isVisible) return;
        e.currentTarget.style.background = "linear-gradient(135deg, #9a7250 0%, #b08d68 100%)";
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 14px 26px rgba(139,94,60,0.45), " +
          "0 4px 8px rgba(0,0,0,0.25), " +
          "inset 0 2px 1px rgba(255,255,255,0.55), " +
          "inset 0 -4px 6px rgba(0,0,0,0.28)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "linear-gradient(135deg, #af8564 0%, #c9a97e 100%)";
        e.currentTarget.style.transform = isVisible ? "translateY(0)" : "translateY(20px)";
        e.currentTarget.style.boxShadow =
          "0 10px 20px rgba(139,94,60,0.38), " +
          "0 3px 6px rgba(0,0,0,0.22), " +
          "inset 0 2px 1px rgba(255,255,255,0.5), " +
          "inset 0 -4px 6px rgba(0,0,0,0.28)";
      }}
      onMouseDown={(e) => {
        // Push the button down into the page on click — the inset shadows
        // flip (dark on top, light sliver at the bottom) to read as pressed
        // rather than raised, and the drop shadow tightens as it "meets" the
        // page. Restored in onMouseUp/onMouseLeave/onTouchEnd.
        e.currentTarget.style.transform = "translateY(1px) scale(0.96)";
        e.currentTarget.style.boxShadow =
          "0 2px 4px rgba(139,94,60,0.3), " +
          "inset 0 2px 4px rgba(0,0,0,0.35), " +
          "inset 0 -1px 1px rgba(255,255,255,0.25)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 14px 26px rgba(139,94,60,0.45), " +
          "0 4px 8px rgba(0,0,0,0.25), " +
          "inset 0 2px 1px rgba(255,255,255,0.55), " +
          "inset 0 -4px 6px rgba(0,0,0,0.28)";
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "translateY(1px) scale(0.96)";
        e.currentTarget.style.boxShadow =
          "0 2px 4px rgba(139,94,60,0.3), " +
          "inset 0 2px 4px rgba(0,0,0,0.35), " +
          "inset 0 -1px 1px rgba(255,255,255,0.25)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = isVisible ? "translateY(0)" : "translateY(20px)";
        e.currentTarget.style.boxShadow =
          "0 10px 20px rgba(139,94,60,0.38), " +
          "0 3px 6px rgba(0,0,0,0.22), " +
          "inset 0 2px 1px rgba(255,255,255,0.5), " +
          "inset 0 -4px 6px rgba(0,0,0,0.28)";
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" }}
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  );
}
