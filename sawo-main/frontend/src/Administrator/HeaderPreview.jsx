// src/Administrator/HeaderPreview.jsx
//
// A self-contained, static mock-up of the public header — admin-only, so it
// only ever loads inside the lazy-loaded Settings page chunk. It does NOT
// import or render the real components/Header/Header.jsx, and nothing here
// is reachable from the homepage bundle, so it has zero effect on public
// pagespeed. See Settings.jsx for why the live header no longer reads these
// settings directly.
//
// Nav items are illustrative copies of the real menu (names only, no real
// routes) — clicking anything here is inert by design; this is a look-alike
// for comparing options, not a functional nav.
import React, { useState, useRef } from "react";
import sLogo from "../assets/SAWO-logo.webp";

const NAV_ITEMS_LAYOUT1 = [
  { name: "Home" },
  {
    name: "Sauna",
    active: true,
    submenu: [
      {
        name: "Sauna Heaters",
        submenu: ["Wall-Mounted", "Tower", "Stone", "Floor", "Combi", "Dragonfire"],
      },
      { name: "Sauna Controls" },
      { name: "Sauna Accessories" },
      { name: "Sauna Rooms", submenu: ["Interior Designs", "Wood Panels & Timbers"] },
    ],
  },
  {
    name: "Steam",
    submenu: [{ name: "Steam Generators" }, { name: "Steam Controls" }, { name: "Steam Accessories" }],
  },
  { name: "Infrared" },
  {
    name: "Support",
    submenu: [{ name: "Frequently Asked Questions" }, { name: "User Manuals" }, { name: "Product Catalogue" }, { name: "Sauna Calculator" }],
  },
  { name: "Contact Us" },
  { name: "About Us", submenu: [{ name: "Latest News" }, { name: "Sustainability" }] },
  { name: "Careers" },
];

const NAV_ITEMS_LAYOUT2 = [
  { name: "Home" },
  {
    name: "Products",
    active: true,
    megaMenu: true,
    megaColumns: [
      {
        groupHeading: "Sauna",
        columns: [
          { items: ["Wall-Mounted", "Tower", "Stone", "Floor", "Combi", "Dragonfire"] },
          { items: ["Sauna Heaters", "Sauna Controls", "Sauna Accessories", "Sauna Rooms", "Interior Designs", "Wood Panels & Timbers"] },
        ],
      },
      { heading: "Steam", items: ["Steam Generators", "Steam Controls", "Steam Accessories"] },
      { heading: "Infrared", items: ["Infrared"] },
    ],
  },
  {
    name: "Support",
    submenu: [{ name: "Frequently Asked Questions" }, { name: "Sauna Calculator" }, { name: "User Manuals" }, { name: "Product Catalogue" }],
  },
  { name: "About Us", submenu: [{ name: "Latest News" }, { name: "Sustainability" }, { name: "Careers" }] },
  { name: "Contact Us" },
];

