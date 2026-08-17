// src/Administrator/permissions.js
// Centralized role-based access control (RBAC)
// Single source of truth for all capabilities and role logic

import { getRoleCapabilityOverrides } from "../local-storage/rolePermissions";

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN:      "admin",
  EDITOR:     "editor",
  VIEWER:     "viewer",
};

// Capability-to-roles mapping — the static DEFAULT for every capability.
// A superadmin can override any of these at runtime from the Roles &
// Permissions page (/admin/permissions), except "page.permissions" itself
// (see below) — that one is permanently hardcoded so a superadmin can never
// lock themselves out of the page that controls locking-out.
//
// Each capability is an array of roles that possess it by default.
export const CAPABILITY_MAP = {
  // Products
  "products.view":            ["viewer", "editor", "admin", "superadmin"],
  "products.create":          ["editor", "admin", "superadmin"],
  "products.edit":            ["editor", "admin", "superadmin"],
  "products.delete":          ["admin", "superadmin"],
  "products.bulk_delete":     ["admin", "superadmin"],
  "products.duplicate":       ["admin", "superadmin"],
  "products.storage_cleanup": ["admin", "superadmin"],
  "products.upload_images":   ["admin", "superadmin"],
  "products.upload_files":    ["admin", "superadmin"],
  "products.csv_import":      ["admin", "superadmin"],

  // Sauna Rooms
  "sauna_rooms.view":         ["viewer", "editor", "admin", "superadmin"],
  "sauna_rooms.create":       ["editor", "admin", "superadmin"],
  "sauna_rooms.edit":         ["editor", "admin", "superadmin"],
  "sauna_rooms.delete":       ["admin", "superadmin"],
  "sauna_rooms.bulk_delete":  ["admin", "superadmin"],
  "sauna_rooms.duplicate":    ["admin", "superadmin"],
  "sauna_rooms.upload_images": ["admin", "superadmin"],

  // Taxonomy (categories & tags)
  "taxonomy.create":          ["editor", "admin", "superadmin"],
  "taxonomy.edit":            ["editor", "admin", "superadmin"],
  "taxonomy.delete":          ["admin", "superadmin"],

  // Users (admin accounts)
  "users.create":             ["superadmin"],
  "users.edit":               ["superadmin"],
  "users.delete":             ["superadmin"],

  // Navigation / Pages
  // Viewers deliberately have no Dashboard — they land straight on the
  // Products catalog instead (see getLandingPath below). Nothing on the
  // Dashboard is actionable for a read-only role, so it's noise for them.
  "page.dashboard":           ["editor", "admin", "superadmin"],
  "page.profile":             ["viewer", "editor", "admin", "superadmin"],
  "page.models":              ["editor", "admin", "superadmin"],
  "page.taxonomy":            ["editor", "admin", "superadmin"],
  "page.logs":                ["admin", "superadmin"],
  "page.inbox":               ["editor", "admin", "superadmin"],
  "page.users":               ["superadmin"],
  "page.products_local":      ["editor", "admin", "superadmin"],
  "page.analytics":           ["admin", "superadmin"],
  "page.seo":                 ["editor", "admin", "superadmin"],
  "page.seo_keyword_intel":   ["editor", "admin", "superadmin"],
  "page.ci_status":           ["admin", "superadmin"],
  "page.website_health":      ["editor", "admin", "superadmin"],
  "page.settings":            ["admin", "superadmin"],
  // Gates the Permissions page itself — deliberately NOT part of
  // the dynamic override system (see setCapabilityOverrides below).
  "page.permissions":         ["superadmin"],
};

