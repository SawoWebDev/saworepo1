// src/Administrator/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSession, clearSession } from "./supabase";
import { NAV_ITEMS, can } from "./permissions";
import logo from "./SAWO-logo.png";
import "./admin.css";

// ── Shared icon-button style (sidebar footer)
const iconButtonStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0.35rem",
  fontSize: "1.1rem",
  borderRadius: "6px",
  transition: "color 0.2s, transform 0.2s, background 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.7)",
};

// Order sections appear in — anything not listed falls back to alphabetical
// order after these, so a stray/unlisted section never disappears silently.
const SECTION_ORDER = ["Catalog", "Insights", "System"];

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
function Sidebar({ session, dark, setDark, nav, handleLogout, location, open, onClose }) {
  const sections = groupBySection(nav);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar${open ? " sidebar-open" : ""}`}>
        {/* Logo — always the current app's own home page, whether that's
            localhost during dev or whichever domain this deploy is served
            from in production (not a hardcoded external URL). */}
        <div className="sidebar-logo">
          <a href={`${window.location.origin}/`} target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="SAWO" className="sidebar-logo-img" />
          </a>
        </div>

        {/* Nav, grouped by section (Catalog / Insights / System) */}
        <nav className="sidebar-nav">
          {sections.map(([section, items]) => (
            <div className="sidebar-section" key={section}>
              <div className="sidebar-section-label">{section}</div>
              {items.map(({ to, label, icon }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={active ? "active" : ""}
                    onClick={onClose}
                  >
                    <i className={icon} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="sidebar-logout-btn"
              style={iconButtonStyle}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.background = "rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "transparent"; }}
            >
              <i className="fas fa-sign-out" style={{ transform: "rotateY(180deg)" }} />
            </button>

            {/* Username / Role */}
            <div className="sidebar-footer-user">
              <div className="sidebar-footer-username">{session.user.username}</div>
              <div className="sidebar-footer-role">{session.user.role || "admin"}</div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setDark(d => !d)}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="sidebar-theme-btn"
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.background = "rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = ""; e.currentTarget.style.background = "transparent"; }}
            >
              <i className={dark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
            </button>
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
      />

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main
        className="admin-main"
        style={{ background: dark ? "#161412" : "#f7f5f2" }}
      >
        {React.cloneElement(children, { currentUser: session.user })}
      </main>
    </div>
  );
}
