// BrochureDropdownButton.jsx
// The single hero-CTA button component for the whole site — every hero
// button, whatever it does, renders through this so they all look and feel
// identical. Two modes, chosen by what the button links to:
//
//   PDF/brochure (default): pass `items` (array of {label, href}) for a
//   hover/click dropdown of multiple PDFs, or just `href` for a single PDF —
//   either way it renders with the chevron + dropdown panel (even a single
//   PDF gets the dropdown treatment, not a plain link, so every brochure
//   button behaves identically regardless of how many PDFs it offers). The
//   panel mirrors the header's own dropdowns (HeaderLanguageSwitcher's
//   .header-lang-menu/.header-lang-option: white rounded panel, soft shadow,
//   warm cream hover) so every dropdown on the site looks/feels the same.
//   Links open in a new tab — leaving the page to grab a PDF shouldn't lose
//   your place.
//
//   Redirect (`redirect` prop): for anchor scrolls (href="#section") or
//   internal page navigation — same pill styling, but no chevron, no
//   dropdown, and same-tab (no target="_blank", since you're not leaving
//   the site).
//
// The dropdown is portaled to <body> and positioned with JS-computed pixel
// coordinates from the button's on-screen position, so it is immune to any
// overflow/stacking context the surrounding page markup creates.

import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const BrochureDropdownButton = ({ text = "VIEW BROCHURE", items = [], href, redirect = false }) => {
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // A bare `href` (no `items`) for a PDF/brochure button still gets the
  // chevron + one-item dropdown treatment, not a plain link — see file header.
  const resolvedItems = items.length > 0 ? items : (href ? [{ label: text, href }] : []);
  const hasDropdown = !redirect && resolvedItems.length > 0;

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
        /* Not transitioned — a gradient background can't be smoothly
           interpolated by any browser, so animating it desyncs from the
           text color swap (text fades first, pill pops in a beat later).
           Same fix as Header.jsx's .nav-style-style2 .menu-item. */
        transition: none;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        margin-bottom: 5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        text-decoration: none;
      }
      /* Bevel treatment matches the header's Nav Style 2 hover/active pill
         (Header.jsx's .nav-style-style2 .nav-toplevel:hover) — a diagonal
         brand-brown gradient with an inset top highlight + inset bottom
         shadow + a soft drop shadow, so it reads as a raised, physical
         button rather than a flat color swap. */
      .sawo-vb-btn:hover,
      .sawo-vb-btn.sawo-vb-active {
        background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
        color: #ffffff;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.3),
          inset 0 -1px 0 rgba(0,0,0,0.12),
          0 2px 6px rgba(139,94,60,0.22);
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
        /* Not transitioned — same gradient-desync reasoning as .sawo-vb-btn
           above. */
        transition: none;
      }
      .sawo-vb-dropdown a:hover {
        background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
        color: #ffffff;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.3),
          inset 0 -1px 0 rgba(0,0,0,0.12),
          0 2px 6px rgba(139,94,60,0.22);
      }
      .sawo-vb-dropdown a i { margin-right: 10px; font-size: 13px; color: #af8564; transition: color 0.15s ease; }
      .sawo-vb-dropdown a:hover i { color: #ffffff; }

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

  // Redirect (anchor scroll / internal nav) — no chevron, no dropdown,
  // same-tab, identical pill styling to the PDF buttons.
  if (redirect) {
    return (
      <div className="sawo-vb-wrap">
        {sharedStyles}
        <a href={href} className="sawo-vb-btn">
          {text}
        </a>
      </div>
    );
  }

  // Neither items nor href given — nothing to render.
  if (!hasDropdown) return null;

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
          {resolvedItems.map((item, i) => (
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
