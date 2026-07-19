// src/Administrator/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSession, clearSession, logActivity } from "./supabase";
import {
  getDataSource, setDataSource as saveDataSource,
  getJsonSourceScope, setJsonSourceScope as saveJsonSourceScope,
} from "../local-storage/dataSource";
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

// ─── Live Data Source toggle ────────────────────────────────────────────────
// Controls whether the PUBLIC frontend reads products / sauna rooms / site
// content from the GitHub-synced snapshot, live Supabase rows, or a single
// hand-edited JSON file in the images repo (currently accessories only). See
// src/local-storage/dataSource.js and Local/scripts/setup-app-settings.sql.
const SOURCE_LABELS = { github: "Live: GitHub", supabase: "Live: Supabase", jsonfile: "Live: Json File" };
const SOURCE_COLORS = { github: "rgba(255,255,255,0.7)", supabase: "#7dd3a0", jsonfile: "#e8c47a" };
const SCOPE_OPTIONS = [
  { value: "accessories", label: "Accessories" },
  { value: "all", label: "All (coming soon)", disabled: true },
  { value: "saunarooms", label: "Sauna Rooms (coming soon)", disabled: true },
  { value: "heaters", label: "Heaters (coming soon)", disabled: true },
];

function DataSourceToggle({ source, scope, switching, onSwitchSource, onSwitchScope }) {
  if (!source) return null;

  const selectStyle = {
    background: "none",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "0.3rem 0.4rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0.35rem 0.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i
          className={`fa-solid ${switching ? "fa-spinner fa-spin" : "fa-satellite-dish"}`}
          style={{ color: SOURCE_COLORS[source], fontSize: "0.9rem" }}
        />
        <select
          value={source}
          disabled={switching}
          onChange={(e) => onSwitchSource(e.target.value)}
          title="Controls where the public frontend reads product / sauna room / site content data from."
          className="sidebar-datasource-select"
          style={{
            ...selectStyle,
            color: SOURCE_COLORS[source],
            opacity: switching ? 0.5 : 1,
            cursor: switching ? "default" : "pointer",
          }}
        >
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {source === "jsonfile" && (
        <select
          value={scope}
          disabled={switching}
          onChange={(e) => onSwitchScope(e.target.value)}
          title="Which product group the Json File source applies to. Only Accessories is available today; edits to it live in the images repo's allaccs-data.json, not in this admin — the CMS's product editor does not affect it."
          style={{
            ...selectStyle,
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.65rem",
            padding: "0.25rem 0.35rem",
            marginLeft: "1.3rem",
            cursor: switching ? "default" : "pointer",
          }}
        >
          {SCOPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ session, dark, setDark, nav, handleLogout, location, open, onClose, dataSource, jsonScope, switchingSource, onSwitchSource, onSwitchScope }) {
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
          <DataSourceToggle
            source={dataSource}
            scope={jsonScope}
            switching={switchingSource}
            onSwitchSource={onSwitchSource}
            onSwitchScope={onSwitchScope}
          />

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
  const [jsonScope,       setJsonScopeState]  = useState("accessories");
  const [switchingSource, setSwitchingSource] = useState(false);

  // Load current live data source (github | supabase | jsonfile) + scope once on mount
  useEffect(() => {
    getDataSource().then(setDataSourceState).catch(() => setDataSourceState("github"));
    getJsonSourceScope().then(setJsonScopeState).catch(() => setJsonScopeState("accessories"));
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

  const handleSwitchScope = async (next) => {
    setSwitchingSource(true);
    try {
      await saveJsonSourceScope(next, session?.user?.username);
      setJsonScopeState(next);
      await logActivity({
        action:      "update",
        entity:      "app_settings",
        entity_id:   "json_source_scope",
        entity_name: `Json Source Scope → ${next}`,
        username:    session?.user?.username,
        user_id:     session?.user?.id,
      });
    } catch (err) {
      alert("Failed to switch json source scope: " + err.message);
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
        jsonScope={jsonScope}
        switchingSource={switchingSource}
        onSwitchSource={handleSwitchSource}
        onSwitchScope={handleSwitchScope}
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