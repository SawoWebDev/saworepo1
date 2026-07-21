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

  // Sauna Rooms
  "sauna_rooms.view":         ["viewer", "editor", "admin", "superadmin"],
  "sauna_rooms.create":       ["editor", "admin", "superadmin"],
  "sauna_rooms.edit":         ["editor", "admin", "superadmin"],
  "sauna_rooms.delete":       ["admin", "superadmin"],
  "sauna_rooms.bulk_delete":  ["admin", "superadmin"],
  "sauna_rooms.duplicate":    ["admin", "superadmin"],
  "sauna_rooms.upload_images": ["admin", "superadmin"],

  // Navigation / Pages
  "page.models":              ["editor", "admin", "superadmin"],
  "page.taxonomy":            ["editor", "admin", "superadmin"],
  "page.logs":                ["admin", "superadmin"],
  "page.users":               ["superadmin"],
  "page.products_local":      ["editor", "admin", "superadmin"],
  "page.analytics":           ["admin", "superadmin"],
  "page.settings":            ["admin", "superadmin"],
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
 * Navigation items for the sidebar, filtered by role capability and grouped
 * by `section` for display (see AdminLayout.jsx's Sidebar).
 * Filter this array using: NAV_ITEMS.filter(item => can(userRole, item.cap))
 */
export const NAV_ITEMS = [
  { to: "/admin/products",        label: "Products",         icon: "fa-solid fa-box",            cap: "products.view",    section: "Catalog"  },
  { to: "/admin/sauna-rooms",     label: "Sauna Rooms",      icon: "fa-solid fa-home",           cap: "sauna_rooms.view", section: "Catalog"  },
  { to: "/admin/models",          label: "Models",           icon: "fa-solid fa-folder-open",    cap: "page.models",      section: "Catalog"  },
  { to: "/admin/taxonomy",        label: "Taxonomy",         icon: "fa-solid fa-tags",           cap: "page.taxonomy",    section: "Catalog"  },

  { to: "/admin/analytics",       label: "Analytics",        icon: "fa-solid fa-chart-line",     cap: "page.analytics",   section: "Insights" },

  { to: "/admin/logs",            label: "Logs",             icon: "fa-solid fa-file-alt",       cap: "page.logs",        section: "System"   },
  { to: "/admin/language",        label: "Language",         icon: "fa-solid fa-language",       cap: "page.settings",    section: "System"   },
  { to: "/admin/settings",        label: "Settings",         icon: "fa-solid fa-gear",           cap: "page.settings",    section: "System"   },
  { to: "/admin/users",           label: "Users",            icon: "fa-solid fa-users",          cap: "page.users",       section: "System"   },
];
