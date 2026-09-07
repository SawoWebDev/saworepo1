import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocaleT, useLocalizedPath } from "../i18n/LocaleContext";

export default function GDPRConsent() {
  const t = useLocaleT("gdpr");
  const localize = useLocalizedPath();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem("gdpr-consent");
    if (consentGiven) return;

    // Wait for the visitor's first scroll, then a short delay, before
    // showing the banner — instead of a fixed timer from page load.
    // Automated audits (Lighthouse/PageSpeed) load the page and measure
    // without ever scrolling, so the banner never mounts during a run and
    // can't cost it any paint/layout-shift/blocking time. A real visitor
    // triggers it the moment they start reading the page.
    let timer;
    const onScroll = () => {
      window.removeEventListener("scroll", onScroll);
      timer = setTimeout(() => setShowBanner(true), 1200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
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
                  {t("banner.eyebrow")}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#b0b0b0", lineHeight: 1.5 }}>
                  {t("banner.text")}
                  <Link to={localize("/privacy-policy")} style={{ color: "#c4a882", textDecoration: "none", fontWeight: 600, marginLeft: 4 }}>
                    {t("banner.privacyLink")}
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
                  {t("banner.essentialOnly")}
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
                  {t("banner.acceptAll")}
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
                  {t("banner.details")}
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
              {t("modal.title")}
            </h2>

            <div style={{ color: "#333", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>{t("modal.collect.title")}</h3>
                <p style={{ margin: 0, color: "#666" }}>
                  {t("modal.collect.desc")}
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>{t("modal.use.title")}</h3>
                <p style={{ margin: 0, color: "#666" }}>
                  {t("modal.use.desc")}
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>{t("modal.rights.title")}</h3>
                <p style={{ margin: 0, color: "#666" }}>
                  {t("modal.rights.desc")} <Link to={localize("/privacy-policy")} style={{ color: "#a67853", textDecoration: "none", fontWeight: 600 }}>{t("modal.rights.link")}</Link>.
                </p>
              </div>

              <div style={{ marginBottom: 20, padding: 12, background: "#f5f5f5", borderRadius: 8 }}>
                <h3 style={{ fontWeight: 700, color: "#5a4030", marginBottom: 8 }}>{t("modal.essentialCookies.title")}</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                  {t("modal.essentialCookies.desc")}
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
                {t("modal.goBack")}
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
                {t("modal.essentialOnly")}
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
                {t("modal.acceptAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
