import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function GDPRConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem("gdpr-consent");
    if (!consentGiven) {
      // Delay so the banner doesn't compete with critical page rendering
      const t = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("gdpr-consent", "accepted");
    localStorage.setItem("gdpr-consent-date", new Date().toISOString());
    setShowBanner(false);
    setShowModal(false);
  };

  const handleRejectEssential = () => {
    localStorage.setItem("gdpr-consent", "essential-only");
    localStorage.setItem("gdpr-consent-date", new Date().toISOString());
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Floating Banner - appears at bottom */}
      {showBanner && !showModal && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#1a1a1a",
            color: "#ffffff",
            padding: "20px 24px",
            zIndex: 9998,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 250 }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "0.9rem", fontWeight: 600, color: "#c4a882" }}>
                  Data & Privacy
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#b0b0b0", lineHeight: 1.5 }}>
                  We use Supabase to store your data securely. By continuing, you agree to our data usage.
                  <Link to="/privacy-policy" style={{ color: "#c4a882", textDecoration: "none", fontWeight: 600, marginLeft: 4 }}>
                    View our Privacy Policy
                  </Link>
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  onClick={handleRejectEssential}
                  style={{
                    padding: "10px 18px",
                    background: "transparent",
                    border: "1px solid #c4a882",
                    color: "#c4a882",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.background = "#c4a882";
                    e.currentTarget.style.background = "#c4a882";
                    e.currentTarget.style.color = "#1a1a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#c4a882";
                  }}
                >
                  Essential Only
                </button>

                <button
                  onClick={handleAccept}
                  style={{
                    padding: "10px 18px",
                    background: "#a67853",
                    border: "1px solid #a67853",
                    color: "#ffffff",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#9d7554";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#a67853";
                  }}
                >
                  Accept All
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    padding: "10px 18px",
                    background: "transparent",
                    border: "1px solid #666",
                    color: "#999",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#c4a882";
                    e.currentTarget.style.borderColor = "#c4a882";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#999";
                    e.currentTarget.style.borderColor = "#666";
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
            fontFamily: "'Montserrat', sans-serif",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: 32,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#a67853", margin: "0 0 16px 0" }}>
              Your Privacy & Data
            </h2>

            <div style={{ color: "#333", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>What We Collect</h3>
                <p style={{ margin: 0, color: "#666" }}>
                  We collect information you provide when signing up, contacting us, or using our services. This includes your name, email, and account preferences.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>How We Use It</h3>
                <p style={{ margin: 0, color: "#666" }}>
                  Your data is securely stored in Supabase and used to provide our services, send important updates, and improve your experience.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>Your Rights</h3>
                <p style={{ margin: 0, color: "#666" }}>
                  You have the right to access, update, or delete your personal data at any time. <Link to="/privacy-policy" style={{ color: "#a67853", textDecoration: "none", fontWeight: 600 }}>Read our full Privacy Policy</Link>.
                </p>
              </div>

              <div style={{ marginBottom: 20, padding: 12, background: "#f5f5f5", borderRadius: 8 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>Essential Cookies</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                  These are necessary for our site to work properly. They include authentication and session cookies. Always enabled.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 18px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  color: "#333",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Go Back
              </button>

              <button
                onClick={handleRejectEssential}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid #a67853",
                  color: "#a67853",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Essential Only
              </button>

              <button
                onClick={handleAccept}
                style={{
                  padding: "10px 18px",
                  background: "#a67853",
                  border: "1px solid #a67853",
                  color: "#ffffff",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
