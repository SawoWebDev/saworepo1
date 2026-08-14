import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import sLogo from "../../assets/SAWO-logo.webp";
import menuPaths from "../../menuPaths";
import SearchBar from "./SearchBar";
import HeaderLanguageSwitcher from "./HeaderLanguageSwitcher";

/**
 * The header's nav structure and hover style used to be two CMS settings
 * (header_layout / header_nav_style in app_settings, read via
 * local-storage/headerLayout.js + headerNavStyle.js). They are now fixed in
 * code at Layout 1 + Style 2, and the matching Settings cards are gone.
 *
 * That's a speed change as much as a product one: the header no longer waits
 * on — or re-renders for — an async settings read, the prerendered markup is
 * byte-identical to what hydration produces (no post-paint swap), and the
 * Layout 2 mega-menu markup is dropped from the bundle entirely.
 */
const NAV_STYLE = "style2";

// Layout 1 — Sauna / Steam / Infrared / Support / Contact Us / About Us /
// Careers as separate top-level items, each with its own dropdown.
// Module scope, not a const inside the component: it's static data, so
// rebuilding these ~30 objects on every render (every scroll tick fires a
// setState) was pure waste.
const navItems = [
  { name: "Home", path: menuPaths.home },
  {
    name: "Sauna",
    path: menuPaths.sauna.parent,
    submenu: [
      {
        name: "Sauna Heaters",
        path: menuPaths.sauna.heaters.parent,
        submenu: [
          { name: "Wall-Mounted", path: menuPaths.sauna.heaters.wallMounted },
          { name: "Tower", path: menuPaths.sauna.heaters.tower },
          { name: "Stone", path: menuPaths.sauna.heaters.stone },
          { name: "Floor", path: menuPaths.sauna.heaters.floor },
          { name: "Combi", path: menuPaths.sauna.heaters.combi },
          { name: "Dragonfire", path: menuPaths.sauna.heaters.dragonfire },
        ],
      },
      { name: "Sauna Controls", path: menuPaths.sauna.controls },
      { name: "Sauna Accessories", path: menuPaths.sauna.accessories.parent },
      {
        name: "Sauna Rooms",
        path: menuPaths.sauna.rooms,
        submenu: [
          { name: "Interior Designs", path: menuPaths.sauna.interiorDesigns },
          { name: "Wood Panels & Timbers", path: menuPaths.sauna.woodPanels },
        ],
      },
    ],
  },
  {
    name: "Steam",
    path: menuPaths.steam.parent,
    submenu: [
      { name: "Steam Generators", path: menuPaths.steam.generators },
      { name: "Steam Controls", path: menuPaths.steam.controls },
      { name: "Steam Accessories", path: menuPaths.steam.accessories },
    ],
  },
  { name: "Infrared", path: menuPaths.infrared },
  {
    name: "Support",
    path: menuPaths.support.parent,
    submenu: [
      { name: "Frequently Asked Questions", path: menuPaths.support.faq },
      { name: "User Manuals", path: menuPaths.support.manuals },
      { name: "Product Catalogue", path: menuPaths.support.catalogue },
      { name: "Sauna Calculator", path: menuPaths.support.saunaCalculator },
    ],
  },
  { name: "Contact Us", path: menuPaths.contact },
  {
    name: "About Us",
    path: menuPaths.about.parent,
    submenu: [
      { name: "Latest News", path: menuPaths.about.news },
      { name: "Sustainability", path: menuPaths.about.sustainability },
    ],
  },
  { name: "Careers", path: menuPaths.careers },
];

