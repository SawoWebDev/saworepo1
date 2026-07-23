// src/Administrator/RolesPermissions.jsx
//
// Superadmin-only matrix controlling which roles can see each admin page
// (and, where it applies, create/edit/delete within it). Backed by
// permissions.js's CAPABILITY_MAP (the static default for every capability)
// and local-storage/rolePermissions.js (the sparse runtime override a
// superadmin builds up here, one checkbox at a time).
import React, { useEffect, useState } from "react";
import { logActivity } from "./supabase";
import { CAPABILITY_MAP } from "./permissions";
import { getRoleCapabilityOverrides, setRoleCapabilityOverrides } from "../local-storage/rolePermissions";
import { getCache, setCache } from "./adminCache";

const CACHE_KEY = "admin:role-permissions";

const ROLE_COLUMNS = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin",      label: "Admin" },
  { value: "editor",     label: "Editor" },
  { value: "viewer",     label: "Viewer" },
];

// Grouped the same way the sidebar itself groups pages (Catalog / Insights /
// System), so "what does the editor see on their sidebar" maps directly
// onto this table's shape. Only capabilities actually enforced somewhere in
// the UI are listed — a few caps exist in CAPABILITY_MAP but aren't wired to
// any real check yet (upload/storage-cleanup caps, an unused local-products
// page flag), and showing checkboxes for those would toggle nothing.
const SECTIONS = [
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

export default function RolesPermissions({ currentUser }) {
  const cached = getCache(CACHE_KEY);
  const [overrides, setOverrides] = useState(() => cached || {});
  const [loading, setLoading]     = useState(() => !cached);
  const [savingCap, setSavingCap] = useState(null);
  const [error, setError]         = useState(null);

  useEffect(() => {
    // Cached overrides are already on screen — refresh quietly instead of
    // flashing the loading state.
    if (!getCache(CACHE_KEY)) setLoading(true);
    getRoleCapabilityOverrides()
      .then((o) => { setOverrides(o); setCache(CACHE_KEY, o); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const effectiveRoles = (cap) => overrides[cap] || CAPABILITY_MAP[cap] || [];

  const handleToggle = async (cap, role, checked) => {
    const current = effectiveRoles(cap);
    const next = checked ? [...current, role] : current.filter((r) => r !== role);

    setSavingCap(cap);
    setError(null);
    try {
      const saved = await setRoleCapabilityOverrides({ ...overrides, [cap]: next }, currentUser?.username);
      setOverrides(saved);
      setCache(CACHE_KEY, saved);
      await logActivity({
        action:      "update",
        entity:      "app_settings",
        entity_id:   "role_capabilities",
        entity_name: `${cap} → ${(saved[cap] || []).join(", ")}`,
        username:    currentUser?.username,
        user_id:     currentUser?.id,
      });
    } catch (err) {
      setError("Failed to update permission: " + err.message);
    } finally {
      setSavingCap(null);
    }
  };

  if (loading) {
    return (
      <div className="table-loading">
        <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading permissions...
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      <p style={{ fontSize: "0.82rem", color: "var(--text-3)", marginBottom: 20, maxWidth: 720 }}>
        Superadmin always has every permission. Its column can't be unchecked, so you can never lock
        yourself out. Toggling a box here takes effect for other logged-in sessions within seconds.
      </p>

      {SECTIONS.map((section) => (
        <div key={section.name} style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--text-3)", marginBottom: 10,
          }}>
            {section.name}
          </h2>

          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  {ROLE_COLUMNS.map((r) => (
                    <th key={r.value} style={{ textAlign: "center", width: 100 }}>{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.groups.map((group) => (
                  <React.Fragment key={group.label}>
                    <tr>
                      <td
                        colSpan={ROLE_COLUMNS.length + 1}
                        style={{
                          fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)",
                          background: "var(--brand-muted)", padding: "6px 12px",
                        }}
                      >
                        {group.label}
                      </td>
                    </tr>
                    {group.rows.map((row) => {
                      const roles = effectiveRoles(row.cap);
                      const rowSaving = savingCap === row.cap;
                      return (
                        <tr key={row.cap} style={rowSaving ? { opacity: 0.6 } : undefined}>
                          <td style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>{row.label}</td>
                          {ROLE_COLUMNS.map((r) => {
                            const isSuperadmin = r.value === "superadmin";
                            const checked = isSuperadmin || roles.includes(r.value);
                            return (
                              <td key={r.value} style={{ textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  className="tbl-checkbox"
                                  checked={checked}
                                  disabled={isSuperadmin || rowSaving}
                                  onChange={(e) => handleToggle(row.cap, r.value, e.target.checked)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