// Grouped, human-labeled subset of CAPABILITY_MAP — only capabilities that
// are actually enforced somewhere in the UI (a few exist in CAPABILITY_MAP
// but aren't wired to any real check yet — upload/storage-cleanup caps, an
// unused local-products page flag — so showing checkboxes for those would
// toggle nothing). Grouped the same way the sidebar groups pages (Catalog /
// Insights / System).
//
// Single source of truth for two different checkbox matrices that both need
// the exact same list, in the exact same grouping:
//   - RolesPermissions.jsx: which ROLES get each capability by default.
//   - Users.jsx: which EXTRA capabilities a specific user gets on top of
//     their role's defaults (see canUser/getPerms above).
// "page.permissions" is deliberately absent from this list in both places —
// it's permanently hardcoded (see CAPABILITY_MAP above) and must never be
// grantable to anyone, by role or by individual override.
export const PERMISSION_SECTIONS = [
  {
    name: "Catalog",
    groups: [
      {
        label: "Products",
        rows: [
          { cap: "products.view",        label: "View page (sidebar)" },
          { cap: "products.create",      label: "Create" },
          { cap: "products.edit",        label: "Edit" },
          { cap: "products.delete",      label: "Delete" },
          { cap: "products.duplicate",   label: "Duplicate" },
          { cap: "products.bulk_delete", label: "Bulk delete" },
        ],
      },
      {
        label: "Sauna Rooms",
        rows: [
          { cap: "sauna_rooms.view",        label: "View page (sidebar)" },
          { cap: "sauna_rooms.create",      label: "Create" },
          { cap: "sauna_rooms.edit",        label: "Edit" },
          { cap: "sauna_rooms.delete",      label: "Delete" },
          { cap: "sauna_rooms.duplicate",   label: "Duplicate" },
          { cap: "sauna_rooms.bulk_delete", label: "Bulk delete" },
        ],
      },
      {
        label: "Models",
        rows: [
          { cap: "page.models", label: "View page (sidebar)" },
        ],
      },
      {
        label: "Taxonomy",
        rows: [
          { cap: "page.taxonomy",   label: "View page (sidebar)" },
          { cap: "taxonomy.create", label: "Create category/tag" },
          { cap: "taxonomy.edit",   label: "Edit category/tag" },
          { cap: "taxonomy.delete", label: "Delete category/tag" },
        ],
      },
    ],
  },
  {
    name: "Insights",
    groups: [
      {
        label: "Inbox",
        rows: [
          { cap: "page.inbox", label: "View page (sidebar)" },
        ],
      },
      {
        label: "Analytics",
        rows: [
          { cap: "page.analytics", label: "View page (sidebar)" },
        ],
      },
    ],
  },
  {
    name: "System",
    groups: [
      {
        label: "Logs",
        rows: [
          { cap: "page.logs", label: "View page (sidebar)" },
        ],
      },
      {
        label: "Settings",
        rows: [
          { cap: "page.settings", label: "View page (sidebar)" },
        ],
      },
      {
        label: "Users",
        rows: [
          { cap: "page.users",   label: "View page (sidebar)" },
          { cap: "users.create", label: "Create admin account" },
          { cap: "users.edit",   label: "Edit admin account" },
          { cap: "users.delete", label: "Delete admin account" },
        ],
      },
    ],
  },
];

// Dynamic, admin-configurable overrides — see local-storage/rolePermissions.js.
// Starts empty (every capability falls back to its CAPABILITY_MAP default)
// and is populated in the background the first time `can()` actually runs
// — NOT at module-load time. This module is statically imported by
// App.jsx (for getLandingPath, used only by the /admin redirect), which
// means App.jsx — and every route it renders, including the public Home
// page — pulls this module in on every visit. Firing the Supabase fetch
// unconditionally at import time used to mean anonymous visitors to Home
// paid for a role-overrides fetch (and the auth-js SDK chunk that comes
// with it) they'd never use, hurting mobile LCP/TBT for no benefit. Gating
// it behind first use means it only fires on an actual /admin visit, where
// `can()` (via ProtectedRoute / NAV_ITEMS filtering / getLandingPath) is
// always called anyway. There's still a brief window on a fresh /admin tab's
// very first render where the static default is used instead of a
// freshly-granted role's access — the same tradeoff every other CMS-wide
// toggle in this app makes (see dataSource.js, headerLayout.js).
let capabilityOverrides = {};
let overridesFetchStarted = false;

export function setCapabilityOverrides(overrides) {
  // "page.permissions" can never be overridden, at the call site too, not
  // just by omission from the editor UI — belt and suspenders against ever
  // locking a superadmin out of the permissions page.
  const { "page.permissions": _ignored, ...rest } = overrides || {};
  capabilityOverrides = rest;
}

