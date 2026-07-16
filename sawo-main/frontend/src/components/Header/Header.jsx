import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import sLogo from "../../assets/SAWO-logo.webp";
import menuPaths from "../../menuPaths";
import SearchBar from "./SearchBar";

export default function Header() {
  const location = useLocation();

  const [hidden, setHidden] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const lastScrollY = useRef(0);
  const navRef = useRef(null);
  const menuTimeout = useRef(null);
  const subMenuTimeout = useRef(null);
  const mobileMenuRef = useRef(null);

  const navItems = [
    { name: "Home", path: menuPaths.home },
    {
      name: "Products",
      path: menuPaths.products,
      megaMenu: true,
      megaColumns: [
        {
          groupHeading: "Sauna",
          columns: [
            {
              items: [
                { name: "Wall-Mounted", path: menuPaths.sauna.heaters.wallMounted },
                { name: "Tower", path: menuPaths.sauna.heaters.tower },
                { name: "Stone", path: menuPaths.sauna.heaters.stone },
                { name: "Floor", path: menuPaths.sauna.heaters.floor },
                { name: "Combi", path: menuPaths.sauna.heaters.combi },
                { name: "Dragonfire", path: menuPaths.sauna.heaters.dragonfire },
              ],
            },
            {
              items: [
                { name: "Sauna Heaters", path: menuPaths.sauna.heaters.parent, matchExact: true },
                { name: "Sauna Controls", path: menuPaths.sauna.controls },
                { name: "Sauna Accessories", path: menuPaths.sauna.accessories.parent },
                { name: "Sauna Rooms", path: menuPaths.sauna.rooms, matchExact: true },
                { name: "Interior Designs", path: menuPaths.sauna.interiorDesigns, matchExact: true },
                { name: "Wood Panels & Timbers", path: menuPaths.sauna.woodPanels, matchExact: true },
              ],
            },
          ],
        },
        {
          heading: "Steam",
          items: [
            { name: "Steam Generators", path: menuPaths.steam.generators },
            { name: "Steam Controls", path: menuPaths.steam.controls },
            { name: "Steam Accessories", path: menuPaths.steam.accessories },
          ],
        },
        {
          heading: "Infrared",
          items: [{ name: "Infrared", path: menuPaths.infrared }],
        },
      ],
    },
    {
      name: "Support",
      path: menuPaths.support.parent,
      submenu: [
        { name: "Frequently Asked Questions", path: menuPaths.support.faq },
        { name: "Sauna Calculator", path: menuPaths.support.saunaCalculator },
        { name: "User Manuals", path: menuPaths.support.manuals },
        { name: "Product Catalogue", path: menuPaths.support.catalogue },
      ],
    },
    {
      name: "About Us",
      path: menuPaths.about.parent,
      submenu: [
        { name: "Latest News", path: menuPaths.about.news },
        { name: "Sustainability", path: menuPaths.about.sustainability },
        { name: "Careers", path: menuPaths.careers },
      ],
    },
    { name: "Contact Us", path: menuPaths.contact },
  ];

  // --- Active helpers ---
  const isActive = (item) => {
    if (item.megaMenu && item.megaColumns) {
      return item.megaColumns.some((col) => {
        // Handle grouped columns (Sauna with 2 sub-columns)
        if (col.columns) {
          return col.columns.some((subCol) => {
            const allItems = subCol.items || [];
            return allItems.some(
              (i) =>
                (i.path && (i.matchExact ? location.pathname === i.path : location.pathname.startsWith(i.path))) ||
                (i.children && i.children.some((c) => c.path && location.pathname.startsWith(c.path)))
            );
          });
        }
        // Handle regular columns (Steam, Infrared)
        const allItems = col.sections
          ? col.sections.flatMap((s) => s.items)
          : col.items || [];
        return allItems.some(
          (i) =>
            (i.path && location.pathname.startsWith(i.path)) ||
            (i.children && i.children.some((c) => c.path && location.pathname.startsWith(c.path)))
        );
      });
    }
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

  // Hide header on scroll down + close mobile menu
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setHidden(currentScroll > lastScrollY.current && currentScroll > 80);
      lastScrollY.current = currentScroll;
      if (mobileOpen) setMobileOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileOpen]);


  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
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

  return (
    <>
      {/* Montserrat is loaded once in public/index.html */}
      <header
        className={`fixed top-0 left-0 w-full bg-white z-50 shadow-md transition-transform duration-500 font-sans ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{ fontFamily: `"Montserrat"` }}
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
          <div className="hidden md:flex items-center gap-6">
              <nav
                ref={navRef}
                className="flex gap-6 whitespace-nowrap text-[16px] font-normal text-[rgb(51,51,51)]"
              >
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterMenu(item.name)}
                  onMouseLeave={handleMouseLeaveMenu}
                >
                  {/* Top-level link or button */}
                  {item.megaMenu ? (
                    <Link
                      to={item.path}
                      className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
                        isActive(item) ? "active" : ""
                      }`}
                    >
                      <span className="menu-text">{item.name}</span>{" "}
                      <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </Link>
                  ) : item.submenu ? (
                    item.path ? (
                      <Link
                        to={item.path}
                        className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
                          isActive(item) ? "active" : ""
                        }`}
                      >
                        {item.name}{" "}
                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                      </Link>
                    ) : (
                      <button
                        className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
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
                      className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${
                        isActive(item) ? "active" : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Mega Menu — Products */}
                  {item.megaMenu && hoveredMenu === item.name && (
                    <div
                      className="absolute top-full mt-2 bg-white rounded-xl shadow-2xl z-50 py-4 px-4 border border-gray-100 flex gap-0"
                      style={{ minWidth: "min(90vw, 720px)", left: "50%", transform: "translateX(-50%)" }}
                    >
                      {item.megaColumns.map((col, ci) => (
                        col.groupHeading ? (
                          <div key={ci} className={`flex-1 ${ci < item.megaColumns.length - 1 ? "border-r border-gray-100" : ""}`}>
                            <p className="text-[12px] font-bold uppercase tracking-widest text-[#af8564] mb-3 pr-4">
                              {col.groupHeading}
                            </p>
                            <div className="flex gap-0">
                              <div className="flex-1 px-4">
                                {col.columns[0].items.map((it) => (
                                  <Link
                                    key={it.path}
                                    to={it.path}
                                    onClick={() => setHoveredMenu(null)}
                                    className={`menu-item block px-2 py-1.5 text-[13px] rounded-lg transition-colors text-[rgb(51,51,51)] ${
                                      (it.matchExact ? location.pathname === it.path : location.pathname.startsWith(it.path))
                                        ? "active"
                                        : ""
                                    }`}
                                  >
                                    {it.name}
                                  </Link>
                                ))}
                              </div>
                              <div className="flex-1 px-4">
                                {col.columns[1].items.map((it) => (
                                  <Link
                                    key={it.path}
                                    to={it.path}
                                    onClick={() => setHoveredMenu(null)}
                                    className={`menu-item block px-2 py-1.5 text-[13px] rounded-lg transition-colors text-[rgb(51,51,51)] ${
                                      (it.matchExact ? location.pathname === it.path : location.pathname.startsWith(it.path))
                                        ? "active"
                                        : ""
                                    }`}
                                  >
                                    {it.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={ci}
                            className={`flex-1 px-4 ${ci < item.megaColumns.length - 1 ? "border-r border-gray-100" : ""}`}
                          >
                            <p className="text-[12px] font-bold uppercase tracking-widest text-[#af8564] mb-3">
                              {col.heading}
                            </p>
                            {col.items.map((it) => (
                              <Link
                                key={it.path}
                                to={it.path}
                                onClick={() => setHoveredMenu(null)}
                                className={`menu-item block px-2 py-1.5 text-[13px] rounded-lg transition-colors text-[rgb(51,51,51)] ${
                                  location.pathname.startsWith(it.path)
                                    ? "active"
                                    : ""
                                }`}
                              >
                                {it.name}
                              </Link>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
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
                  className="p-2 hover:text-[#af8564] transition-colors text-[rgb(51,51,51)]"
                  aria-label="Search"
                  style={{
                    animation: searchExpanded ? 'none' : 'slideInLeft 0.3s ease-out'
                  }}
                >
                  <i className="fa-solid fa-search text-lg"></i>
                </button>
              )}

            </div>

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
              /* #916e53 is the 4.5:1-contrast variant of the #af8564 brand brown
                 (the original is 3.3:1 on white and fails WCAG AA / Lighthouse). */
              .menu-item.active,
              .menu-item:hover {
                color: #916e53;
              }
              .menu-item.active {
                font-weight: 600;
              }
              .menu-text {
                display: inline;
              }
              .menu-item.active .menu-text,
              .menu-item:hover .menu-text {
                color: #916e53;
              }
            `}</style>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-2xl font-bold bg-transparent border-none cursor-pointer"
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
                {/* Products row — split label + chevron */}
                {item.megaMenu ? (
                  <div className={`w-full flex items-center justify-between ${isActive(item) ? "bg-[#af8564] text-white font-semibold" : "text-gray-800"}`}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 px-4 py-3 text-[15px] font-normal"
                    >
                      {item.name}
                    </Link>
                    <button
                      className="px-4 py-3"
                      onClick={() => setHoveredMenu(hoveredMenu === item.name ? null : item.name)}
                    >
                      <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </button>
                  </div>
                ) : item.submenu ? (
                  <button
                    className={`menu-item w-full px-4 py-3 flex justify-between items-center text-[15px] font-normal transition-colors text-gray-800 ${
                      isActive(item)
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setHoveredMenu(
                        hoveredMenu === item.name ? null : item.name,
                      )
                    }
                  >
                    <span className="menu-text">{item.name}</span>{" "}
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
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

                {/* Mobile Mega Menu accordion — Products */}
                {item.megaMenu && hoveredMenu === item.name && (
                  <div className="bg-gray-50">
                    {item.megaColumns.map((col, ci) => (
                      col.groupHeading ? (
                        <div key={ci} className="border-t border-gray-200 px-4 py-2">
                          <p className="text-[12px] font-bold uppercase tracking-widest text-[#af8564] mb-3">
                            {col.groupHeading}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              {col.columns[0].items.map((it) => (
                                <Link
                                  key={it.path}
                                  to={it.path}
                                  onClick={() => setMobileOpen(false)}
                                  className={`menu-item block px-3 py-2 text-[13px] transition-colors text-gray-800 ${
                                    (it.matchExact ? location.pathname === it.path : location.pathname.startsWith(it.path))
                                      ? "active"
                                      : ""
                                  }`}
                                >
                                  {it.name}
                                </Link>
                              ))}
                            </div>
                            <div>
                              {col.columns[1].items.map((it) => (
                                <Link
                                  key={it.path}
                                  to={it.path}
                                  onClick={() => setMobileOpen(false)}
                                  className={`menu-item block px-3 py-2 text-[13px] transition-colors text-gray-800 ${
                                    (it.matchExact ? location.pathname === it.path : location.pathname.startsWith(it.path))
                                      ? "active"
                                      : ""
                                  }`}
                                >
                                  {it.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={ci} className="border-t border-gray-200 px-4 py-2">
                          <p className="text-[12px] font-bold uppercase tracking-widest text-[#af8564] mb-2">
                            {col.heading}
                          </p>
                          {col.items.map((it) => (
                            <Link
                              key={it.path}
                              to={it.path}
                              onClick={() => setMobileOpen(false)}
                              className={`menu-item block px-6 py-2 text-[13px] transition-colors text-gray-800 ${
                                location.pathname.startsWith(it.path)
                                  ? "active"
                                  : ""
                              }`}
                            >
                              {it.name}
                            </Link>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
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
                          {/* Sub toggle (FIXED) */}
                          <button
                            className={`menu-item w-full px-6 py-2 flex justify-between items-center text-[13px] font-normal transition-colors text-gray-800 ${
                              isSubActive(sub)
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setHoveredSubmenu(
                                hoveredSubmenu === sub.name ? null : sub.name,
                              )
                            }
                          >
                            {sub.name}{" "}
                            <i className="fa-solid fa-chevron-down text-[9px]"></i>
                          </button>

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
          </div>
        )}
      </header>
    </>
  );
}
