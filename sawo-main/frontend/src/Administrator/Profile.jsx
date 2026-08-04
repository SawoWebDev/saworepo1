// src/Administrator/Profile.jsx
//
// Self-service account page — any logged-in user can update their own
// username, full name, and password here. Deliberately has no role field:
// only a superadmin can change roles (via Users.jsx), and the database
// enforces that too (see the prevent_role_self_escalation trigger), so this
// page can't be used to smuggle a role change through even if someone
// crafted the request by hand.
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getSession } from "./supabase";
import { setPreviewRole, usePreviewRole, PREVIEWABLE_ROLES } from "./previewRole";
import { getLandingPath } from "./permissions";

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

// Per-role color, used by both the closed trigger's pill and each option
// row in the open panel — kept to the app's existing status-color tokens
// (brand/warning/success/info) rather than inventing new ones.
const ROLE_META = {
  superadmin: { label: "Superadmin", color: "#af8564", bg: "rgba(175,133,100,0.13)" },
  admin:      { label: "Admin",      color: "#b8860b", bg: "rgba(184,134,11,0.12)" },
  editor:     { label: "Editor",     color: "#2e7d52", bg: "rgba(46,125,82,0.12)" },
  viewer:     { label: "Viewer",     color: "#1a6fa8", bg: "rgba(26,111,168,0.1)" },
};

function RolePill({ role }) {
  const meta = ROLE_META[role] || ROLE_META.admin;
  return (
    <span className="role-pill" style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}33` }}>
      <span className="role-pill-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

// Custom-styled replacement for a plain <select> — colored pill per role
// (matching the Users.jsx role badges' visual language) plus a panel that
// matches the app's own modal treatment instead of the browser's native
// dropdown chrome.
function RoleSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="role-select-wrap" ref={wrapRef} style={{ maxWidth: 260 }}>
      <button
        type="button"
        className={`role-select-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <RolePill role={value} />
        <i className="fa-solid fa-chevron-down role-select-chevron" />
      </button>
      {open && (
        <div className="role-select-panel" role="listbox">
          {options.map(opt => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`role-select-option${selected ? " is-selected" : ""}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <RolePill role={opt.value} />
                  {opt.isYou && <span className="role-select-option-you">(you)</span>}
                </span>
                {selected && <i className="fa-solid fa-check role-select-option-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Profile({ currentUser }) {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

  const [username, setUsername] = useState(currentUser?.username || "");
  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Preview-as-role (superadmin only) — moved here from the sidebar. Reads
  // the REAL role from the session, not currentUser.role, which AdminLayout
  // overwrites with the previewed role.
  const navigate = useNavigate();
  const realRole = getSession()?.user?.role;
  // Shared store — the sidebar badge subscribes to the same value, so it
  // updates the instant this select changes.
  const previewRole = usePreviewRole();

  const resetPasswordFields = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const handleChangePreview = (role) => {
    setPreviewRole(role);
    // Land somewhere the newly-previewed role can actually see.
    navigate(getLandingPath(role || realRole));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      addToast("Username is required", "error");
      return;
    }
    setDetailsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ username: username.trim(), full_name: fullName.trim() || null })
        .eq("id", currentUser.id);
      if (error) throw new Error(error.message);

      // Keep the locally cached session in sync so the sidebar/topbar
      // reflect the change immediately, without waiting for next login.
      const usingLocalStorage = localStorage.getItem("sawo_token") !== null;
      const storage = usingLocalStorage ? localStorage : sessionStorage;
      const updatedUser = { ...currentUser, username: username.trim(), full_name: fullName.trim() || null };
      storage.setItem("sawo_user", JSON.stringify(updatedUser));

      addToast("Profile updated.", "success");
    } catch (err) {
      addToast(err.message || "Failed to update profile", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      // Always a real, live session by this point — login no longer
      // succeeds at all for an account that hasn't set a real password.
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw new Error(authError.message);

      const { error: dbError } = await supabase.rpc("set_user_password", {
        p_user_id: currentUser.id,
        p_new_password: newPassword,
      });
      if (dbError) throw new Error("Password updated but failed to sync: " + dbError.message);

      resetPasswordFields();
      addToast("Password changed.", "success");
    } catch (err) {
      addToast(err.message || "Failed to change password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
      <Toast toasts={toasts} remove={removeToast} />

      <div className="card card-body" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 14px", color: "var(--text)", fontSize: "1.05rem", fontWeight: 700 }}>Account Details</h3>
        <form onSubmit={handleSaveDetails} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username</label>
            <input className="form-input" type="text" required value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={detailsLoading} style={{ width: "fit-content" }}>
            {detailsLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="card card-body" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 4px", color: "var(--text)", fontSize: "1.05rem", fontWeight: 700 }}>Password</h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.55, margin: "0 0 14px" }}>
          Choose a new password for your account.
        </p>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password</label>
            <div className="input-wrap">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ paddingRight: "2.5rem" }}
              />
              <button type="button" className="input-eye-btn" onClick={() => setShowPassword(s => !s)}>
                <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
              </button>
            </div>
            <p className="form-helper">At least 6 characters.</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={passwordLoading} style={{ width: "fit-content" }}>
            {passwordLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Preview as role — superadmin only. Moved here from the sidebar so
          the nav stays clean; the exit affordance lives on the sidebar's
          role line while a preview is active. */}
      {realRole === "superadmin" && (
        <div className="card card-body" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 4px", color: "var(--text)", fontSize: "1.05rem", fontWeight: 700 }}>Preview as role</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.55, margin: "0 0 14px" }}>
            See the CMS the way another role would, without a second account.
            This only changes what is shown. Your real {realRole} access is
            unchanged underneath.
          </p>
          <RoleSelect
            value={previewRole || "superadmin"}
            options={[
              { value: "superadmin", isYou: true },
              ...PREVIEWABLE_ROLES.map((r) => ({ value: r })),
            ]}
            onChange={(v) => handleChangePreview(v === "superadmin" ? null : v)}
          />
        </div>
      )}
    </div>
  );
}
