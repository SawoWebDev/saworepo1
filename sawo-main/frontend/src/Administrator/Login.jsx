// src/Administrator/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiLogin, saveSession, forgotPassword, getSession } from "./supabase";
import { getLandingPath } from "./permissions";
import "./admin.css";
import logo from "./SAWO-logo.webp";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const autoReturnTimer = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");

    // Arriving here with a username to prefill (e.g. redirected from a
    // "you need to reset your password" prompt elsewhere in the CMS) — open
    // straight to the forgot-password form instead of the login form.
    if (location.state?.prefillForgotUsername) {
      setForgotUsername(location.state.prefillForgotUsername);
      setShowForgot(true);
      return;
    }

    const session = getSession();
    if (session) navigate(getLandingPath(session.user?.role));
  }, [navigate, location.state]);

  // Once a reset link has been sent (either the user clicked "Forgot
  // password?" themselves, or it was sent automatically after an
  // unverified-account login attempt below), return to the plain login form
  // on its own after a few seconds rather than leaving them stranded on the
  // confirmation screen.
  useEffect(() => {
    if (!forgotStatus) return;
    autoReturnTimer.current = setTimeout(() => {
      setShowForgot(false);
      setForgotStatus("");
      setForgotUsername("");
    }, 3000);
    return () => clearTimeout(autoReturnTimer.current);
  }, [forgotStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoggingIn(true);
    try {
      // A correct password now always results in a real session — apiLogin
      // repairs an out-of-sync Auth password itself rather than bouncing a
      // already-verified user into the reset-email flow.
      const { user, token } = await apiLogin(username, password);

      saveSession(token, user, remember);
      // Role-aware landing — a viewer has no Dashboard and would otherwise
      // get bounced off it straight to Products anyway.
      navigate(getLandingPath(user?.role));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoggingIn(false);
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
              <button type="submit" className="btn btn-primary" style={centerButtonStyle} disabled={loggingIn}>
                {loggingIn ? "Signing in..." : "Login"}
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
                  disabled={!!forgotStatus}
                  required
                />
              </div>

              {forgotStatus && <div className="alert alert-success">{forgotStatus}</div>}
              {forgotError && <div className="alert alert-error">{forgotError}</div>}

              {!forgotStatus && (
                <button
                  className="btn btn-primary"
                  style={centerButtonStyle}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              )}

              <div style={footerStyle}>
                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotStatus(""); setForgotError(""); }}
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
