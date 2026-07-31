// src/Administrator/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSession, clearSession } from "./supabase";
import { NAV_ITEMS, can } from "./permissions";
import { getRoleCapabilityOverrides } from "../local-storage/rolePermissions";
import PageHeader from "./PageHeader";
import CmsSearch from "./CmsSearch.jsx";
import logo from "./SAWO-logo.webp";
import "./admin.css";

// Order sections appear in — anything not listed falls back to alphabetical
// order after these, so a stray/unlisted section never disappears silently.
const SECTION_ORDER = ["Overview", "Catalog", "Insights", "System"];

function groupBySection(nav) {
  const groups = new Map();
  for (const item of nav) {
    const section = item.section || "Other";
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(item);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const ai = SECTION_ORDER.indexOf(a);
    const bi = SECTION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ session, dark, setDark, nav, handleLogout, location, open, onClose, collapsed, onToggleCollapse }) {
  const sections = groupBySection(nav);
  const initial = (session.user.username || "?").charAt(0).toUpperCase();

  // Whichever section holds the page currently open (in the iframe/route) —
  // recomputed from location on every render, so it's correct on first paint
  // (including a hard reload) without waiting on an effect.
  const activeSection = sections.find(([, items]) =>
    items.some(({ to }) => location.pathname.startsWith(to))
  )?.[0] ?? null;

  // Section dropdowns — collapsed = hidden. Every section starts closed
  // except the one holding the current page, so a reload never hides where
  // you are; the admin opens/closes the rest as needed.
  const [closedSections, setClosedSections] = useState(() => {
    const all = sections.map(([section]) => section);
    return new Set(activeSection ? all.filter(s => s !== activeSection) : all);
  });

  // If navigation lands on a different section (e.g. via search or a direct
  // link) while that section happens to be collapsed, reopen it — the active
  // page's dropdown should never be the one that's closed.
  useEffect(() => {
    if (!activeSection) return;
    setClosedSections(prev => {
      if (!prev.has(activeSection)) return prev;
      const next = new Set(prev);
      next.delete(activeSection);
      return next;
    });
  }, [activeSection]);

  const toggleSection = (section) => {
    setClosedSections(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar${open ? " sidebar-open" : ""}${collapsed ? " sidebar-collapsed" : ""}`}>
        {/* Desktop collapse/expand toggle */}
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`fa-solid fa-chevron-${collapsed ? "right" : "left"}`} />
        </button>

        {/* Logo — always the current app's own home page, whether that's
            localhost during dev or whichever domain this deploy is served
            from in production (not a hardcoded external URL). */}
        <div className="sidebar-logo">
          <a href={`${window.location.origin}/`} target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="SAWO" className="sidebar-logo-img" />
          </a>
        </div>

        {/* Nav, grouped by section (Catalog / Insights / System) — each
            section is a collapsible dropdown. */}
        <nav className="sidebar-nav">
          {sections.map(([section, items]) => {
            const isClosed = closedSections.has(section);
            return (
              <div className="sidebar-section" key={section}>
                <button
                  type="button"
                  className={`sidebar-section-label${section === activeSection ? " active" : ""}`}
                  onClick={() => toggleSection(section)}
                  aria-expanded={!isClosed}
                >
                  <span>{section}</span>
                  <i className={`fa-solid fa-chevron-down sidebar-section-chevron${isClosed ? " is-closed" : ""}`} />
                </button>
                <div className={`sidebar-section-items${isClosed ? " is-closed" : ""}`}>
                  {items.map(({ to, label, icon }) => {
                    const active = location.pathname.startsWith(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={active ? "active" : ""}
                        onClick={onClose}
                        title={label}
                      >
                        <i className={icon} />
                        <span className="sidebar-nav-label">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer — frosted user card with avatar + actions */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="sidebar-footer-id">
              <div className="sidebar-footer-avatar">{initial}</div>
              <div className="sidebar-footer-user">
                <div className="sidebar-footer-username">{session.user.username}</div>
                <div className="sidebar-footer-role">{session.user.role || "admin"}</div>
              </div>
            </div>
            <div className="sidebar-footer-actions">
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="sidebar-footer-btn sidebar-footer-btn--logout"
              >
                <i className="fas fa-sign-out" style={{ transform: "rotateY(180deg)" }} />
                <span>Logout</span>
              </button>
              <button
                type="button"
                onClick={() => setDark(d => !d)}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="sidebar-footer-btn sidebar-footer-btn--icon-only"
              >
                <i className={dark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const session   = getSession();

  const [dark,        setDark]        = useState(() => localStorage.getItem("admin_theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed,   setCollapsed]   = useState(() => localStorage.getItem("admin_sidebar_collapsed") === "1");

  // permissions.js's can() reads capability overrides synchronously from a
  // module-level cache that's populated asynchronously (see
  // rolePermissions.js) — force one re-render once it resolves so the
  // sidebar reflects a superadmin's toggle without needing a manual refresh.
  const [, forceRerender] = useState(0);
  useEffect(() => {
    getRoleCapabilityOverrides().then(() => forceRerender((n) => n + 1));
  }, []);

  // Close drawer on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("admin_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  if (!session) return null;

  const role = session.user.role;
  const nav  = NAV_ITEMS.filter(item => can(role, item.cap));

  // Find current page label for mobile topbar
  const currentNav = nav.find(item => location.pathname.startsWith(item.to));

  return (
    <div className="admin-shell">
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <header className="admin-topbar">
        <button
          className="admin-topbar-hamburger"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Open navigation"
        >
          <i className={sidebarOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"} />
        </button>
        <img src={logo} alt="SAWO" className="admin-topbar-logo" />
        <span className="admin-topbar-title">
          {currentNav ? currentNav.label : "Admin"}
        </span>
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? "Light mode" : "Dark mode"}
          className="admin-topbar-theme"
          aria-label="Toggle theme"
        >
          <i className={dark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
        </button>
      </header>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <Sidebar
        session={session}
        dark={dark}
        setDark={setDark}
        nav={nav}
        handleLogout={handleLogout}
        location={location}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="admin-main">
        {/* One shared header for every page — icon, title, and description
            come from the matched NAV_ITEMS entry, so each page only needs
            to render its own content below, not its own header. */}
        {currentNav && (
          <PageHeader
            icon={currentNav.icon}
            title={currentNav.label}
            description={currentNav.description}
            dark={dark}
            setDark={setDark}
            actions={<CmsSearch role={role} />}
          />
        )}
        <div className="admin-main-content" style={{ background: dark ? "#241d16" : "#f7f5f2" }}>
          {React.cloneElement(children, { currentUser: session.user })}
        </div>
      </main>
    </div>
  );
}
