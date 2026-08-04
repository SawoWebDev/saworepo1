// BrochureDropdownButton.jsx
// "VIEW BROCHURE" button that opens a dropdown of multiple PDF links.
// The dropdown is portaled to <body> and positioned with JS-computed pixel
// coordinates from the button's on-screen position, so it is immune to any
// overflow/stacking context the surrounding page markup creates.

import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const BrochureDropdownButton = ({ text = "VIEW BROCHURE", items = [] }) => {
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const positionDropdown = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 10;
    setPos({
      top: rect.bottom + window.scrollY + gap,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const doOpen = useCallback(() => {
    cancelClose();
    positionDropdown();
    setOpen(true);
  }, [cancelClose, positionDropdown]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, [cancelClose]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => positionDropdown();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true });
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition);
    };
  }, [open, positionDropdown]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  return (
    <div className="sawo-vb-wrap">
      <style>{`
        .sawo-vb-wrap {
          display: inline-flex;
          justify-content: center;
          margin-top: 20px;
        }
        .sawo-vb-btn {
          background-color: white;
          color: #af8564;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 18px;
          letter-spacing: 0.06em;
          padding: 12px 32px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
          display: inline-block;
          border: none;
          margin-bottom: 5px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .sawo-vb-btn:hover,
        .sawo-vb-btn.sawo-vb-active {
          background-color: #af8564;
          color: white;
        }
        .sawo-vb-dropdown {
          position: absolute;
          margin: 0;
          z-index: 999999;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease, opacity 0.5s ease;
          opacity: 0;
          border-radius: 5px;
          pointer-events: none;
        }
        .sawo-vb-dropdown.sawo-vb-open {
          max-height: 600px;
          opacity: 1;
          pointer-events: auto;
        }
        .sawo-vb-dropdown a {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          background-color: #af8564;
          color: white;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 16px;
          line-height: 20px;
          white-space: nowrap;
          transition: background-color 0.3s ease;
        }
        .sawo-vb-dropdown a:hover { background-color: #9e7255; }
        .sawo-vb-dropdown a i { margin-right: 10px; font-size: 16px; }

        @media (max-width: 768px) {
          .sawo-vb-btn { font-size: 12px; line-height: 16px; padding: 11px 26px; }
          .sawo-vb-dropdown a { padding: 10px 16px; font-size: 13px; line-height: 18px; }
          .sawo-vb-dropdown a i { font-size: 13px; }
        }
        @media (max-width: 480px) {
          .sawo-vb-btn { font-size: 11px; padding: 10px 22px; }
          .sawo-vb-dropdown a { padding: 10px 14px; font-size: 12px; }
        }
      `}</style>

      <button
        ref={btnRef}
        type="button"
        className={`sawo-vb-btn${open ? " sawo-vb-active" : ""}`}
        onMouseEnter={doOpen}
        onMouseLeave={scheduleClose}
        onClick={() => (open ? setOpen(false) : doOpen())}
      >
        {text}
      </button>

      {createPortal(
        <div
          ref={dropdownRef}
          className={`sawo-vb-dropdown${open ? " sawo-vb-open" : ""}`}
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {items.map((item, i) => (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-file-pdf" /> {item.label}
            </a>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default BrochureDropdownButton;
