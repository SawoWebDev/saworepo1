// src/Administrator/Profile.jsx
//
// Self-service account page — any logged-in user can update their own
// username, full name, and password here. Deliberately has no role field:
// only a superadmin can change roles (via Users.jsx), and the database
// enforces that too (see the prevent_role_self_escalation trigger), so this
// page can't be used to smuggle a role change through even if someone
// crafted the request by hand.
import React, { useState } from "react";
import { supabase } from "./supabase";

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

      setNewPassword("");
      setConfirmPassword("");
      addToast("Password changed.", "success");
    } catch (err) {
      addToast(err.message || "Failed to change password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleBadge = role => {
    if (role === "superadmin") return <span className="tbl-pill tbl-pill-cat">{role}</span>;
    if (role === "editor")     return <span className="tbl-pill tbl-pill-tag">{role}</span>;
    if (role === "viewer")     return <span className="tbl-pill tbl-pill-info">viewer</span>;
    return <span className="tbl-pill tbl-pill-more">{role}</span>;
  };

  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
      <Toast toasts={toasts} remove={removeToast} />

      <div className="card card-body" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 4px" }}>Account Details</h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-3)", margin: "0 0 14px" }}>
          Your role is {roleBadge(currentUser?.role)} — only a superadmin can change this.
        </p>
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
        <h3 style={{ margin: "0 0 4px" }}>Change Password</h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-3)", margin: "0 0 14px" }}>
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
            {passwordLoading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