export default function Header() {
  const location = useLocation();

  const [hidden, setHidden] = useState(false);
  // Transparent (with a dark-to-clear scrim) at the very top of the page,
  // solid white once the user has scrolled away from the top.
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const lastScrollY = useRef(0);
  const navRef = useRef(null);
  const menuTimeout = useRef(null);
  const subMenuTimeout = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);


  // --- Active helpers ---
  const isActive = (item) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => {
        if (sub.path && location.pathname.startsWith(sub.path)) return true;
        if (sub.submenu)
          return sub.submenu.some(
            (s) => s.path && location.pathname.startsWith(s.path),
          );
        return false;
      });
    }
    return false;
  };
  const isSubActive = (sub) => {
    if (sub.path && location.pathname.startsWith(sub.path)) return true;
    if (sub.submenu)
      return sub.submenu.some(
        (s) => s.path && location.pathname.startsWith(s.path),
      );
    return false;
  };
  const isSub2Active = (item2) =>
    !!(item2.path && location.pathname === item2.path);

  // Hide header on scroll down, show on scroll up; separately track whether
  // we've left the very top of the page for the transparent-to-white swap.
  //
  // Coalesced into one rAF callback per frame and registered passive: the
  // previous version ran on every scroll event (dozens per frame's worth of
  // wheel/touch input) and called setHidden/setScrolled unconditionally, so a
  // single flick re-rendered the entire header — every nav item, every
  // dropdown — hundreds of times for values that had not changed. The
  // useState setters below bail out when the value is identical, so React
  // now re-renders only at the two thresholds that actually matter (8px and
  // 80px). Deps are empty so the listener is attached once; mobileOpen is
  // read through a ref-free functional setState instead of re-subscribing.
  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const currentScroll = window.scrollY;
        setHidden(currentScroll > lastScrollY.current && currentScroll > 80);
        setScrolled(currentScroll > 8);
        lastScrollY.current = currentScroll;
        setMobileOpen((open) => (open ? false : open));
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);


  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Exclude the toggle button itself: it's a sibling of the dropdown
      // panel, not inside it, so a click on it (while open) counted as
      // "outside" and fired setMobileOpen(false) here on mousedown — then
      // the button's own onClick fired setMobileOpen(!mobileOpen) right
      // after, reading the pre-close value and flipping it straight back
      // open. Net effect: clicking the hamburger to close a menu that was
      // already open silently reopened it instead.
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(event.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Desktop hover handlers with delay
  const handleMouseEnterMenu = (name) => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setHoveredMenu(name);
  };
  const handleMouseLeaveMenu = () => {
    menuTimeout.current = setTimeout(() => setHoveredMenu(null), 200);
  };
  const handleMouseEnterSubmenu = (name) => {
    if (subMenuTimeout.current) clearTimeout(subMenuTimeout.current);
    setHoveredSubmenu(name);
  };
  const handleMouseLeaveSubmenu = () => {
    subMenuTimeout.current = setTimeout(() => setHoveredSubmenu(null), 200);
  };

  // The mobile dropdown panel is always solid white, so a transparent header
  // sitting directly above it (still at the top of the page, not yet
  // scrolled) looked broken — dark scrim behind the logo/hamburger row, then
  // a white panel snapping in right underneath. Forcing the header solid
  // whenever the mobile menu is open makes it read as one continuous white
  // surface instead, same as it already does once the user scrolls.
  const headerSolid = scrolled || mobileOpen;

  return (
    <>
      {/* Montserrat is loaded once in public/index.html */}
      {/* Scrim — a separate, taller layer behind the header so the dark-to-
          clear fade has room to breathe past the header's own (much
          shorter) box instead of cutting off right at its edge. Sits one
          z-index below the header so header content/links stay on top and
          clickable; fades out entirely once scrolled (or once the solid
          mobile panel is showing). */}
      {!headerSolid && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 w-full z-40 pointer-events-none transition-opacity duration-300"
          style={{
            height: 160,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.06) 55%, rgba(0,0,0,0) 68%)",
          }}
        />
      )}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 font-sans nav-style-${NAV_STYLE} ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${headerSolid ? "shadow-md header--solid" : "header--transparent"}`}
        style={{
          fontFamily: `"Montserrat"`,
          background: headerSolid ? "#ffffff" : "transparent",
          transition: "background 0.35s ease, box-shadow 0.35s ease, transform 0.5s ease",
        }}
      >
        <div className="w-full flex items-center justify-between py-3 px-6 md:px-8">
          {/* Logo with left padding */}
          <Link to="/" className="flex-shrink-0 pl-2">
            <img
              src={sLogo}
              alt="SAWO-logo"
              className="h-14 md:h-20 object-contain transition-all duration-300"
            />
          </Link>

          {/* Desktop nav + Search (grouped on right) */}
          <div className="hidden md:flex items-center gap-3">
              {/* gap-1 between items, not gap-6: Layout 1 puts eight top-level
                  items on the bar, and Style 2's pill already adds 14px of
                  padding either side of each label, so the old spacing read as
                  a very sparse, disconnected row. */}
              <nav
                ref={navRef}
                className="flex gap-1 whitespace-nowrap text-[16px] font-normal text-[rgb(51,51,51)]"
              >
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterMenu(item.name)}
                  onMouseLeave={handleMouseLeaveMenu}
                >
                  {/* Top-level link or button */}
                  {item.submenu ? (
                    item.path ? (
                      <Link
                        to={item.path}
                        className={`menu-item nav-toplevel flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
                          isActive(item) ? "active" : ""
                        }`}
                      >
                        {item.name}{" "}
                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                      </Link>
                    ) : (
                      <button
                        className={`menu-item nav-toplevel flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
                          isActive(item) ? "active" : ""
                        }`}
                      >
                        {item.name}{" "}
                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                      </button>
                    )
                  ) : (
                    <Link
                      to={item.path}
                      className={`menu-item nav-toplevel flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
                        isActive(item) ? "active" : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Submenu — Level 1 (Support, About Us) */}
                  {item.submenu && hoveredMenu === item.name && (
                    <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl min-w-[220px] z-50 py-3 px-2 border border-gray-100">
                      {item.submenu.map((sub) =>
                        sub.submenu ? (
                          <div
                            key={sub.name}
                            className="relative group"
                            onMouseEnter={() =>
                              handleMouseEnterSubmenu(sub.name)
                            }
                            onMouseLeave={handleMouseLeaveSubmenu}
                          >
                            {sub.path ? (
                              <Link
                                to={sub.path}
                                className={`menu-item w-full text-left px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg flex justify-between items-center text-[rgb(51,51,51)] ${
                                  isSubActive(sub)
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <span className="menu-text">{sub.name}</span>{" "}
                                <i className="fa-solid fa-chevron-right text-[9px]"></i>
                              </Link>
                            ) : (
                              <button
                                className={`menu-item w-full text-left px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg flex justify-between items-center text-[rgb(51,51,51)] ${
                                  isSubActive(sub)
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <span className="menu-text">{sub.name}</span>{" "}
                                <i className="fa-solid fa-chevron-right text-[9px]"></i>
                              </button>
                            )}

                            {/* Submenu — Level 2 */}
                            {hoveredSubmenu === sub.name && (
                              <div className="absolute top-0 left-full ml-1 bg-white rounded-xl shadow-2xl min-w-[180px] z-50 py-3 px-2 border border-gray-100">
                                {sub.submenu.map((item2) => (
                                  <Link
                                    key={item2.name || item2}
                                    to={item2.path || "#"}
                                    className={`menu-item block px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg text-[rgb(51,51,51)] ${
                                      isSub2Active(item2)
                                        ? "active"
                                        : ""
                                    }`}
                                  >
                                    {item2.name || item2}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            key={sub.name || sub}
                            to={sub.path || "#"}
                            className={`menu-item block px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg text-[rgb(51,51,51)] ${
                              isSubActive(sub)
                                ? "active"
                                : ""
                            }`}
                          >
                            {sub.name || sub}
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Search Bar - Icon or Expanded */}
            <div
              className="ml-auto pr-2 md:pr-4 flex items-center gap-3 transition-all duration-300"
              id="search-container"
              style={{
                opacity: searchExpanded ? 1 : 1,
                transform: searchExpanded ? 'translateX(0)' : 'translateX(0)'
              }}
            >
              {searchExpanded ? (
                // Expanded search bar with smooth animation - responsive width
                <div
                  className="w-40 sm:w-44 md:w-48 lg:w-56 relative"
                  style={{
                    animation: 'slideInRight 0.3s ease-out'
                  }}
                >
                  <SearchBar
                    isInline={true}
                    onBlur={() => {
                      // Delay closing to allow click to register
                      setTimeout(() => setSearchExpanded(false), 100);
                    }}
                  />
                </div>
              ) : (
                // Search icon only
                <button
                  onClick={() => setSearchExpanded(true)}
                  className="header-icon-btn p-2 hover:text-[#af8564] transition-colors text-[rgb(51,51,51)]"
                  aria-label="Search"
                  style={{
                    animation: searchExpanded ? 'none' : 'slideInLeft 0.3s ease-out'
                  }}
                >
                  <i className="fa-solid fa-search text-lg"></i>
                </button>
              )}

            </div>

            <HeaderLanguageSwitcher />

            {/* CSS Animations */}
            <style>{`
              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: translateX(20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @keyframes growLine {
                from {
                  width: 0;
                }
                to {
                  width: 100%;
                }
              }
              .menu-item {
                position: relative;
              }
              .menu-item::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 3px;
                background-color: #af8564;
              }
              .menu-item:hover::after,
              .menu-item.active::after {
                animation: growLine 0.3s ease forwards;
              }
              /* Brand brown #af8564 — note: this is 3.3:1 contrast on white,
                 below WCAG AA's 4.5:1 for normal text (was #916e53, a 4.5:1
                 variant, before this test). */
              .menu-item.active,
              .menu-item:hover {
                color: #af8564;
              }
              .menu-item.active {
                font-weight: 600;
              }
              .menu-text {
                display: inline;
              }
              .menu-item.active .menu-text,
              .menu-item:hover .menu-text {
                color: #af8564;
              }
              /* Nav Style 2 (see local-storage/headerNavStyle.js, toggled from
                 the admin CMS's Settings page) — swaps the growing-underline
                 hover/active indicator for a solid brand-brown pill, beveled
                 like the admin CMS's .btn-primary buttons (inset top
                 highlight + inset bottom shadow + a soft drop shadow so it
                 reads as a raised, physical button rather than a flat tint).
                 Scoped to .nav-toplevel only — the white-background dropdown/
                 mega-menu panels underneath keep the underline treatment
                 regardless of this setting. Higher specificity here (plus
                 !important on color) intentionally wins over both the base
                 .menu-item hover color and the transparent-header override
                 below, since the pill needs white text in every header state. */
              .nav-style-style2 .nav-toplevel::after {
                content: none;
              }
              /* transition: none — background-image (the gradient) can't be
                 smoothly interpolated by any browser, so animating it (or the
                 Tailwind transition-colors class already on every .menu-item)
                 caused color/background to visibly desync: text would fade
                 toward white first, then the pill would pop in a beat later.
                 Switching instantly avoids that mismatch, especially when
                 moving the mouse quickly across several nav items. */
              .nav-style-style2 .menu-item {
                transition: none;
              }
              .nav-style-style2 .nav-toplevel {
                padding: 7px 14px;
                border-radius: 6px;
              }
              .nav-style-style2 .nav-toplevel:hover,
              .nav-style-style2 .nav-toplevel.active {
                background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
                color: #ffffff !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -1px 0 rgba(0,0,0,0.12),
                  0 2px 6px rgba(139,94,60,0.22);
              }
              .nav-style-style2 .nav-toplevel:hover .menu-text,
              .nav-style-style2 .nav-toplevel.active .menu-text {
                color: #ffffff !important;
              }
              /* Same Style 2 treatment for the white-background dropdown/
                 mega-menu panels — mega-menu columns, the Support/About Us
                 submenu, and its nested level-2 submenu. Excludes
                 .nav-toplevel (already handled above) via :not() rather than
                 duplicating the rule. Their existing Tailwind padding/
                 rounded-lg stays as-is — only background/color/shadow change
                 here, so nesting indentation (px-2/px-4/px-6/px-8 per level)
                 is untouched. */
              .nav-style-style2 .menu-item:not(.nav-toplevel)::after {
                content: none;
              }
              .nav-style-style2 .menu-item:not(.nav-toplevel):hover,
              .nav-style-style2 .menu-item:not(.nav-toplevel).active {
                background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
                color: #ffffff !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -1px 0 rgba(0,0,0,0.12),
                  0 2px 6px rgba(139,94,60,0.22);
              }
              .nav-style-style2 .menu-item:not(.nav-toplevel):hover .menu-text,
              .nav-style-style2 .menu-item:not(.nav-toplevel).active .menu-text {
                color: #ffffff !important;
              }
              /* Same pill treatment on the language toggle and search icon —
                 transition: none for the same reason as .menu-item above.
                 Lang toggle gets the exact same padding as .nav-toplevel so
                 the two pills are visibly the same size. The search icon has
                 no text, just an <i>, and Tailwind's text-lg utility sets a
                 1.75rem line-height on it — taller than the glyph itself —
                 which made its padding box read as a vertical rectangle
                 instead of a square; fixed with an explicit flex-centered
                 square instead of relying on padding + line-height.
                 Scoped to [aria-label="Search"] specifically — .header-icon-btn
                 is shared with the mobile hamburger toggle (md:hidden), and an
                 unscoped rule here was overriding its display/sizing at every
                 viewport width, breaking its responsive show/hide. */
              .nav-style-style2 .header-lang-toggle {
                padding: 7px 14px;
                border-radius: 6px;
                transition: none;
              }
              .nav-style-style2 .header-icon-btn[aria-label="Search"] {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                padding: 0;
                border-radius: 6px;
                transition: none;
              }
              .nav-style-style2 .header-lang-toggle:hover,
              .nav-style-style2 .header-icon-btn[aria-label="Search"]:hover {
                background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
                color: #ffffff !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -1px 0 rgba(0,0,0,0.12),
                  0 2px 6px rgba(139,94,60,0.22);
              }
              /* Transparent header sits over a dark scrim (see Header.jsx's
                 inline gradient) — top-level nav text, the language toggle,
                 and the search/hamburger icons need to flip to white here,
                 and STAY white on hover/active (the existing underline
                 growLine effect below is the only hover/active indicator —
                 no color swap). Scoped to .nav-toplevel (not the shared
                 .menu-item class) so the white-background dropdown/mega-menu
                 panels underneath — which also use .menu-item — are never
                 affected; they keep their normal dark-on-white styling. */
              .header--transparent .nav-toplevel,
              .header--transparent .nav-toplevel .menu-text,
              .header--transparent .nav-toplevel.active,
              .header--transparent .nav-toplevel:hover,
              .header--transparent .nav-toplevel.active .menu-text,
              .header--transparent .nav-toplevel:hover .menu-text,
              .header--transparent .header-lang-toggle,
              .header--transparent .header-icon-btn,
              .header--transparent .header-icon-btn:hover {
                color: #ffffff;
              }
              .header-lang { position: relative; }
              .header-lang-toggle {
                display: flex;
                align-items: center;
                gap: 6px;
                background: transparent;
                border: none;
                cursor: pointer;
                color: rgb(51, 51, 51);
                font-family: 'Montserrat', sans-serif;
                font-size: 14px;
                font-weight: 500;
                padding: 6px 4px;
                transition: color 0.2s ease;
              }
              .header-lang-toggle:hover { color: #916e53; }
              .header-lang-code { letter-spacing: 0.03em; }
              .header-lang-flag {
                display: inline-flex;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
                box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
              }
              .header-lang-flag svg { width: 100%; height: 100%; display: block; }
              .header-lang-flag-sm {
                display: inline-flex;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
                margin-right: 8px;
                box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
              }
              .header-lang-flag-sm svg { width: 100%; height: 100%; display: block; }
              .header-lang-menu {
                position: absolute;
                right: 0;
                top: calc(100% + 10px);
                min-width: 160px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(0, 0, 0, 0.06);
                padding: 6px;
                list-style: none;
                margin: 0;
                z-index: 50;
              }
              .header-lang-option {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 8px 10px;
                border-radius: 8px;
                background: transparent;
                border: none;
                cursor: pointer;
                text-align: left;
                font-size: 13px;
                color: #333;
                transition: background-color 0.15s ease;
              }
              .header-lang-option:hover { background: #f5f0ec; }
              .header-lang-option.is-active { background: #af8564; color: #fff; }
              /* Nav Style 2 — the language dropdown panel (EN/FI/DE) wasn't
                 covered by the .menu-item bevel rules above (it's a separate
                 component, HeaderLanguageSwitcher.jsx, that doesn't use the
                 .menu-item class), so it stayed flat/grayish. Bevel the panel
                 itself plus give each option the same brown-pill hover/active
                 treatment as every other dropdown in Style 2. */
              .nav-style-style2 .header-lang-menu {
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,0.6),
                  0 10px 30px rgba(0,0,0,0.2);
              }
              .nav-style-style2 .header-lang-option {
                transition: none;
              }
              .nav-style-style2 .header-lang-option:hover,
              .nav-style-style2 .header-lang-option.is-active {
                background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
                color: #ffffff !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -1px 0 rgba(0,0,0,0.12),
                  0 2px 6px rgba(139,94,60,0.22);
              }
              /* Search suggestion dropdown (SearchBar.jsx's ResultRow) — same
                 bevel family as everything above. Not gated behind
                 .nav-style-style2 since the search UI is independent of the
                 nav hover-style toggle. */
              .search-result-item {
                transition: none;
              }
              .search-result-item:hover,
              .search-result-item.is-active {
                background: linear-gradient(135deg, #af8564 0%, #c9a97e 100%);
                color: #ffffff !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,0.3),
                  inset 0 -1px 0 rgba(0,0,0,0.12),
                  0 2px 6px rgba(139,94,60,0.22);
              }
              .header-lang-mobile {
                padding: 12px 16px;
                font-family: 'Montserrat', sans-serif;
              }
              .header-lang-mobile-label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #916e53;
                margin-bottom: 8px;
              }
              .header-lang-mobile-options {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
              }
              .header-lang-mobile-options .header-lang-option {
                width: auto;
                border: 1px solid rgba(0, 0, 0, 0.08);
              }
            `}</style>
          </div>

          {/* Mobile toggle */}
          <button
            ref={mobileToggleRef}
            className="header-icon-btn md:hidden text-2xl font-bold bg-transparent border-none cursor-pointer text-[rgb(51,51,51)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <i className="fa-solid fa-bars" aria-hidden="true"></i>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div ref={mobileMenuRef} className="md:hidden bg-white shadow-lg">
            {navItems.map((item) => (
              <div key={item.name} className="border-b border-gray-200">
                {item.submenu ? (
                  <div
                    className={`menu-item w-full flex items-center justify-between text-[15px] font-normal transition-colors text-gray-800 ${
                      isActive(item) ? "active" : ""
                    }`}
                  >
                    {/* Label navigates straight to the item's own page;
                        only the chevron button opens/closes the dropdown —
                        previously the whole row was one button that just
                        toggled, so there was no way to reach e.g. /sauna
                        itself from mobile without going through a submenu
                        link. */}
                    <Link
                      to={item.path}
                      className="menu-text flex-1 px-4 py-3"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <button
                      className="px-4 py-3"
                      aria-label={`${hoveredMenu === item.name ? "Collapse" : "Expand"} ${item.name} submenu`}
                      onClick={() =>
                        setHoveredMenu(
                          hoveredMenu === item.name ? null : item.name,
                        )
                      }
                    >
                      <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </button>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`menu-item w-full px-4 py-3 flex items-center text-[15px] font-normal transition-colors text-gray-800 ${
                      isActive(item)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}


                {/* Mobile Submenu — Level 1 (Support, About Us) */}
                {item.submenu && hoveredMenu === item.name && (
                  <div className="bg-gray-50">
                    {item.submenu.map((sub) =>
                      sub.submenu ? (
                        <div
                          key={sub.name}
                          className="border-t border-gray-200"
                        >
                          {/* Same label/chevron split as the top-level row
                              above: tapping the name navigates to sub.path,
                              only the chevron expands the level-2 list. */}
                          <div
                            className={`menu-item w-full flex items-center justify-between text-[13px] font-normal transition-colors text-gray-800 ${
                              isSubActive(sub) ? "active" : ""
                            }`}
                          >
                            {sub.path ? (
                              <Link
                                to={sub.path}
                                className="flex-1 px-6 py-2"
                                onClick={() => setMobileOpen(false)}
                              >
                                {sub.name}
                              </Link>
                            ) : (
                              <span className="flex-1 px-6 py-2">{sub.name}</span>
                            )}
                            <button
                              className="px-6 py-2"
                              aria-label={`${hoveredSubmenu === sub.name ? "Collapse" : "Expand"} ${sub.name} submenu`}
                              onClick={() =>
                                setHoveredSubmenu(
                                  hoveredSubmenu === sub.name ? null : sub.name,
                                )
                              }
                            >
                              <i className="fa-solid fa-chevron-down text-[9px]"></i>
                            </button>
                          </div>

                          {/* Mobile Submenu — Level 2 */}
                          {hoveredSubmenu === sub.name && (
                            <div className="bg-gray-100">
                              {sub.submenu.map((item2) => (
                                <Link
                                  key={item2.name || item2}
                                  to={item2.path || "#"}
                                  className={`menu-item block px-8 py-2 text-[12px] transition-colors text-gray-800 ${
                                    isSub2Active(item2)
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {item2.name || item2}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          key={sub.name || sub}
                          to={sub.path || "#"}
                          className={`menu-item block px-6 py-2 text-[13px] transition-colors text-gray-800 ${
                            isSubActive(sub)
                              ? "active"
                              : ""
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {sub.name || sub}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            <HeaderLanguageSwitcher variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </header>
    </>
  );
}
