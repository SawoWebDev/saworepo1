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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
        background: "linear-gradient(145deg, #bd9873 0%, #af8564 45%, #96704f 100%)",
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
        transition: "all 0.3s ease",
        zIndex: 999,
        boxShadow: "inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -3px 4px rgba(0,0,0,0.28), 0 6px 16px rgba(0, 0, 0, 0.25)",
        fontFamily: "'Montserrat', sans-serif",
      }}
      title="Scroll to top"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "linear-gradient(145deg, #a9835f 0%, #9d7554 45%, #855f40 100%)";
        e.currentTarget.style.transform = isVisible ? "translateY(-2px)" : "translateY(20px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "linear-gradient(145deg, #bd9873 0%, #af8564 45%, #96704f 100%)";
        e.currentTarget.style.transform = isVisible ? "translateY(0)" : "translateY(20px)";
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
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  );
}
