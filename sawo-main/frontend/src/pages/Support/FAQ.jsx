//pages/Support/FAQ.jsx

import React, { useState, useRef, useEffect } from "react";
import heroBg from "../../assets/Support/FAQ/hero.webp";
import faqImage from "../../assets/Support/FAQ/faq1.webp";
import HeroWave from "../../components/HeroWave";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import SEO from "../../components/SEO";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

// ─── DATA ────────────────────────────────────────────────────────────────────
// Only the structural (non-translatable) bits stay here — icon per section,
// keyed by the same `id` used in support.json's faq.sections so the two can
// be zipped together at render time. title/items text lives in the JSON.
const FAQ_SECTION_ICONS = {
  "finnish-sauna": "fas fa-fire",
  "building-installation": "fas fa-hammer",
  "sauna-heater": "fas fa-bolt",
  "using-sauna": "fas fa-spa",
};

// ─── ACCORDION ITEM ──────────────────────────────────────────────────────────

function AccordionItem({ question, answer, isOpen, onToggle, index }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen, answer]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        borderLeft: `5px solid ${isOpen ? "#8b5e3c" : "#a67853"}`,
        boxShadow: isOpen
          ? "0 8px 28px rgba(139,94,60,0.16)"
          : "0 3px 12px rgba(139,94,60,0.08)",
        transition: "box-shadow 0.35s ease, border-color 0.35s ease",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Number badge */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: isOpen
              ? "linear-gradient(135deg,#8b5e3c,#a67853)"
              : "rgba(166,120,83,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.3s ease",
          }}
        >
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: isOpen ? "#fff" : "#a67853",
              transition: "color 0.3s ease",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: isOpen ? "#8b5e3c" : "#3a2a1e",
            flex: 1,
            lineHeight: 1.4,
            transition: "color 0.3s ease",
          }}
        >
          {question}
        </span>

        {/* Plus/X toggle icon */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: isOpen
              ? "linear-gradient(135deg,#8b5e3c,#a67853)"
              : "rgba(166,120,83,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.35s ease",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <i
            className="fas fa-plus"
            style={{
              fontSize: "0.7rem",
              color: isOpen ? "#fff" : "#a67853",
              transition: "color 0.3s ease",
            }}
          />
        </div>
      </button>

      {/* Smooth height-animated body */}
      <div
        style={{
          height: `${height}px`,
          overflow: "hidden",
          transition: "height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          ref={bodyRef}
          style={{
            padding: "0 20px 20px 62px",
            borderTop: "1px solid rgba(166,120,83,0.1)",
          }}
        >
          {answer.split("\n\n").map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "0.88rem",
                fontWeight: 300,
                color: "#000",
                lineHeight: 1.75,
                margin: i === 0 ? "14px 0 0" : "10px 0 0",
              }}
            >
              {para.split("\n").map((line, j, arr) => (
                <React.Fragment key={j}>
                  {line}
                  {j < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function FAQ() {
  const [activeTab, setActiveTab] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);
  const heroLoaded = useHeroLoaded(heroBg);
  const t = useLocaleT("support");
  const localize = useLocalizedPath();

  const faqSections = t("faq.sections", { returnObjects: true }).map(s => ({
    ...s,
    icon: FAQ_SECTION_ICONS[s.id],
  }));
  const section = faqSections[activeTab];

  const handleTabChange = (i) => {
    if (i === activeTab) return;
    setOpenIndex(null);
    setActiveTab(i);
  };

  const handleToggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div style={{ fontFamily: "Montserrat, sans-serif" }}>
      <SEO
        title={t("faq.meta.title")}
        description={t("faq.meta.description")}
        path={localize("/support/faq")}
        hreflangAlternates={{ en: "/support/faq", zh: "/zh/support/faq" }}
      />
      <style>{`

        .faq-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 50px;
          border: 2px solid rgba(166,120,83,0.25);
          background: transparent;
          cursor: pointer;
          font-family: Montserrat, sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #a67853;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .faq-tab-btn:hover {
          border-color: #a67853;
          background: rgba(166,120,83,0.06);
        }
        .faq-tab-btn.active {
          background: linear-gradient(135deg,#8b5e3c,#a67853);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 6px 18px rgba(139,94,60,0.28);
        }

        .faq-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (max-width: 960px) {
          .faq-body-grid { grid-template-columns: 1fr !important; }
          .faq-image-panel { display: none !important; }
        }
        .faq-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.38);
          z-index: 0;
        }
        .faq-hero-content {
          position: relative;
          z-index: 1;
        }
        .faq-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .faq-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }
        @media (max-width: 768px) {
          .faq-hero-title { font-size: 28px; line-height: 36px; }
          .faq-hero-subtitle { font-size: 16px; line-height: 28px; }
        }
        @media (max-width: 600px) {
          .faq-tab-btn { padding: 9px 14px; font-size: 0.75rem; }
          .faq-tab-btn span.tab-label { display: none; }
          .faq-outer { padding: 40px 20px 60px !important; }
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="faq-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }} // warm-dark placeholder so it doesn't flash gray before the hero image decodes
      >
        {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />
        <div className="faq-hero-overlay" />
        <div className="faq-hero-content">
          <h1 className="faq-hero-title">{t("faq.hero.title")}</h1>
          <p className="faq-hero-subtitle">{t("faq.hero.subtitle")}</p>
        </div>
      <HeroWave />
      </section>

      {/* ── MAIN BODY ──────────────────────────────────────────── */}
      <section
        className="faq-outer"
        style={{ maxWidth:1200, margin:"0 auto", padding:"56px 40px 80px" }}
      >
        {/* Tab row */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 44,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {faqSections.map((s, i) => (
            <button
              key={s.id}
              className={`faq-tab-btn${activeTab === i ? " active" : ""}`}
              onClick={() => handleTabChange(i)}
            >
              <i className={s.icon} />
              <span className="tab-label">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Two-column body */}
        <div
          className="faq-body-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 50,
            alignItems: "start",
          }}
        >
          {/* ── Left: Accordions ── */}
          <div>
            {/* Section heading */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#8b5e3c,#a67853)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(139,94,60,0.28)",
                  flexShrink: 0,
                }}
              >
                <i className={section.icon} style={{ color:"#fff", fontSize:"1.1rem" }} />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    fontSize: "1.55rem",
                    color: "#8b5e3c",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {section.title}
                </h2>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontSize:"0.8rem", fontWeight:300, color:"#a67853" }}>
                  {section.items.length} {section.items.length === 1 ? t("faq.questionCount.one") : t("faq.questionCount.other")}
                </span>
              </div>
            </div>

            {/* Accordion list */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {section.items.map((item, i) => (
                <AccordionItem
                  key={`${section.id}-${i}`}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === i}
                  onToggle={() => handleToggle(i)}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* ── Right: Image panel ── */}
          <div
            className="faq-image-panel"
            style={{ position:"sticky", top:24 }}
          >
            {/* Main image */}
            <div
              style={{
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 12px 36px rgba(139,94,60,0.18)",
                marginBottom: 20,
                aspectRatio: "4/3",
              }}
            >
              <img
                src={faqImage}
                alt={t("faq.sidebar.imageAlt")}
                className="faq-main-img"
              />
            </div>

            {/* Info card */}
            <div
              style={{
                background: "linear-gradient(135deg,#8b5e3c,#a67853)",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 8px 24px rgba(139,94,60,0.22)",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <i className="fas fa-lightbulb" style={{ color:"rgba(255,255,255,0.85)", fontSize:"1rem" }} />
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#fff", letterSpacing:"0.3px" }}>
                  {t("faq.sidebar.quickHelpTitle")}
                </span>
              </div>
              <p style={{ fontFamily:"Montserrat,sans-serif", fontWeight:300, fontSize:"0.82rem", color:"rgba(255,255,255,0.82)", lineHeight:1.6, margin:0 }}>
                {t("faq.sidebar.quickHelpDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM BANNER ──────────────────────────────────────── */}
      <section style={{ padding:"0 40px 80px", maxWidth:1200, margin:"0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg,#8b5e3c 0%,#a67853 100%)",
            borderRadius: 20,
            padding: "44px 56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
            boxShadow: "0 16px 48px rgba(139,94,60,0.28)",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:"1.5rem", color:"#fff", margin:"0 0 8px" }}>
              {t("faq.banner.title")}
            </h3>
            <p style={{ fontFamily:"Montserrat,sans-serif", fontWeight:300, fontSize:"0.98rem", color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.6 }}>
              {t("faq.banner.desc")}
            </p>
          </div>
          <a
            href={localize("/contact")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 30px",
              background: "#fff",
              color: "#a67853",
              fontFamily: "Montserrat, sans-serif",
              fontSize: "0.88rem",
              fontWeight: 700,
              borderRadius: 8,
              textDecoration: "none",
              border: "2px solid transparent",
              transition: "all 0.3s ease",
              letterSpacing: "0.4px",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#a67853";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {t("faq.banner.cta")} <i className="fas fa-chevron-right" style={{ fontSize:"0.75rem" }} />
          </a>
        </div>
      </section>
    </div>
  );
}