export default function HeaderPreview({ layout = "layout2", navStyle = "style1" }) {
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const navItems = layout === "layout1" ? NAV_ITEMS_LAYOUT1 : NAV_ITEMS_LAYOUT2;

  // Same delayed-close pattern as the real Header.jsx: closing instantly on
  // mouseleave doesn't give the cursor time to travel from the top-level
  // item down into the dropdown below it (there's a real gap between the two
  // in screen space), so the dropdown would vanish before you could reach it.
  const menuTimeout = useRef(null);
  const handleMouseEnterMenu = (name) => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setHoveredMenu(name);
  };
  const handleMouseLeaveMenu = () => {
    menuTimeout.current = setTimeout(() => setHoveredMenu(null), 250);
  };

  return (
    <div className="hp-frame">
      <div className={`hp-header nav-style-${navStyle}`}>
        <img src={sLogo} alt="SAWO logo" className="hp-logo" />

        {/* Logo left, nav+icons grouped and pushed to the right — matches
            the real header's logo / (nav + search + lang) split, not nav
            flowing immediately after the logo. */}
        <div className="hp-right-group">
          <nav className="hp-nav">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="hp-item-wrap"
                onMouseEnter={() => handleMouseEnterMenu(item.name)}
                onMouseLeave={handleMouseLeaveMenu}
              >
                <a
                  href="#preview"
                  onClick={(e) => e.preventDefault()}
                  className={`hp-menu-item hp-toplevel ${item.active ? "active" : ""}`}
                >
                  {item.name}
                  {(item.submenu || item.megaMenu) && <i className="fa-solid fa-chevron-down hp-chevron" />}
                </a>

                {item.submenu && hoveredMenu === item.name && (
                  <div className="hp-dropdown">
                    {item.submenu.map((sub) => {
                      const subName = typeof sub === "string" ? sub : sub.name;
                      return (
                        <a
                          href="#preview"
                          key={subName}
                          onClick={(e) => e.preventDefault()}
                          className="hp-menu-item hp-drop-item"
                        >
                          {subName}
                          {sub.submenu && <i className="fa-solid fa-chevron-right hp-chevron-sm" />}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hp-icons">
            <i className="fa-solid fa-search hp-icon" />
            <span className="hp-lang">EN</span>
          </div>
        </div>

        {/* Rendered here (anchored to the full-width header bar) rather than
            inside the narrow per-item wrapper above — the "Products" trigger
            sits close to the right edge of the header, and a wide mega-menu
            anchored to that narrow trigger box would still spill past the
            frame's edge. Anchoring to .hp-header (right: matches its own
            padding) guarantees it can never exceed the frame, regardless of
            where the trigger sits. Same hover handlers as the trigger so
            moving the cursor down into the panel keeps it open. */}
        {navItems.filter((item) => item.megaMenu && hoveredMenu === item.name).map((item) => (
          <div
            key={item.name}
            className="hp-mega"
            onMouseEnter={() => handleMouseEnterMenu(item.name)}
            onMouseLeave={handleMouseLeaveMenu}
          >
            {item.megaColumns.map((col, ci) => (
              col.groupHeading ? (
                <div key={ci} className="hp-mega-group">
                  <p className="hp-mega-heading">{col.groupHeading}</p>
                  <div className="hp-mega-subcols">
                    {col.columns.map((sub, si) => (
                      <div key={si} className="hp-mega-subcol">
                        {sub.items.map((it) => (
                          <a href="#preview" key={it} onClick={(e) => e.preventDefault()} className="hp-menu-item hp-drop-item">
                            {it}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={ci} className="hp-mega-col">
                  <p className="hp-mega-heading">{col.heading}</p>
                  {col.items.map((it) => (
                    <a href="#preview" key={it} onClick={(e) => e.preventDefault()} className="hp-menu-item hp-drop-item">
                      {it}
                    </a>
                  ))}
                </div>
              )
            ))}
          </div>
        ))}
      </div>

      <div className="hp-page-mock">
        <div className="hp-page-mock-line" style={{ width: "40%" }} />
        <div className="hp-page-mock-line" style={{ width: "70%" }} />
        <div className="hp-page-mock-line" style={{ width: "55%" }} />
        <div className="hp-page-mock-line" style={{ width: "35%" }} />
        <div className="hp-page-mock-line" style={{ width: "60%" }} />
      </div>

      <style>{`
        /* No overflow: hidden here — the dropdown/mega-menu are absolutely
           positioned and extend below the header bar, and clipping the frame
           was cutting them off. Rounded corners are applied to the header
           bar and page-mock individually instead (below). */
        .hp-frame {
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #f4f2ef;
        }
        .hp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          background: #ffffff;
          padding: 10px 20px;
          font-family: 'Montserrat', sans-serif;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          position: relative;
        }
        .hp-logo {
          height: 36px;
          object-fit: contain;
          flex-shrink: 0;
        }
        /* Nav + search/lang grouped together and pushed to the right by
           justify-space-between above — matches the real header's logo-left,
           nav-and-icons-right split, instead of nav flowing right after the
           logo. */
        .hp-right-group {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .hp-nav {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }
        .hp-item-wrap { position: relative; }
        .hp-menu-item {
          position: relative;
          color: rgb(51,51,51);
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
        }
        .hp-toplevel {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 2px;
        }
        .hp-chevron { font-size: 8px; }
        .hp-chevron-sm { font-size: 8px; margin-left: auto; }

        /* Style 1 — growing underline (default) */
        .hp-menu-item::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #af8564;
          transition: width 0.2s ease;
        }
        .hp-menu-item:hover::after,
        .hp-menu-item.active::after {
          width: 100%;
        }
        .hp-menu-item.active,
        .hp-menu-item:hover {
          color: #af8564;
        }
        .hp-menu-item.active { font-weight: 600; }

        /* Style 2 — solid brand-brown pill */
        .nav-style-style2 .hp-toplevel::after { content: none; }
        .nav-style-style2 .hp-toplevel {
          padding: 7px 12px;
          border-radius: 6px;
          transition: none;
        }
        .nav-style-style2 .hp-toplevel:hover,
        .nav-style-style2 .hp-toplevel.active {
          background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
          color: #ffffff;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(0,0,0,0.12),
            0 2px 6px rgba(139,94,60,0.22);
        }

        .hp-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          padding: 10px;
          z-index: 20;
          min-width: 200px;
        }
        /* Anchored to .hp-header (position: relative, spans the full frame
           width) rather than the trigger's own narrow box — see the JSX
           comment where this is rendered. right: 20px matches the header's
           own horizontal padding, so the panel's right edge lines up with
           the frame's inner edge and can never exceed it, however close to
           the edge the "Products" trigger itself sits. */
        /* Anchored from the right (under the "Products" trigger, which sits
           on the right side of the nav) rather than the left — the earlier
           right-anchor overflow was caused by pairing it with an
           artificially narrow fixed width (480px) that was smaller than the
           content's natural size, which forced a flex shrink-refusal
           overflow bug. width: max-content has no such conflict — the panel
           just sizes to its own content and extends leftward from the right
           anchor, staying under the nav without being compressed. */
        .hp-mega {
          position: absolute;
          top: 100%;
          right: 20px;
          margin-top: 8px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          padding: 10px;
          z-index: 20;
          display: flex;
          gap: 0;
          width: max-content;
        }
        .hp-mega-group, .hp-mega-col {
          padding: 0 12px;
          border-right: 1px solid rgba(0,0,0,0.18);
        }
        .hp-mega-group:last-child, .hp-mega-col:last-child { border-right: none; }
        .hp-mega-heading {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #af8564;
          margin: 0 0 8px;
          white-space: nowrap;
        }
        .hp-mega-subcols { display: flex; gap: 12px; }
        .hp-mega-subcol { display: flex; flex-direction: column; }
        .hp-drop-item {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .nav-style-style2 .hp-drop-item::after { content: none; }
        .nav-style-style2 .hp-drop-item:hover {
          background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
          color: #fff;
        }

        .hp-icons {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .hp-icon { color: rgb(51,51,51); font-size: 14px; }
        .hp-lang {
          font-size: 12px;
          font-weight: 600;
          color: rgb(51,51,51);
          letter-spacing: 0.04em;
        }

        .hp-page-mock {
          padding: 48px 24px;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        .hp-page-mock-line {
          height: 10px;
          border-radius: 6px;
          background: rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}