function ensureOverridesLoading() {
  if (overridesFetchStarted) return;
  overridesFetchStarted = true;
  getRoleCapabilityOverrides().then(setCapabilityOverrides);
}

/**
 * Check if a role has a specific capability
 * @param {string} role - The role to check (e.g., "editor")
 * @param {string} cap  - The capability to check (e.g., "products.delete")
 * @returns {boolean} True if the role has the capability
 */
export function can(role, cap) {
  ensureOverridesLoading();
  const roles = capabilityOverrides[cap] || CAPABILITY_MAP[cap];
  return !!(roles?.includes(role));
}

/**
 * Check whether a specific USER (not just their role) has a capability —
 * true if their role grants it by default, OR if it's been individually
 * added to their account via `user.extra_permissions` (see Users.jsx's
 * per-user permission checkboxes). Extra permissions are additive-only and
 * scoped to that one account; they never modify what the role itself grants
 * everyone else with that role.
 *
 * @param {object} user - User object with 'role' and optional 'extra_permissions' (string[])
 * @param {string} cap  - The capability to check
 */
export function canUser(user, cap) {
  if (!user) return false;
  if (can(user.role, cap)) return true;
  return !!(user.extra_permissions || []).includes(cap);
}

/**
 * Get a permissions object for a user
 * Usage: const perms = getPerms(session.user);
 *        if (perms.can("products.delete")) { ... }
 *
 * @param {object} user - User object with at least a 'role' property
 * @returns {object} Permissions object with { role, can }
 */
export function getPerms(user) {
  const role = user?.role ?? "viewer";
  return {
    role,
    can: (cap) => canUser(user, cap),
  };
}

/**
 * Like `can(role, cap)`, but also honors the real logged-in user's
 * individual extra permissions — EXCEPT while a superadmin is actively
 * previewing a different role (effectiveRole !== user.role), where extras
 * are deliberately ignored so the preview stays a faithful simulation of
 * what that role sees by default, instead of leaking the superadmin's own
 * account-specific grants into it.
 *
 * Used by the handful of call sites that check a page/nav capability against
 * an `effectiveRole` computed separately from the user object (AdminLayout's
 * NAV_ITEMS filter, CmsSearch, ProtectedRoute) — everywhere else, prefer
 * `getPerms(user).can(cap)`, which always reflects the user passed in.
 *
 * @param {object} user - The real logged-in user (session.user)
 * @param {string} effectiveRole - role to check (possibly a previewed role)
 * @param {string} cap
 */
export function canEffective(user, effectiveRole, cap) {
  if (user && effectiveRole === user.role) return canUser(user, cap);
  return can(effectiveRole, cap);
}

/**
 * Navigation items for the sidebar, filtered by role capability and
 * rendered as a flat list in this order (see AdminLayout.jsx's Sidebar).
 * Filter this array using: NAV_ITEMS.filter(item => can(userRole, item.cap))
 */
