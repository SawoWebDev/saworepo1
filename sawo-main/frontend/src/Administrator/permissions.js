// src/Administrator/permissions.js
// Centralized role-based access control (RBAC)
// Single source of truth for all capabilities and role logic

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN:      "admin",
  EDITOR:     "editor",
  VIEWER:     "viewer",
};

// Capability-to-roles mapping
// Each capability is an array of roles that possess it
const CAPABILITY_MAP = {
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

  // Navigation / Pages
  "page.models":              ["editor", "admin", "superadmin"],
  "page.taxonomy":            ["editor", "admin", "superadmin"],
  "page.logs":                ["admin", "superadmin"],
  "page.users":               ["superadmin"],
  "page.products_local":      ["editor", "admin", "superadmin"],
};

/**
 * Check if a role has a specific capability
 * @param {string} role - The role to check (e.g., "editor")
 * @param {string} cap  - The capability to check (e.g., "products.delete")
 * @returns {boolean} True if the role has the capability
 */
export function can(role, cap) {
  return !!(CAPABILITY_MAP[cap]?.includes(role));
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
 * Navigation items for the sidebar, filtered by role capability
 * Filter this array using: NAV_ITEMS.filter(item => can(userRole, item.cap))
 */
export const NAV_ITEMS = [
  { to: "/admin/products",        label: "Products",         icon: "fa-solid fa-box",            cap: "products.view"      },
  { to: "/admin/models",          label: "Models",           icon: "fa-solid fa-folder-open",   cap: "page.models"        },
  { to: "/admin/taxonomy",        label: "Taxonomy",         icon: "fa-solid fa-tags",          cap: "page.taxonomy"      },
  { to: "/admin/logs",            label: "Logs",             icon: "fa-solid fa-file-alt",      cap: "page.logs"          },
  { to: "/admin/users",           label: "Users",            icon: "fa-solid fa-users",         cap: "page.users"         },
];
