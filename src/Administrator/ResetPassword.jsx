// src/Administrator/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, resetPassword } from "./supabase";
import "./admin.css";
import logo from "./SAWO-logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");

    // Supabase automatically handles the token in the URL
    // and fires PASSWORD_RECOVERY when the user lands on this page
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event);
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // No token param needed - Supabase session handles it
      await resetPassword(password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {success ? (
          <div className="login-header">
            <div style={{ marginBottom: "0.75rem" }}>
              <i className="fa-solid fa-circle-check"
                style={{ fontSize: "2rem", color: "#16a34a" }} />
            </div>
            <img src={logo} alt="Logo" className="login-logo" />
            <h1 className="login-title">Password Updated</h1>
            <p className="login-sub">
              Your password has been reset. Redirecting to login...
            </p>
            <button onClick={() => navigate("/login")}
              className="link-btn back-btn">
              <i className="fa-solid fa-chevron-left" /> Back to login
            </button>
          </div>
        ) : (
          <>
            <div className="login-header">
              <img src={logo} alt="Logo" className="login-logo" />
              <h1 className="login-title">Set New Password</h1>
              {!sessionReady && (
                <p className="login-sub" style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
                  Å│ Verifying reset link...
                </p>
              )}
              {sessionReady && (
                <p className="login-sub" style={{ color: "#16a34a", fontSize: "0.85rem" }}>
                  £ Link verified - enter your new password
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!sessionReady}
                    required
                  />
                  <button type="button" className="input-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}>
                    <i className={showPassword
                      ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    className="form-input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={!sessionReady}
                    required
                  />
                  <button type="button" className="input-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}>
                    <i className={showConfirm
                      ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
                  </button>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary"
                disabled={loading || !sessionReady}
                style={{ width: "100%" }}>
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>

            <div className="login-footer">
              <button onClick={() => navigate("/login")}
                className="link-btn back-btn">
                <i className="fa-solid fa-chevron-left" /> Back to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}






