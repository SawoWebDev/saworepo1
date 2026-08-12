// src/Administrator/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSession, clearSession } from "./supabase";
import { NAV_ITEMS, can, getLandingPath } from "./permissions";
import { getRoleCapabilityOverrides } from "../local-storage/rolePermissions";
import { setPreviewRole, usePreviewRole } from "./previewRole";
import PageHeader from "./PageHeader";
import CmsSearch from "./CmsSearch.jsx";
import logo from "./SAWO-logo.webp";
import "./admin.css";

// A route is "active" (for both the sidebar highlight and picking which
// NAV_ITEMS entry feeds the page header) when the path matches exactly, or
// is a real sub-path of it (segment-boundary aware). Plain
// `pathname.startsWith(to)` is NOT enough — "/admin/seo-keywords" starts
// with the string "/admin/seo" even though they're unrelated routes, which
// used to make Page Performance and Keyword Intelligence both light up
// (and steal each other's page header) whenever either was open.
const isNavActive = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Order here is the render order — see NAV_ITEMS in permissions.js for
// which item carries which `section` value.
const SECTION_ORDER = ["product", "site", "system"];
const SECTION_LABELS = { product: "Product", site: "Site", system: "System" };

function Sidebar({ session, dark, setDark, nav, handleLogout, location, open, onClose, collapsed, onToggleCollapse, realRole, effectiveRole, isPreviewing, onChangePreview }) {
  // `hidden` items (My Profile) are routable and get a PageHeader, but are
  // reached from the footer identity card instead of the nav list.
  const items = nav.filter((item) => !item.hidden);
  const initial = (session.user.username || "?").charAt(0).toUpperCase();
  // Group into the three named sections, each rendered under its own
  // divider + label, in SECTION_ORDER. This only affects render order, not
  // NAV_ITEMS array order itself, so getLandingPath() (which walks the
  // source array) is unaffected.
  const bySection = SECTION_ORDER.map((key) => ({
    key,
    label: SECTION_LABELS[key],
    items: items.filter((item) => item.section === key),
  })).filter((group) => group.items.length > 0);

  const renderLink = ({ to, label, icon }) => {
    const active = isNavActive(location.pathname, to);
    return (
      <Link key={to} to={to} className={active ? "active" : ""} onClick={onClose} title={label}>
        <i className={icon} />
        <span className="sidebar-nav-label">{label}</span>
      </Link>
    );
  };

  // Pulse the role badge on each change so the switch is noticeable even
  // though it happens on a different page (the Profile picker).
  const [badgePulse, setBadgePulse] = useState(false);
  useEffect(() => {
    if (!isPreviewing) return;
    setBadgePulse(true);
    // 5s: long enough to actually read the tooltip that shows alongside the
    // pulse before it fades. Hovering re-shows it any time after that.
    const t = setTimeout(() => setBadgePulse(false), 5000);
    return () => clearTimeout(t);
  }, [effectiveRole, isPreviewing]);

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

        {/* Product / Site / System, each under its own divider + label —
            see `bySection` above. */}
        <nav className="sidebar-nav">
          {bySection.map((group) => (
            <React.Fragment key={group.key}>
              <div className="sidebar-nav-section-label">{group.label}</div>
              {group.items.map(renderLink)}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer — frosted user card with avatar + actions. The identity
            block is the way into My Profile (it's deliberately not a sidebar
            nav item), hence the link + hover affordance. */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <Link
              to="/admin/profile"
              className="sidebar-footer-id sidebar-footer-id--link"
              onClick={onClose}
              title="View your profile"
            >
              <div className="sidebar-footer-avatar">{initial}</div>
              <div className="sidebar-footer-user">
                <div className="sidebar-footer-username">{session.user.username}</div>
                {isPreviewing ? (
                  // While previewing, the role line doubles as the way out —
                  // replaces the old full-width banner above the page header.
                  <button
                    type="button"
                    className={`sidebar-footer-role sidebar-footer-role--preview${badgePulse ? " is-pulsing" : ""}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChangePreview(null); }}
                    aria-label={`Previewing as ${effectiveRole}. Click to exit and return to ${realRole}.`}
                    data-tip={`Previewing as ${effectiveRole}. You still have ${realRole} access underneath. Click here to exit.`}
                  >
                    <i className="fa-solid fa-eye" />
                    Exit {effectiveRole}
                  </button>
                ) : (
                  <div className="sidebar-footer-role">{effectiveRole || "admin"}</div>
                )}
              </div>
            </Link>
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
  // Subscribed to the shared store, so switching the role from the Profile
  // page updates this sidebar instantly — no navigation or remount needed.
  const previewRole = usePreviewRole();

  const handleChangePreview = (role) => {
    setPreviewRole(role);
    // Land on a page the *newly previewed* role can actually see, rather
    // than stranding them on one it can't — a viewer has no Dashboard, so a
    // hardcoded /admin/dashboard here would bounce straight back off.
    const nextRole = role || session?.user?.role;
    navigate(getLandingPath(nextRole));
  };

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

  const realRole = session.user.role;
  const effectiveRole = realRole === "superadmin" && previewRole ? previewRole : realRole;
  const isPreviewing = effectiveRole !== realRole;
  const nav = NAV_ITEMS.filter(item => can(effectiveRole, item.cap));

  // Find current page label for mobile topbar
  const currentNav = nav.find(item => isNavActive(location.pathname, item.to));

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
        realRole={realRole}
        effectiveRole={effectiveRole}
        isPreviewing={isPreviewing}
        onChangePreview={handleChangePreview}
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
            actions={<CmsSearch role={effectiveRole} />}
          />
        )}
        <div className="admin-main-content" style={{ background: dark ? "#241d16" : "#f7f5f2" }}>
          {/* currentUser.role reflects the preview (if any) — every page's
              own getPerms(currentUser)/can() checks derive from this, so
              buttons/actions hide correctly with no per-page changes needed.
              currentUser.id stays the real user's, since a preview never
              touches actual identity or database privilege. */}
          {React.cloneElement(children, { currentUser: { ...session.user, role: effectiveRole } })}
        </div>
      </main>
    </div>
  );
}
