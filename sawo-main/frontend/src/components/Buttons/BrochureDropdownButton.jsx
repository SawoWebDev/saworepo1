// BrochureDropdownButton.jsx
// Reusable "VIEW BROCHURE" CTA for hero sections. Pass `items` (an array of
// {label, href}) for a hover/click dropdown of multiple PDFs — the panel
// mirrors the header's own dropdowns (HeaderLanguageSwitcher's
// .header-lang-menu/.header-lang-option: white rounded panel, soft shadow,
// warm cream hover) so every dropdown on the site behaves and looks the
// same. Pass just `href` (no items, or an empty items array) and it renders
// as a single direct link instead — no dropdown machinery at all — so a
// page with only one brochure doesn't get a pointless one-item menu.
//
// The dropdown is portaled to <body> and positioned with JS-computed pixel
// coordinates from the button's on-screen position, so it is immune to any
// overflow/stacking context the surrounding page markup creates.

import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const BrochureDropdownButton = ({ text = "VIEW BROCHURE", items = [], href }) => {
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const hasDropdown = items.length > 0;

  const positionDropdown = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 10;
    setPos({
      top: rect.bottom + window.scrollY + gap,
      // Center point, not the left edge — the panel is centered under the
      // button via CSS transform: translateX(-50%), so it stays centered
      // regardless of how much wider its content makes it than the button.
      left: rect.left + window.scrollX + rect.width / 2,
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
    if (!hasDropdown || !open) return;
    const reposition = () => positionDropdown();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true });
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition);
    };
  }, [hasDropdown, open, positionDropdown]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const sharedStyles = (
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
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        margin-bottom: 5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        text-decoration: none;
      }
      .sawo-vb-btn:hover,
      .sawo-vb-btn.sawo-vb-active {
        background-color: #af8564;
        color: white;
      }
      .sawo-vb-btn .sawo-vb-chevron {
        font-size: 10px;
        transition: transform 0.25s ease;
      }
      .sawo-vb-btn.sawo-vb-active .sawo-vb-chevron { transform: rotate(180deg); }

      /* Panel styling matches the header's own dropdowns (see
         HeaderLanguageSwitcher's .header-lang-menu/.header-lang-option in
         Header.jsx) so every dropdown on the site looks/feels the same. */
      .sawo-vb-dropdown {
        position: absolute;
        margin: 0;
        z-index: 999999;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.35s ease, opacity 0.35s ease, transform 0.35s ease;
        opacity: 0;
        transform: translateX(-50%) translateY(-6px);
        pointer-events: none;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        border: 1px solid rgba(0,0,0,0.06);
        padding: 6px;
      }
      .sawo-vb-dropdown.sawo-vb-open {
        max-height: 600px;
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
      }
      .sawo-vb-dropdown a {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-radius: 8px;
        background-color: transparent;
        color: #333;
        text-decoration: none;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        font-size: 13px;
        line-height: 18px;
        white-space: nowrap;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .sawo-vb-dropdown a:hover { background-color: #f5f0ec; color: #af8564; }
      .sawo-vb-dropdown a i { margin-right: 10px; font-size: 13px; color: #af8564; }

      @media (max-width: 768px) {
        .sawo-vb-btn { font-size: 12px; line-height: 16px; padding: 11px 26px; }
        .sawo-vb-dropdown a { padding: 9px 12px; font-size: 12px; line-height: 16px; }
      }
      @media (max-width: 480px) {
        .sawo-vb-btn { font-size: 11px; padding: 10px 22px; }
        .sawo-vb-dropdown a { padding: 9px 10px; font-size: 12px; }
      }
    `}</style>
  );

  // No items — just a plain link, no dropdown machinery at all.
  if (!hasDropdown) {
    return (
      <div className="sawo-vb-wrap">
        {sharedStyles}
        <a href={href} target="_blank" rel="noopener noreferrer" className="sawo-vb-btn">
          {text}
        </a>
      </div>
    );
  }

  return (
    <div className="sawo-vb-wrap">
      {sharedStyles}

      <button
        ref={btnRef}
        type="button"
        className={`sawo-vb-btn${open ? " sawo-vb-active" : ""}`}
        onMouseEnter={doOpen}
        onMouseLeave={scheduleClose}
        onClick={() => (open ? setOpen(false) : doOpen())}
      >
        {text}
        <i className="fa-solid fa-chevron-down sawo-vb-chevron" aria-hidden="true" />
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
