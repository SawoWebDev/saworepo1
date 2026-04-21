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
  const [forceMobile, setForceMobile] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const lastScrollY = useRef(0);
  const navRef = useRef(null);
  const menuTimeout = useRef(null);
  const subMenuTimeout = useRef(null);
  const mobileMenuRef = useRef(null);

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
        { name: "Sauna Accessories", path: menuPaths.sauna.accessories },
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
        { name: "Accessories", path: menuPaths.steam.accessories },
      ],
    },
    { name: "Infrared", path: menuPaths.infrared },
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

  // Force mobile if nav overflows
  useEffect(() => {
    const checkWrap = () => {
      if (!navRef.current) return;
      const isWrapped = navRef.current.scrollWidth > navRef.current.clientWidth;
      setForceMobile(isWrapped);
      if (isWrapped) setMobileOpen(false);
    };
    checkWrap();
    window.addEventListener("resize", checkWrap);
    return () => window.removeEventListener("resize", checkWrap);
  }, []);

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
      {/* Preload Montserrat font */}
      <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;400;500;700&display=swap"
        as="style"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;400;500;700&display=swap"
        rel="stylesheet"
      />
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
          {!forceMobile && (
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
                  {item.submenu ? (
                    item.path ? (
                      <Link
                        to={item.path}
                        className={`flex items-center gap-1 transition-colors ${
                          isActive(item)
                            ? "text-[#af8564] font-semibold"
                            : "hover:text-[#af8564]"
                        }`}
                      >
                        {item.name}{" "}
                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                      </Link>
                    ) : (
                      <button
                        className={`flex items-center gap-1 transition-colors ${
                          isActive(item)
                            ? "text-[#af8564] font-semibold"
                            : "hover:text-[#af8564]"
                        }`}
                      >
                        {item.name}{" "}
                        <i className="fa-solid fa-chevron-down text-[10px]"></i>
                      </button>
                    )
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-1 transition-colors ${
                        isActive(item)
                          ? "text-[#af8564] font-semibold"
                          : "hover:text-[#af8564]"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Submenu — Level 1 */}
                  {item.submenu && hoveredMenu === item.name && (
                    <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl min-w-[220px] z-50 py-3 px-2 border border-gray-100">
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
                                className={`w-full text-left px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg flex justify-between items-center ${
                                  isSubActive(sub)
                                    ? "bg-[#af8564] text-white font-semibold"
                                    : "text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white"
                                }`}
                              >
                                {sub.name}{" "}
                                <i className="fa-solid fa-chevron-right text-[9px]"></i>
                              </Link>
                            ) : (
                              <button
                                className={`w-full text-left px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg flex justify-between items-center ${
                                  isSubActive(sub)
                                    ? "bg-[#af8564] text-white font-semibold"
                                    : "text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white"
                                }`}
                              >
                                {sub.name}{" "}
                                <i className="fa-solid fa-chevron-right text-[9px]"></i>
                              </button>
                            )}

                            {/* Submenu — Level 2 */}
                            {hoveredSubmenu === sub.name && (
                              <div className="absolute top-0 left-full ml-1 bg-white rounded-xl shadow-xl min-w-[180px] z-50 py-3 px-2 border border-gray-100">
                                {sub.submenu.map((item2) => (
                                  <Link
                                    key={item2.name || item2}
                                    to={item2.path || "#"}
                                    className={`block px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg ${
                                      isSub2Active(item2)
                                        ? "bg-[#af8564] text-white font-semibold"
                                        : "text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white"
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
                            className={`block px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg ${
                              isSubActive(sub)
                                ? "bg-[#af8564] text-white font-semibold"
                                : "text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white"
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
              className="ml-auto pr-2 md:pr-4 flex items-center transition-all duration-300"
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
            `}</style>
          </div>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden text-2xl font-bold bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div ref={mobileMenuRef} className="md:hidden bg-white shadow-lg">
            {navItems.map((item) => (
              <div key={item.name} className="border-b border-gray-200">
                {/* Top-level toggle (FIXED) */}
                {item.submenu ? (
                  <button
                    className={`w-full px-4 py-3 flex justify-between items-center text-[15px] font-normal transition-colors ${
                      isActive(item)
                        ? "bg-[#af8564] text-white font-semibold"
                        : "text-gray-800 hover:bg-[#af8564] hover:text-white"
                    }`}
                    onClick={() =>
                      setHoveredMenu(
                        hoveredMenu === item.name ? null : item.name,
                      )
                    }
                  >
                    {item.name}{" "}
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`w-full px-4 py-3 flex items-center text-[15px] font-normal transition-colors ${
                      isActive(item)
                        ? "bg-[#af8564] text-white font-semibold"
                        : "text-gray-800 hover:bg-[#af8564] hover:text-white"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}

                {/* Mobile Submenu — Level 1 */}
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
                            className={`w-full px-6 py-2 flex justify-between items-center text-[13px] font-normal transition-colors ${
                              isSubActive(sub)
                                ? "bg-[#af8564] text-white font-semibold"
                                : "text-gray-800 hover:bg-[#af8564] hover:text-white"
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
                                  className={`block px-8 py-2 text-[12px] transition-colors ${
                                    isSub2Active(item2)
                                      ? "bg-[#af8564] text-white font-semibold"
                                      : "text-gray-800 hover:bg-[#af8564] hover:text-white"
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
                          className={`block px-6 py-2 text-[13px] transition-colors ${
                            isSubActive(sub)
                              ? "bg-[#af8564] text-white font-semibold"
                              : "text-gray-800 hover:bg-[#af8564] hover:text-white"
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