// Every visible item now carries a `section` — the sidebar renders three
// labeled groups, in this order: Product, Site, System (see Sidebar's
// render in AdminLayout.jsx). Purely a rendering concern; array order below
// is still what getLandingPath() walks for its fallback, and is kept
// grouped-by-section here too so the two stay easy to reason about together.
export const NAV_ITEMS = [
  // ── Product ──────────────────────────────────────────────────────────
  { to: "/admin/dashboard",       label: "Dashboard",        icon: "fa-solid fa-gauge-high",     cap: "page.dashboard",   description: "At-a-glance activity, traffic, and catalog status.", section: "product" },
  { to: "/admin/products",        label: "Products",         icon: "fa-solid fa-box",            cap: "products.view",    description: "Manage your product catalog. Create, edit, and publish items across the site.", section: "product" },
  { to: "/admin/sauna-rooms",     label: "Sauna Rooms",      icon: "fa-solid fa-home",           cap: "sauna_rooms.view", description: "Manage sauna room listings. Create, edit, and publish rooms across the site.", section: "product" },
  { to: "/admin/models",          label: "Models",           icon: "fa-solid fa-folder-open",    cap: "page.models",      description: "Browse products grouped by model line. Click a folder to see everything in it.", section: "product" },
  { to: "/admin/taxonomy",        label: "Taxonomy",         icon: "fa-solid fa-tags",           cap: "page.taxonomy",    description: "Manage the categories and tags products can be organized under.", section: "product" },
  { to: "/admin/logs",            label: "Logs",             icon: "fa-solid fa-file-alt",       cap: "page.logs",        description: "A record of every create, update, and delete made across the CMS.", section: "product" },
  // Not in the user's original Product/Site/System list — placed here as
  // the closest fit (contact submissions are a product/site-operations
  // concern); move to a different section if that's wrong.
  { to: "/admin/inbox",           label: "Inbox",            icon: "fa-solid fa-inbox",          cap: "page.inbox",       description: "Every Contact form submission — general inquiries, technical support, and customer support requests.", section: "product" },

  // ── Site ─────────────────────────────────────────────────────────────
  { to: "/admin/analytics",       label: "Analytics",        icon: "fa-solid fa-chart-line",     cap: "page.analytics",   description: "Track visitor behavior, page performance, and traffic sources.", section: "site" },
  { to: "/admin/seo",             label: "Page Performance", icon: "fa-solid fa-magnifying-glass-chart", cap: "page.seo", description: "See which hub/category pages get traffic, drill into any page's visitors, and override its title/meta description/social-share image. No redeploy needed.", section: "site" },
  { to: "/admin/seo-keywords",    label: "Keywords",         icon: "fa-solid fa-chess", cap: "page.seo_keyword_intel", description: "Own Search Console rankings, competitor content themes, and tracked SERP positions — combined without conflating real ranking data with inferred content themes.", section: "site" },
  { to: "/admin/website-health",  label: "Website Health",   icon: "fa-solid fa-heart-pulse",    cap: "page.website_health", description: "Genuinely-actionable SEO gaps (missing descriptions, categories, images) plus a condensed view of the automated broken-link/Lighthouse checks.", section: "site" },

  // `hidden` keeps this out of the sidebar nav (it's reached by clicking your
  // own name/avatar in the sidebar footer instead) while still being
  // matched for the shared PageHeader and the route's capability check. No
  // `section` needed — hidden items are filtered out before grouping.
  { to: "/admin/profile",         label: "My Profile",       icon: "fa-solid fa-user",           cap: "page.profile",     description: "Update your own username, name, and password.", hidden: true },

  // ── System ───────────────────────────────────────────────────────────
  { to: "/admin/ci-status",       label: "CI Status",        icon: "fa-solid fa-list-check",     cap: "page.ci_status",   description: "Latest results from the GitHub Actions checks that run against this repo (SEO, sitemap, keep-alive, broken links).", section: "system" },
  { to: "/admin/users",           label: "Users",            icon: "fa-solid fa-users",          cap: "page.users",       description: "Manage admin accounts and their access roles.", section: "system" },
  { to: "/admin/permissions",     label: "Permissions",      icon: "fa-solid fa-user-lock",      cap: "page.permissions", description: "Control which roles can see each page and perform create/edit/delete actions.", section: "system" },
  { to: "/admin/settings",        label: "Settings",         icon: "fa-solid fa-gear",           cap: "page.settings",    description: "Site-wide configuration for the public frontend, including the language switcher.", section: "system" },
];

/**
 * Where a given role should land when it has nowhere specific to go — the
 * /admin index, or after being bounced off a page it can't access.
 *
 * This MUST be role-aware rather than a hardcoded "/admin/dashboard": viewers
 * no longer have page.dashboard, so sending them there would bounce them
 * straight back off it again, into an infinite redirect loop. Falls back
 * through the nav in order (Products is first for a viewer), then to Profile,
 * which every role can always reach.
 */
export function getLandingPath(role) {
  if (can(role, "page.dashboard")) return "/admin/dashboard";
  const first = NAV_ITEMS.find((item) => !item.hidden && can(role, item.cap));
  return first ? first.to : "/admin/profile";
}
