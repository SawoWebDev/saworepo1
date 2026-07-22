'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/translation/navigation';
import paths from '@/translation/routing';
import SearchBar from './SearchBar';
import HeaderLanguageSwitcher from './HeaderLanguageSwitcher';

export default function Header({ switcherLocales }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const [hidden, setHidden] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const lastScrollY = useRef(0);
  const navRef = useRef(null);
  const menuTimeout = useRef(null);
  const subMenuTimeout = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  const navItems = [
    { name: t('home'), path: paths.home },
    {
      name: t('products'),
      path: paths.products,
      megaMenu: true,
      megaColumns: [
        {
          groupHeading: t('groups.sauna'),
          columns: [
            {
              items: [
                { name: t('items.wallMounted'), path: paths.sauna.heaters.wallMounted },
                { name: t('items.tower'), path: paths.sauna.heaters.tower },
                { name: t('items.stone'), path: paths.sauna.heaters.stone },
                { name: t('items.floor'), path: paths.sauna.heaters.floor },
                { name: t('items.combi'), path: paths.sauna.heaters.combi },
                { name: t('items.dragonfire'), path: paths.sauna.heaters.dragonfire },
              ],
            },
            {
              items: [
                { name: t('items.saunaHeaters'), path: paths.sauna.heaters.parent, matchExact: true },
                { name: t('items.saunaControls'), path: paths.sauna.controls },
                { name: t('items.saunaAccessories'), path: paths.sauna.accessories.parent },
                { name: t('items.saunaRooms'), path: paths.sauna.rooms, matchExact: true },
                { name: t('items.interiorDesigns'), path: paths.sauna.interiorDesigns, matchExact: true },
                { name: t('items.woodPanels'), path: paths.sauna.woodPanels, matchExact: true },
              ],
            },
          ],
        },
        {
          heading: t('groups.steam'),
          items: [
            { name: t('items.steamGenerators'), path: paths.steam.generators },
            { name: t('items.steamControls'), path: paths.steam.controls },
            { name: t('items.steamAccessories'), path: paths.steam.accessories },
          ],
        },
        {
          heading: t('groups.infrared'),
          items: [{ name: t('items.infrared'), path: paths.infrared }],
        },
      ],
    },
    {
      name: t('support'),
      path: paths.support.parent,
      submenu: [
        { name: t('items.faq'), path: paths.support.faq },
        { name: t('items.saunaCalculator'), path: paths.support.saunaCalculator },
        { name: t('items.userManuals'), path: paths.support.manuals },
        { name: t('items.productCatalogue'), path: paths.support.catalogue },
      ],
    },
    {
      name: t('aboutUs'),
      path: paths.about.parent,
      submenu: [
        { name: t('items.latestNews'), path: paths.about.news },
        { name: t('items.sustainability'), path: paths.about.sustainability },
        { name: t('items.careers'), path: paths.careers },
      ],
    },
    { name: t('contactUs'), path: paths.contact },
  ];

  const isActive = (item) => {
    if (item.megaMenu && item.megaColumns) {
      return item.megaColumns.some((col) => {
        if (col.columns) {
          return col.columns.some((subCol) => {
            const allItems = subCol.items || [];
            return allItems.some(
              (i) => i.path && (i.matchExact ? pathname === i.path : pathname.startsWith(i.path))
            );
          });
        }
        const allItems = col.items || [];
        return allItems.some((i) => i.path && pathname.startsWith(i.path));
      });
    }
    if (item.path && pathname === item.path) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => sub.path && pathname.startsWith(sub.path));
    }
    return false;
  };
  const isSubActive = (sub) => !!(sub.path && pathname.startsWith(sub.path));

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setHidden(currentScroll > lastScrollY.current && currentScroll > 80);
      lastScrollY.current = currentScroll;
      if (mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

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
    <header
      className={`fixed top-0 left-0 w-full bg-white z-50 shadow-md transition-transform duration-500 font-sans ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ fontFamily: `"Montserrat"` }}
    >
      <div className="w-full flex items-center justify-between py-3 px-6 md:px-8">
        <Link href="/" className="flex-shrink-0 pl-2">
          <img
            src="/assets/SAWO-logo.webp"
            alt="SAWO-logo"
            className="h-14 md:h-20 object-contain transition-all duration-300"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav ref={navRef} className="flex gap-6 whitespace-nowrap text-[16px] font-normal text-[rgb(51,51,51)]">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => handleMouseEnterMenu(item.name)}
                onMouseLeave={handleMouseLeaveMenu}
              >
                {item.megaMenu ? (
                  <Link
                    href={item.path}
                    className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${isActive(item) ? 'active' : ''}`}
                  >
                    <span className="menu-text">{item.name}</span>{' '}
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </Link>
                ) : item.submenu ? (
                  <Link
                    href={item.path}
                    className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${isActive(item) ? 'active' : ''}`}
                  >
                    {item.name} <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </Link>
                ) : (
                  <Link
                    href={item.path}
                    className={`menu-item flex items-center gap-1 transition-colors text-[rgb(51,51,51)] ${isActive(item) ? 'active' : ''}`}
                  >
                    {item.name}
                  </Link>
                )}

                {item.megaMenu && hoveredMenu === item.name && (
                  <div
                    className="absolute top-full mt-2 bg-white rounded-xl shadow-2xl z-50 py-4 px-4 border border-gray-100 flex gap-0"
                    style={{ minWidth: 'min(90vw, 720px)', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    {item.megaColumns.map((col, ci) => (
                      col.groupHeading ? (
                        <div key={ci} className={`flex-1 ${ci < item.megaColumns.length - 1 ? 'border-r border-gray-100' : ''}`}>
                          <p className="text-[12px] font-bold uppercase tracking-widest text-[#af8564] mb-3 pr-4">
                            {col.groupHeading}
                          </p>
                          <div className="flex gap-0">
                            <div className="flex-1 px-4">
                              {col.columns[0].items.map((it) => (
                                <Link
                                  key={it.path}
                                  href={it.path}
                                  onClick={() => setHoveredMenu(null)}
                                  className={`menu-item block px-2 py-1.5 text-[13px] rounded-lg transition-colors text-[rgb(51,51,51)] ${
                                    (it.matchExact ? pathname === it.path : pathname.startsWith(it.path)) ? 'active' : ''
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
                                  href={it.path}
                                  onClick={() => setHoveredMenu(null)}
                                  className={`menu-item block px-2 py-1.5 text-[13px] rounded-lg transition-colors text-[rgb(51,51,51)] ${
                                    (it.matchExact ? pathname === it.path : pathname.startsWith(it.path)) ? 'active' : ''
                                  }`}
                                >
                                  {it.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={ci} className={`flex-1 px-4 ${ci < item.megaColumns.length - 1 ? 'border-r border-gray-100' : ''}`}>
                          <p className="text-[12px] font-bold uppercase tracking-widest text-[#af8564] mb-3">{col.heading}</p>
                          {col.items.map((it) => (
                            <Link
                              key={it.path}
                              href={it.path}
                              onClick={() => setHoveredMenu(null)}
                              className={`menu-item block px-2 py-1.5 text-[13px] rounded-lg transition-colors text-[rgb(51,51,51)] ${
                                pathname.startsWith(it.path) ? 'active' : ''
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

                {item.submenu && hoveredMenu === item.name && (
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl min-w-[220px] z-50 py-3 px-2 border border-gray-100">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.path || '#'}
                        className={`menu-item block px-4 py-2.5 text-[13px] font-normal transition-colors rounded-lg text-[rgb(51,51,51)] ${
                          isSubActive(sub) ? 'active' : ''
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <HeaderLanguageSwitcher locales={switcherLocales} />

          <div className="ml-auto pr-2 md:pr-4 flex items-center gap-3" id="search-container" ref={searchContainerRef}>
            {searchOpen ? (
              <div className="w-40 sm:w-44 md:w-48 lg:w-56">
                <SearchBar onClose={() => setSearchOpen(false)} />
              </div>
            ) : (
              <button
                className="p-2 hover:text-[#af8564] transition-colors text-[rgb(51,51,51)]"
                aria-label={t('search')}
                onClick={() => setSearchOpen(true)}
              >
                <i className="fa-solid fa-search text-lg"></i>
              </button>
            )}
          </div>
        </div>

        <button
          className="md:hidden text-2xl font-bold bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={mobileOpen}
        >
          <i className="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
      </div>

      {mobileOpen && (
        <div ref={mobileMenuRef} className="md:hidden bg-white shadow-lg">
          {navItems.map((item) => (
            <div key={item.name} className="border-b border-gray-200">
              {item.submenu || item.megaMenu ? (
                <button
                  className={`menu-item w-full px-4 py-3 flex justify-between items-center text-[15px] font-normal transition-colors text-gray-800 ${
                    isActive(item) ? 'active bg-[#af8564] text-white font-semibold' : ''
                  }`}
                  onClick={() => setHoveredMenu(hoveredMenu === item.name ? null : item.name)}
                >
                  <span>{item.name}</span> <i className="fa-solid fa-chevron-down text-[10px]"></i>
                </button>
              ) : (
                <Link
                  href={item.path}
                  className={`menu-item w-full px-4 py-3 flex items-center text-[15px] font-normal transition-colors text-gray-800 ${
                    isActive(item) ? 'active' : ''
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              )}

              {(item.submenu || item.megaMenu) && hoveredMenu === item.name && (
                <div className="bg-gray-50">
                  {(item.megaColumns
                    ? item.megaColumns.flatMap((c) => (c.columns ? c.columns.flatMap((sc) => sc.items) : c.items))
                    : item.submenu
                  ).map((it) => (
                    <Link
                      key={it.path}
                      href={it.path || '#'}
                      onClick={() => setMobileOpen(false)}
                      className={`menu-item block px-6 py-2 text-[13px] transition-colors text-gray-800 ${
                        pathname.startsWith(it.path) ? 'active' : ''
                      }`}
                    >
                      {it.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <HeaderLanguageSwitcher
            locales={switcherLocales}
            variant="mobile"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
