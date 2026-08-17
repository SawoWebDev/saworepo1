// src/Administrator/Users.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isPasswordUpdateRequiredError, forgotPassword } from "./supabase";
import { getCache, setCache } from "./adminCache";
import { getPerms, can, PERMISSION_SECTIONS } from "./permissions";

const USERS_CACHE_KEY = "admin:users";

/**
 * Pushes an admin-set password through to Supabase Auth.
 *
 * The set_user_password* RPCs only rewrite `users.password_hash`; changing
 * another account's Auth password needs the service-role key, which lives
 * only in this edge function. Without this step the two drift apart and the
 * account's owner is locked out — Auth rejects the new password while the
 * CMS accepts it.
 *
 * Call this AFTER the RPC has updated password_hash: the function re-verifies
 * the password server-side against that hash before touching Auth, so
 * `current_password` and `new_password` are intentionally the same value.
 */
async function syncAuthPassword(username, newPassword) {
  const { error } = await supabase.functions.invoke("migrate-auth-password", {
    body: { username, current_password: newPassword, new_password: newPassword },
  });
  if (error) {
    // supabase-js's own error.message for a non-2xx function response is a
    // generic "Edge Function returned a non-2xx status code" — it doesn't
    // surface the function's own { error: "..." } JSON body, which is where
    // the actually useful reason (e.g. "email already registered") lives.
    // Read it straight from the failed response instead.
    let detail = error.message;
    try {
      const body = await error.context?.json();
      if (body?.error) detail = body.error;
    } catch {
      // Response body wasn't JSON (or already consumed) — fall back to the
      // generic message rather than let this throw mask the original error.
    }
    throw new Error(
      "The password was saved, but syncing it to the login system failed, so " +
      "this user may not be able to sign in yet. Ask them to use \"Forgot password?\", " +
      `or try again. (${detail})`
    );
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 8000);
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

function Toast({ toasts, remove }) {
  const icons = { error: "fa-circle-xmark", success: "fa-circle-check", info: "fa-circle-info", warning: "fa-triangle-exclamation" };
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${icons[t.type]}`} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button className="toast-close" onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

const emptyForm = {
  username: "",
  full_name: "",
  email: "",
  role: "admin",
  // Individual grants on top of the role's own defaults — see
  // PERMISSION_SECTIONS in permissions.js. Never includes a capability the
  // selected role already grants by default (toggling the role checkbox
  // clears it there instead — see the Permissions form-group below).
  extra_permissions: [],
};

function Modal({ open, onClose, title, wide, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${wide ? " modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function Users({ currentUser }) {
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const perms = getPerms(currentUser);
  const canCreate = perms.can("users.create");
  const canEdit   = perms.can("users.edit");
  const canDelete = perms.can("users.delete");

  // Shown when a write is blocked because the account hasn't set a real
  // password yet — see isPasswordUpdateRequiredError in supabase.js.
  const notifyPasswordUpdateRequired = () => {
    addToast(
      <>
        You need to update your password before you can do this.{" "}
        <button
          type="button"
          style={{
            display: "inline",
            padding: 0,
            background: "none",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "inherit",
          }}
          onClick={() => navigate("/login", { state: { prefillForgotUsername: currentUser?.username } })}
        >
          Reset your password
        </button>
      </>,
      "error"
    );
  };

  const [users, setUsers]           = useState(() => getCache(USERS_CACHE_KEY) || []);
  const [search, setSearch]         = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [sortDir, setSortDir]       = useState("desc");
  const [selected, setSelected]     = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const [showModal, setShowModal]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [changePassModal, setChangePassModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, email, role, extra_permissions, created_at")
      .order("created_at", { ascending: sortDir === "asc" });
    if (!error) { setUsers(data); setCache(USERS_CACHE_KEY, data); setSelected(new Set()); }
  };

  useEffect(() => { fetchUsers(); }, [sortDir]); // eslint-disable-line

  const openAdd = () => {
    setEditUser(null); setForm(emptyForm); setFormError(""); setShowModal(true);
  };

  const openEdit = u => {
    setEditUser(u);
    setForm({
      username: u.username,
      full_name: u.full_name || "",
      email: u.email || "",
      role: u.role || "admin",
      extra_permissions: u.extra_permissions || [],
    });
    setFormError(""); setShowModal(true);
  };

  // Client-side duplicate check against the already-loaded user list —
  // usernames and emails must both be unique (the database enforces this
  // too, via users_username_key / users_email_key, so this is a friendlier
  // early warning, not the only guard). Excludes the row being edited so
  // saving a user without changing their own username/email doesn't flag
  // itself as a duplicate.
  const findDuplicate = (field, value) => {
    const v = value.trim().toLowerCase();
    if (!v) return null;
    return users.find(u => u.id !== editUser?.id && (u[field] || "").toLowerCase() === v) || null;
  };
  const usernameDuplicate = findDuplicate("username", form.username);
  const emailDuplicate = form.email ? findDuplicate("email", form.email) : null;

  // Toggles one extra-permission checkbox. Guards against ever storing a cap
  // the currently-selected role already grants by default — if the admin
  // flips Role after checking some extras, any that became redundant drop
  // out silently next render (see the filter in the Permissions section
  // below) rather than being saved as dead weight.
  const toggleExtraPermission = (cap, checked) => {
    setForm(f => ({
      ...f,
      extra_permissions: checked
        ? [...f.extra_permissions, cap]
        : f.extra_permissions.filter(c => c !== cap),
    }));
  };

  const closeModal = () => { setShowModal(false); setEditUser(null); };

  // Translates a raw Postgres unique-violation into the friendly message the
  // inline duplicate check already shows — a backstop for the rare race
  // where two admins save the same username/email at nearly the same time
  // (the client-side check alone can't catch that, only the database can).
  const friendlyDbError = err => {
    const msg = err.message || String(err);
    if (/users_username_key/.test(msg)) return "That username is already taken.";
    if (/users_email_key/.test(msg)) return "That email is already used by another account.";
    return msg;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError("");

    if (usernameDuplicate) { setFormError("That username is already taken."); return; }
    if (emailDuplicate) { setFormError("That email is already used by another account."); return; }

    setFormLoading(true);
    // Only persist caps the chosen role doesn't already grant by default —
    // keeps extra_permissions a true diff from the role, not a redundant
    // copy of it (and means switching Role never leaves stale dead grants
    // behind that just happen to be harmless).
    const extraPermissions = form.extra_permissions.filter(cap => !can(form.role, cap));
    try {
      if (editUser) {
        const updates = {
          username: form.username.trim(),
          full_name: form.full_name.trim() || null,
          email: form.email.trim() || null,
          role: form.role,
          extra_permissions: extraPermissions,
        };
        const { error } = await supabase.from("users").update(updates).eq("id", editUser.id);
        if (error) throw new Error(friendlyDbError(error));
        if (form.email.trim() && form.email.trim() !== editUser.email) {
          const { error: fnError } = await supabase.functions.invoke("create-auth-user", { body: { email: form.email.trim() } });
          if (fnError) console.warn("Auth email sync failed:", fnError.message);
        }
      } else {
        // New users always set their own password via the email-invite flow
        // below — there's no admin-set-password shortcut here anymore. It
        // used to exist for accounts with no email, but email is required
        // to create a user at all now (see the form field below), so that
        // case can't come up, and removing it closes off the confusing
        // "two accounts sharing one email" state that shortcut enabled.
        const newUsername = form.username.trim();
        const email = form.email.trim();
        const { error } = await supabase.from("users").insert([{
          username: newUsername,
          full_name: form.full_name.trim() || null,
          email,
          role: form.role,
          extra_permissions: extraPermissions,
        }]);
        if (error) throw new Error(friendlyDbError(error));

        // The account row now exists — close and refresh right away rather
        // than waiting on the auth-invite step below. That used to be
        // awaited inside this same try block, so a failure there (e.g. the
        // invite email erroring) left the modal open with a blocking error
        // even though the user had already been created; clicking "Create
        // User" again to retry then hit a conflict on the username, since it
        // already existed from the first attempt. Treating the invite as a
        // best-effort follow-up (reported via toast, not a blocking form
        // error) makes that retry-into-a-conflict impossible.
        closeModal();
        fetchUsers();

        (async () => {
          try {
            const { error: fnError } = await supabase.functions.invoke("create-auth-user", { body: { email } });
            if (fnError) console.warn("Auth user creation failed:", fnError.message);

            await forgotPassword(newUsername);
            addToast(`User created. A password-setup link was sent to ${email}.`, "success");
          } catch (mailErr) {
            addToast(`User created, but the password-setup email failed to send: ${mailErr.message}`, "error");
          }
        })();
        return;
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      if (isPasswordUpdateRequiredError(err.message)) {
        notifyPasswordUpdateRequired();
      } else {
        setFormError(err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async id => {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      if (isPasswordUpdateRequiredError(error.message)) {
        notifyPasswordUpdateRequired();
      } else {
        addToast(error.message, "error");
      }
      return;
    }
    setDeleteConfirm(null);
    fetchUsers();
  };

  const handleBulkDelete = async () => {
    const { error } = await supabase.from("users").delete().in("id", Array.from(selected));
    if (error) {
      if (isPasswordUpdateRequiredError(error.message)) {
        notifyPasswordUpdateRequired();
      } else {
        addToast(error.message, "error");
      }
      return;
    }
    setBulkConfirm(false);
    setSelected(new Set());
    fetchUsers();
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    setPassError("");

    if (!newPassword) {
      setPassError("New password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters");
      return;
    }

    try {
      const { error } = await supabase.rpc("set_user_password", {
        p_user_id: editUser.id,
        p_new_password: newPassword,
      });
      if (error) throw error;
      // Keep Supabase Auth in step, or this user can't sign in with the
      // password that was just set for them.
      await syncAuthPassword(editUser.username, newPassword);

      setChangePassModal(false);
      setNewPassword("");
      setConfirmPassword("");
      fetchUsers();
    } catch (err) {
      if (isPasswordUpdateRequiredError(err.message)) {
        notifyPasswordUpdateRequired();
      } else {
        setPassError(err.message);
      }
    }
  };

  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };

  const roleBadge = role => {
    if (role === "superadmin") return <span className="tbl-pill tbl-pill-cat">{role}</span>;
    if (role === "editor")     return <span className="tbl-pill tbl-pill-tag">{role}</span>;
    if (role === "viewer")     return <span className="tbl-pill tbl-pill-info">viewer</span>;
    return <span className="tbl-pill tbl-pill-more">{role}</span>;
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const formatDate = d => d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "-";

  return (
    <div>
      <Toast toasts={toasts} remove={removeToast} />

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className={`toolbar-filters-row${mobileSearchOpen ? " search-open" : ""}`} style={{ marginLeft: 0 }}>
          <div className="search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username, email..." />
          </div>

          <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>

          <select className="filter-select" value={sortDir} onChange={e => setSortDir(e.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>

          {canDelete && selected.size > 0 && (
            <button type="button" className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)", gap: 5 }} onClick={() => setBulkConfirm(true)}>
              <i className="fa-solid fa-trash" /> Delete {selected.size}
            </button>
          )}

          <button type="button" className="mobile-search-toggle"
            onClick={() => setMobileSearchOpen(o => !o)}
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}>
            <i className={`fa-solid ${mobileSearchOpen ? "fa-xmark" : "fa-magnifying-glass"}`} />
          </button>
        </div>

        {canCreate && (
          <button type="button" className="btn btn-primary add-user-btn" style={{ marginLeft: "auto" }} onClick={openAdd}>
            <i className="fa-solid fa-plus" /> Add User
          </button>
        )}
      </div>

      {/* Table */}
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              {canDelete && (
                <th style={{ width: 36, paddingRight: 0 }}>
                  <input type="checkbox" className="tbl-checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll} />
                </th>
              )}
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={selected.has(u.id) ? "row-selected" : ""}>
                {canDelete && (
                  <td style={{ paddingRight: 0 }}>
                    <input type="checkbox" className="tbl-checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                )}
                <td>
                  <span style={{ fontFamily: "var(--font)", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{u.username}</span>
                </td>
                <td style={{ fontFamily: "var(--font)", fontWeight: 400, fontSize: 13, color: "var(--text-2)" }}>{u.full_name || "-"}</td>
                <td style={{ fontFamily: "var(--font)", fontWeight: 400, fontSize: 13, color: "var(--text-2)" }}>{u.email || "-"}</td>
                <td>
                  {roleBadge(u.role)}
                  {u.extra_permissions?.length > 0 && (
                    <span
                      className="tbl-pill"
                      title={`${u.extra_permissions.length} extra permission(s) added on top of the ${u.role} role's defaults`}
                      style={{ marginLeft: 6, background: "var(--brand-muted)", color: "var(--brand)" }}
                    >
                      +{u.extra_permissions.length} extra
                    </span>
                  )}
                </td>
                <td className="tbl-date">{formatDate(u.created_at)}</td>
                <td style={{ textAlign: "right" }}>
                  <div className="table-actions">
                    {deleteConfirm === u.id ? (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Yes</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <button type="button" className="icon-btn" title="Edit" onClick={() => openEdit(u)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" className="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(u.id)}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={canDelete ? 7 : 6} className="table-empty">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={closeModal} title={editUser ? "Edit User" : "Add User"} wide>
        <style>{`
          .user-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          @media (max-width: 640px) {
            .user-form-row { grid-template-columns: 1fr; gap: 14px; }
          }
        `}</style>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div className="user-form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username <span style={{ color: "var(--danger)" }}>*</span></label>
              <input className="form-input" type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              {usernameDuplicate && (
                <p style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.3rem" }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 4 }} />
                  Already taken by {usernameDuplicate.username}.
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
          </div>

          <div className="user-form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email <span style={{ color: "var(--danger)" }}>*</span></label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              {emailDuplicate ? (
                <p style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.3rem" }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 4 }} />
                  Already used by {emailDuplicate.username}. Each account needs its own email — sign-in is matched by email, so two accounts can't share one.
                </p>
              ) : !editUser && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.3rem" }}>
                  A password-setup link will be sent to this address once the account is created — that's the only way this user's password gets set.
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            </div>
          </div>

          {editUser && canEdit && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "var(--brand)", color: "#fff", border: "none", width: "fit-content" }}
              onClick={() => { setChangePassModal(true); setPassError(""); setNewPassword(""); setConfirmPassword(""); }}
            >
              <i className="fa-solid fa-key" style={{ marginRight: 6 }} />
              Change Password
            </button>
          )}

          {form.role === "superadmin" ? (
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: 0 }}>
              Superadmin already has every permission — extra permissions don't apply.
            </p>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Permissions</label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 8px" }}>
                Checked-and-locked boxes come from the <strong>{form.role}</strong> role's own defaults.
                Check any other box to grant it to this user specifically, without changing the role itself.
              </p>
              <div className="products-table-wrap" style={{ maxHeight: 280, overflowY: "auto" }}>
                {PERMISSION_SECTIONS.map(section => (
                  <div key={section.name}>
                    {section.groups.map(group => (
                      <React.Fragment key={group.label}>
                        <div style={{
                          fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)",
                          background: "var(--brand-muted)", padding: "6px 12px",
                        }}>
                          {group.label}
                        </div>
                        {group.rows.map(row => {
                          const fromRole = can(form.role, row.cap);
                          const checked = fromRole || form.extra_permissions.includes(row.cap);
                          return (
                            <label
                              key={row.cap}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "6px 12px", fontSize: "0.82rem",
                                color: fromRole ? "var(--text-3)" : "var(--text-2)",
                                cursor: fromRole ? "default" : "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                className="tbl-checkbox"
                                checked={checked}
                                disabled={fromRole}
                                onChange={e => toggleExtraPermission(row.cap, e.target.checked)}
                              />
                              {row.label}
                              {fromRole && (
                                <span style={{ fontSize: "0.68rem", color: "var(--text-3)", marginLeft: "auto" }}>
                                  from role
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation" /> {formError}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading || !!usernameDuplicate || !!emailDuplicate}>
              {formLoading
                ? <><i className="fa-solid fa-spinner" style={{ animation: "spin 1s linear infinite" }} /> {editUser ? "Saving..." : "Creating..."}</>
                : <><i className={editUser ? "fa-solid fa-floppy-disk" : "fa-solid fa-user-plus"} /> {editUser ? "Save Changes" : "Create User"}</>
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <div className="modal-overlay" onClick={() => setBulkConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Selected?</h2>
              <button className="modal-close-btn" onClick={() => setBulkConfirm(false)}></button>
            </div>
            <div className="modal-body">
              <p className="confirm-msg">Delete {selected.size} selected user(s)? This cannot be undone.</p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setBulkConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleBulkDelete}>Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal open={changePassModal} onClose={() => setChangePassModal(false)} title="Change Password">
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              className="form-input"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm Password <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          {passError && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation" /> {passError}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setChangePassModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <i className="fa-solid fa-check" style={{ marginRight: 6 }} />
              Change Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}






