// src/Administrator/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, saveSession, forgotPassword, getSession } from "./supabase";
import "./admin.css";
import logo from "./SAWO-logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

useEffect(() => {
  document.documentElement.setAttribute("data-theme", "light");
  if (getSession()) navigate("/admin/products");
}, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { user, token } = await apiLogin(username, password);
      saveSession(token, user, remember);
      navigate("/admin/products");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotStatus("");
    setForgotLoading(true);
    try {
      const email = await forgotPassword(forgotUsername);
      setForgotStatus(`Reset link sent to ${email}`);
      setForgotUsername("");
    } catch (err) {
      setForgotError(err.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  // Shared button style for centering
  const centerButtonStyle = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "0.65rem 1rem",
    marginTop: "0.6rem",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const footerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "1rem",
    gap: "0.5rem",
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo + Title */}
        <div className="login-header">
          <img src={logo} alt="SAWO Logo" className="login-logo" />
          <h1 className="login-title">SAWO CMS</h1>
        </div>

        {!showForgot ? (
          <>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
                  </button>
                </div>
              </div>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>

              {error && <div className="alert alert-error">{error}</div>}

              {/* Centered Login Button */}
              <button type="submit" className="btn btn-primary" style={centerButtonStyle}>
                Login
              </button>
            </form>

            <div style={footerStyle}>
              {/* Forgot Password */}
              <button onClick={() => setShowForgot(true)} className="link-btn">
                Forgot password?
              </button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  required
                />
              </div>

              {forgotStatus && <div className="alert alert-success">{forgotStatus}</div>}
              {forgotError && <div className="alert alert-error">{forgotError}</div>}

              {/* Centered Send Reset Link Button */}
              <button
                className="btn btn-primary"
                style={centerButtonStyle}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>

              <div style={footerStyle}>
                {/* Back to Login */}
                <button
                  onClick={() => setShowForgot(false)}
                  className="link-btn back-btn"
                >
                  Back to login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}






