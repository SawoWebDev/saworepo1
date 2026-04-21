// src/Administrator/Users.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const emptyForm = {
  username: "",
  password_hash: "",
  full_name: "",
  email: "",
  role: "admin",
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [search, setSearch]         = useState("");
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
  const [showPassword, setShowPassword]   = useState(false);
  const [changePassModal, setChangePassModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, email, role, created_at")
      .order("created_at", { ascending: sortDir === "asc" });
    if (!error) { setUsers(data); setSelected(new Set()); }
  };

  useEffect(() => { fetchUsers(); }, [sortDir]); // eslint-disable-line

  const openAdd = () => {
    setEditUser(null); setForm(emptyForm); setFormError(""); setShowPassword(false); setShowModal(true);
  };

  const openEdit = u => {
    setEditUser(u);
    setForm({ username: u.username, password_hash: "", full_name: u.full_name || "", email: u.email || "", role: u.role || "admin" });
    setFormError(""); setShowPassword(false); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditUser(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      if (editUser) {
        const updates = {
          username: form.username.trim(),
          full_name: form.full_name.trim() || null,
          email: form.email.trim() || null,
          role: form.role,
        };
        if (form.password_hash.trim()) updates.password_hash = form.password_hash.trim();
        const { error } = await supabase.from("users").update(updates).eq("id", editUser.id);
        if (error) throw new Error(error.message);
        if (form.email.trim() && form.email.trim() !== editUser.email) {
          const { error: fnError } = await supabase.functions.invoke("create-auth-user", { body: { email: form.email.trim() } });
          if (fnError) console.warn("Auth email sync failed:", fnError.message);
        }
      } else {
        const { error } = await supabase.from("users").insert([{
          username: form.username.trim(),
          password_hash: form.password_hash || crypto.randomUUID(),
          full_name: form.full_name.trim() || null,
          email: form.email.trim() || null,
          role: form.role,
        }]);
        if (error) throw new Error(error.message);
        if (form.email.trim()) {
          const { error: fnError } = await supabase.functions.invoke("create-auth-user", { body: { email: form.email.trim() } });
          if (fnError) console.warn("Auth user creation failed:", fnError.message);
        }
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async id => {
    await supabase.from("users").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchUsers();
  };

  const handleBulkDelete = async () => {
    await supabase.from("users").delete().in("id", Array.from(selected));
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
      const { error } = await supabase
        .from("users")
        .update({ password_hash: newPassword })
        .eq("id", editUser.id);
      if (error) throw error;

      setChangePassModal(false);
      setNewPassword("");
      setConfirmPassword("");
      fetchUsers();
    } catch (err) {
      setPassError(err.message);
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
    if (role === "viewer")     return <span className="tbl-pill" style={{ background: "#e0e7ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}>viewer</span>;
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
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <h1 className="page-title">
          <i className="fa-solid fa-users" style={{ marginRight: "0.5rem", color: "var(--brand)" }} />
          Users
        </h1>
      </div>

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username, email..." />
        </div>

        <div className="filter-group">
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
        </div>

        {selected.size > 0 && (
          <button type="button" className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)", gap: 5 }} onClick={() => setBulkConfirm(true)}>
            <i className="fa-solid fa-trash" /> Delete {selected.size}
          </button>
        )}

        <button type="button" className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={openAdd}>
          <i className="fa-solid fa-plus" /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th style={{ width: 36, paddingRight: 0 }}>
                <input type="checkbox" className="tbl-checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll} />
              </th>
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
                <td style={{ paddingRight: 0 }}>
                  <input type="checkbox" className="tbl-checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} />
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font)", fontWeight: 600, fontSize: 14, color: "rgb(20,22,23)" }}>{u.username}</span>
                </td>
                <td style={{ fontFamily: "var(--font)", fontWeight: 400, fontSize: 13, color: "rgb(90,85,80)" }}>{u.full_name || "-"}</td>
                <td style={{ fontFamily: "var(--font)", fontWeight: 400, fontSize: 13, color: "rgb(90,85,80)" }}>{u.email || "-"}</td>
                <td>{roleBadge(u.role)}</td>
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
                        <button type="button" className="icon-btn" title="Edit" onClick={() => openEdit(u)}>
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button type="button" className="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(u.id)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="table-empty">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={closeModal} title={editUser ? "Edit User" : "Add User"}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username <span style={{ color: "var(--danger)" }}>*</span></label>
            <input className="form-input" type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>

          {!editUser ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 5px" }}>
                Optional - user can set their own password via Forgot Password.
              </p>
              <div className="input-wrap">
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  value={form.password_hash}
                  onChange={e => setForm({ ...form, password_hash: e.target.value })}
                  style={{ paddingRight: "2.5rem" }}
                  placeholder="Optional"
                />
                <button type="button" className="input-eye-btn" onClick={() => setShowPassword(s => !s)}>
                  <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
                </button>
              </div>
            </div>
          ) : (
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email <span style={{ color: "var(--danger)" }}>*</span></label>
            <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {!editUser && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.3rem" }}>
                A Supabase Auth account will be created so the user can reset their password.
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

          {formError && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation" /> {formError}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
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






