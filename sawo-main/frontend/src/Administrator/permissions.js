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
  "page.models":              ["editor", "admin", "superadmin"],
  "page.taxonomy":            ["editor", "admin", "superadmin"],
  "page.logs":                ["admin", "superadmin"],
  "page.users":               ["superadmin"],
  "page.products_local":      ["editor", "admin", "superadmin"],
  "page.analytics":           ["admin", "superadmin"],
  "page.settings":            ["admin", "superadmin"],
  // Gates the Roles & Permissions page itself — deliberately NOT part of
  // the dynamic override system (see setCapabilityOverrides below).
  "page.permissions":         ["superadmin"],
};

// Dynamic, admin-configurable overrides — see local-storage/rolePermissions.js.
// Starts empty (every capability falls back to its CAPABILITY_MAP default)
// and is populated in the background as soon as this module loads. There's
// a brief window on a fresh tab's very first render where the static
// default is used instead of a freshly-granted role's access — the same
// tradeoff every other CMS-wide toggle in this app makes (see dataSource.js,
// headerLayout.js).
let capabilityOverrides = {};

export function setCapabilityOverrides(overrides) {
  // "page.permissions" can never be overridden, at the call site too, not
  // just by omission from the editor UI — belt and suspenders against ever
  // locking a superadmin out of the permissions page.
  const { "page.permissions": _ignored, ...rest } = overrides || {};
  capabilityOverrides = rest;
}

getRoleCapabilityOverrides().then(setCapabilityOverrides);

/**
 * Check if a role has a specific capability
 * @param {string} role - The role to check (e.g., "editor")
 * @param {string} cap  - The capability to check (e.g., "products.delete")
 * @returns {boolean} True if the role has the capability
 */
export function can(role, cap) {
  const roles = capabilityOverrides[cap] || CAPABILITY_MAP[cap];
  return !!(roles?.includes(role));
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
    can: (cap) => can(role, cap),
  };
}

/**
 * Navigation items for the sidebar, filtered by role capability and grouped
 * by `section` for display (see AdminLayout.jsx's Sidebar).
 * Filter this array using: NAV_ITEMS.filter(item => can(userRole, item.cap))
 */
export const NAV_ITEMS = [
  { to: "/admin/products",        label: "Products",         icon: "fa-solid fa-box",            cap: "products.view",    section: "Catalog",  description: "Manage your product catalog. Create, edit, and publish items across the site." },
  { to: "/admin/sauna-rooms",     label: "Sauna Rooms",      icon: "fa-solid fa-home",           cap: "sauna_rooms.view", section: "Catalog",  description: "Manage sauna room listings. Create, edit, and publish rooms across the site." },
  { to: "/admin/models",          label: "Models",           icon: "fa-solid fa-folder-open",    cap: "page.models",      section: "Catalog",  description: "Browse products grouped by model line. Click a folder to see everything in it." },
  { to: "/admin/taxonomy",        label: "Taxonomy",         icon: "fa-solid fa-tags",           cap: "page.taxonomy",    section: "Catalog",  description: "Manage the categories and tags products can be organized under." },

  { to: "/admin/analytics",       label: "Analytics",        icon: "fa-solid fa-chart-line",     cap: "page.analytics",   section: "Insights", description: "Track visitor behavior, page performance, and traffic sources." },

  { to: "/admin/logs",            label: "Logs",             icon: "fa-solid fa-file-alt",       cap: "page.logs",        section: "System",   description: "A record of every create, update, and delete made across the CMS." },
  { to: "/admin/settings",        label: "Settings",         icon: "fa-solid fa-gear",           cap: "page.settings",    section: "System",   description: "Site-wide configuration for the public frontend, including the language switcher." },
  { to: "/admin/users",           label: "Users",            icon: "fa-solid fa-users",          cap: "page.users",       section: "System",   description: "Manage admin accounts and their access roles." },
  { to: "/admin/permissions",     label: "Roles & Permissions", icon: "fa-solid fa-user-lock",   cap: "page.permissions", section: "System",   description: "Control which roles can see each page and perform create/edit/delete actions." },
];
