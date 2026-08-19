// src/Administrator/RolesPermissions.jsx
//
// Superadmin-only matrix controlling which roles can see each admin page
// (and, where it applies, create/edit/delete within it). Backed by
// permissions.js's CAPABILITY_MAP (the static default for every capability)
// and local-storage/rolePermissions.js (the sparse runtime override a
// superadmin builds up here, one checkbox at a time).
import React, { useEffect, useState } from "react";
import { logActivity } from "./supabase";
import { CAPABILITY_MAP, PERMISSION_SECTIONS } from "./permissions";
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
// onto this table's shape. Shared with Users.jsx's per-user extra-permission
// checkboxes — see PERMISSION_SECTIONS in permissions.js for the single
// source of truth and why a few CAPABILITY_MAP entries are absent from it.
const SECTIONS = PERMISSION_SECTIONS;

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
