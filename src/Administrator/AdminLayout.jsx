﻿// src/Administrator/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSession, clearSession } from "./supabase";
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

// ─── Sidebar (reused by both layouts) ────────────────────────────────────────
function Sidebar({ session, dark, setDark, nav, handleLogout, location }) {
  return (
    <aside
      style={{
        width: "220px",
        background: "linear-gradient(180deg, #a67c52 0%, #8c5e38 100%)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "1.5rem 1.25rem 1rem", height: "100px" }}>
        <a href="https://www.sawo.com" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="SAWO" style={{ width: "100px", height: "auto", display: "block" }} />
        </a>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0", overflowY: "auto" }}>
        {nav.map(({ to, label, icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1.25rem",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 500,
                borderLeft: active ? "3px solid #7a5b3b" : "3px solid transparent",
                background: active ? "rgba(0,0,0,0.2)" : "transparent",
                transition: "background 0.2s, border-left 0.2s, color 0.2s",
                borderRadius: "4px 0 0 4px",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <i className={icon} style={{ width: "18px", textAlign: "center", fontSize: "0.95rem", opacity: 0.85 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "1rem 0.8rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{ ...iconButtonStyle, borderRadius: "4px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.background = "rgba(0,0,0,0.15)"; e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <i className="fas fa-sign-out" style={{ transform: "rotateY(180deg)" }} />
          </button>

          {/* Username / Role */}
          <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", lineHeight: "1.1", marginBottom: "2px" }}>
              {session.user.username}
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 500, color: "#fff", opacity: 0.5, lineHeight: "1.1" }}>
              {session.user.role || "admin"}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDark(d => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ ...iconButtonStyle, borderRadius: "4px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.background = "rgba(0,0,0,0.15)"; e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <i className={dark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const session   = getSession();

  const [dark, setDark] = useState(() => localStorage.getItem("admin_theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("admin_theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  if (!session) return null;

  // ── UNIFIED LAYOUT for all roles ───────────────────────────────────────────
  // Navigation is filtered based on role capabilities
  const role = session.user.role;
  const nav = NAV_ITEMS.filter(item => can(role, item.cap));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Montserrat', sans-serif" }}>
      <Sidebar
        session={session}
        dark={dark}
        setDark={setDark}
        nav={nav}
        handleLogout={handleLogout}
        location={location}
      />

      <main style={{ flex: 1, overflowY: "auto", padding: "2rem 2.5rem", background: dark ? "#161412" : "#f7f5f2", transition: "background 0.2s" }}>
        {React.cloneElement(children, { currentUser: session.user })}
      </main>
    </div>
  );
}