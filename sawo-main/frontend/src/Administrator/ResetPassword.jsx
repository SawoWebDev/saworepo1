// src/Administrator/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, resetPassword } from "./supabase";
import "./admin.css";
import logo from "./SAWO-logo.webp";

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
  const [targetUsername, setTargetUsername] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");

    // A link that's already been used, expired, or was opened by an email
    // scanner before the real click never fires PASSWORD_RECOVERY at all —
    // Supabase instead redirects back here with an error in the hash/query
    // string (e.g. #error=access_denied&error_code=otp_expired). Surface
    // that immediately instead of spinning on "Verifying..." forever.
    const params = new URLSearchParams(
      window.location.hash ? window.location.hash.slice(1) : window.location.search
    );
    const linkError = params.get("error_description") || params.get("error");
    if (linkError) {
      setError(decodeURIComponent(linkError).replace(/\+/g, " "));
      return;
    }

    // Supabase automatically handles the token in the URL
    // and fires PASSWORD_RECOVERY when the user lands on this page
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
          const email = session?.user?.email;
          if (email) {
            const { data } = await supabase
              .from("users")
              .select("username")
              .eq("email", email)
              .maybeSingle();
            if (data?.username) setTargetUsername(data.username);
          }
        }
      }
    );

    // Fallback for the case the event already fired (or never will) before
    // this listener subscribed — e.g. Supabase processed the URL
    // synchronously on load. If there's already a recovery session sitting
    // there, pick it up directly instead of waiting on an event that won't
    // come again.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // If neither a session nor an error param ever shows up (link already
    // consumed, clock skew, etc.), don't spin forever — tell the user and
    // point them back to requesting a fresh link.
    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) {
          setError(
            "This reset link couldn't be verified. It may have expired or already been used — request a new one."
          );
        }
        return ready;
      });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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

  // Same shared button/footer styling as Login.jsx so the two auth screens
  // read as one flow. `.btn` is inline-flex with no justify-content, so a
  // width:100% button would otherwise render its label left-aligned.
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
        {!sessionReady && error ? (
          <div className="login-header">
            <div style={{ marginBottom: "0.75rem" }}>
              <i className="fa-solid fa-circle-exclamation"
                style={{ fontSize: "2rem", color: "#dc2626" }} />
            </div>
            <img src={logo} alt="Logo" className="login-logo" />
            <h1 className="login-title">Link Not Verified</h1>
            <p className="login-sub">{error}</p>
            <div style={footerStyle}>
              <button onClick={() => navigate("/login")}
                className="link-btn back-btn">
                <i className="fa-solid fa-chevron-left" /> Back to login
              </button>
            </div>
          </div>
        ) : success ? (
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
            <div style={footerStyle}>
              <button onClick={() => navigate("/login")}
                className="link-btn back-btn">
                <i className="fa-solid fa-chevron-left" /> Back to login
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="login-header">
              <img src={logo} alt="Logo" className="login-logo" />
              <h1 className="login-title">Set New Password</h1>
              {sessionReady ? (
                <p className="login-status login-status--ready">
                  <i className="fa-solid fa-circle-check" />
                  Link verified. Enter your new password{targetUsername ? ` for ${targetUsername}` : ""}
                </p>
              ) : (
                <p className="login-status login-status--pending">
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  Verifying reset link...
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
                style={centerButtonStyle}>
                {loading && <i className="fa-solid fa-circle-notch fa-spin" />}
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>

            <div style={footerStyle}>
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






