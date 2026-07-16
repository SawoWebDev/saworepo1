// src/Administrator/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSession, clearSession, logActivity } from "./supabase";
import { getDataSource, setDataSource as saveDataSource } from "../local-storage/dataSource";
import { NAV_ITEMS, can } from "./permissions";
import logo from "./SAWO-logo.png";

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

// ─── Live Data Source toggle ────────────────────────────────────────────────
// Controls whether the PUBLIC frontend reads products / sauna rooms / site
// content from the GitHub-synced snapshot or live Supabase rows. See
// src/local-storage/dataSource.js and Local/scripts/setup-app-settings.sql.
function DataSourceToggle({ source, switching, onSwitch }) {
  if (!source) return null;
  const isSupabase = source === "supabase";

  return (
    <button
      onClick={() => onSwitch(isSupabase ? "github" : "supabase")}
      disabled={switching}
      title={
        isSupabase
          ? "Frontend is reading LIVE from Supabase. Click to switch back to the GitHub-synced snapshot."
          : "Frontend is reading the GitHub-synced snapshot. Click to switch to live Supabase (instant, no sync needed)."
      }
      className="sidebar-datasource-btn"
      style={{
        ...iconButtonStyle,
        width: "auto",
        gap: 6,
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "0.35rem 0.6rem",
        opacity: switching ? 0.5 : 1,
        color: isSupabase ? "#7dd3a0" : "rgba(255,255,255,0.7)",
      }}
    >
      <i className={`fa-solid ${switching ? "fa-spinner fa-spin" : "fa-satellite-dish"}`} />
      {switching ? "Switching…" : isSupabase ? "Live: Supabase" : "Live: GitHub"}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ session, dark, setDark, nav, handleLogout, location, open, onClose, dataSource, switchingSource, onSwitchSource }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar${open ? " sidebar-open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <a href="https://www.sawo.com" target="_blank" rel="noopener noreferrer">
            <img src={logo} alt="SAWO" className="sidebar-logo-img" />
          </a>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {nav.map(({ to, label, icon }) => {
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
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Live Data Source */}
          <DataSourceToggle source={dataSource} switching={switchingSource} onSwitch={onSwitchSource} />

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
  const [dataSource,      setDataSourceState] = useState(null);
  const [switchingSource, setSwitchingSource] = useState(false);

  // Load current live data source (github | supabase) once on mount
  useEffect(() => {
    getDataSource().then(setDataSourceState).catch(() => setDataSourceState("github"));
  }, []);

  const handleSwitchSource = async (next) => {
    setSwitchingSource(true);
    try {
      await saveDataSource(next, session?.user?.username);
      setDataSourceState(next);
      await logActivity({
        action:      "update",
        entity:      "app_settings",
        entity_id:   "data_source",
        entity_name: `Live Data Source → ${next}`,
        username:    session?.user?.username,
        user_id:     session?.user?.id,
      });
    } catch (err) {
      alert("Failed to switch data source: " + err.message);
    } finally {
      setSwitchingSource(false);
    }
  };

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
        dataSource={dataSource}
        switchingSource={switchingSource}
        onSwitchSource={handleSwitchSource}
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