//pages/Support/FAQ.jsx

import React, { useState, useRef, useEffect } from "react";
import heroBg from "../../assets/Support/FAQ/hero.webp";
import faqImage from "../../assets/Support/FAQ/faq1.webp";
import HeroWave from "../../components/HeroWave";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import SEO from "../../components/SEO";

// ─── DATA ────────────────────────────────────────────────────────────────────

const faqSections = [
  {
    id: "finnish-sauna",
    title: "Finnish Sauna",
    icon: "fas fa-fire",
    items: [
      {
        question: "What is the heat source in a sauna?",
        answer:
          "The heat source in a sauna is often powered by a central heater that warms a bed of sauna stones. There are two main types of sauna heaters:\n\nElectric Heaters: The most popular option today. They are incredibly convenient, heat up quickly, and allow you to easily control the exact temperature of your sauna.\n\nWood-Burning Heaters: The traditional method, which relies on a wood fire to heat the space.\n\nOnce the stones are hot, you can customize your experience by ladling water over them. This creates a soothing burst of steam that instantly intensifies the heat before slowly settling back down.",
      },
      {
        question: "What is the best wood for a sauna?",
        answer:
          "The best woods for a sauna are softwoods like Western Red Cedar, Common Aspen, and Finnish Spruce. Often sourced from the northern countries, these woods naturally insulate heat and tolerate extreme moisture changes without warping or shrinking. Importantly, they stay cool to the touch, ensuring sauna benches remain comfortable to sit on even when room temperatures reach 70–80°C (158–176°F).\n\nHere is why these three softwoods are top choices:\n\nWestern Red Cedar: Known for its warm reddish color and fine-grained texture, cedar is exceptionally durable against moisture, making it a perfect choice for outdoor saunas. It also produces a strong, natural scent that repels insects and mold while helping you relax.\n\nCommon Aspen: If you want an elegant, modern look, aspen offers a smooth, creamy white, knot-free finish. This wood species is highly resistant to moisture, bacteria, and fungi, making it a fantastic, hygienic option for commercial or high-use public saunas.\n\nFinnish Spruce: A staple in traditional saunas in Finland, spruce features a light-yellow tone with a uniform grain and small, healthy knots. It is highly durable under high heat and releases a pleasant, forest-like aroma that enhances the breathing and relaxation experience.",
      },
      {
        question: "What is a Finnish sauna?",
        answer:
          "A traditional Finnish sauna is a wood-lined room designed for deep relaxation, powered by a central heater that warms a bed of stones.\n\nWhat truly defines a Finnish sauna is the authentic tradition of löyly, the act of ladling water over the hot stones. This releases a rejuvenating burst of steam that envelops the room, temporarily intensifying the heat and humidity before gently subsiding.\n\nBeyond simply feeling great, regular sauna bathing is a proven wellness practice. Enjoying this cycle of soothing heat naturally helps to:\n\n• Support heart health and cardiovascular function\n• Improve mental well-being and reduce stress\n• Give your immune system a healthy boost",
      },
    ],
  },
  {
    id: "building-installation",
    title: "Building & Installation",
    icon: "fas fa-hammer",
    items: [
      {
        question: "Where is an ideal sauna location?",
        answer:
          "The ideal sauna location is a dry, well-ventilated space with waterproof flooring, such as concrete, tile, ceramic, or vinyl. To ensure your sauna functions perfectly and remains easy to maintain, keep these key installation factors in mind:\n\n• Proper Ventilation: Good airflow is essential. It guarantees that any minor condensation from the sauna dries completely after your session.\n• Floor Drainage: Installing a floor drain is highly recommended for convenient cleaning and water management.\n• Wall Clearance: An active sauna will cause a minor temperature increase in the immediate vicinity. If you are installing a modular indoor sauna, always leave a small gap between the sauna exterior and your home's interior walls to allow for adequate air circulation.",
      },
      {
        question: "Why are there upper and lower benches in a sauna?",
        answer:
          "The temperature inside a sauna is higher near the ceiling and cooler near the floor because heat naturally rises. Tiered sauna benches are installed at different heights so that bathers can easily customize their experience and choose the heat level that feels most comfortable for them.",
      },
      {
        question: "How do you protect the wood panels from moisture?",
        answer:
          "The most effective way to protect the sauna's wood panels is through proper ventilation and allowing the room to dry completely after every session.\n\nYou should never apply paint, sealants, or preservatives to the interior wood. Because sauna wood naturally expands and contracts with the changing heat and humidity, any surface-level coatings will quickly crack, blister, and peel off. To keep your sauna in top condition, it is always best to leave the interior wood completely bare so it can naturally breathe.",
      },
      {
        question: "What are the requirements for a sauna floor?",
        answer:
          "The primary requirement for a sauna floor is that it must be completely waterproof. A non-porous surface ensures the room remains hygienic and is easy to wash and maintain. Excellent flooring materials include tile, concrete, ceramic, or heavy-duty vinyl, as these options are fully water-resistant and will not absorb moisture.",
      },
      {
        question: "Is a floor drain in a sauna required?",
        answer:
          "We highly recommend having a floor drain in your sauna. While it is not strictly required, installing a floor drain makes the cleaning and maintenance of the sauna significantly easier as it helps drain excess water after ladling out hot stones.",
      },
    ],
  },
  {
    id: "sauna-heater",
    title: "Sauna Heater",
    icon: "fas fa-bolt",
    items: [
      {
        question: "Can I get electric shock from a heater?",
        answer:
          "A properly installed sauna heater poses almost no risk of electric shock. To guarantee safe operation, a qualified electrician must perform the installation. Additionally, we rigorously test every heater before delivery to ensure it meets strict electrical safety standards.",
      },
    ],
  },
  {
    id: "using-sauna",
    title: "Using Sauna",
    icon: "fas fa-spa",
    items: [
      {
        question: "How long is the heating time?",
        answer:
          "When the sauna has proper insulation, and vents and doors are closed, the heating time is less than an hour. This depends on also on which heater you have.",
      },
      {
        question: "What is the best temperature in sauna?",
        answer:
          "The recommended temperature in sauna is from 60-90 Celsius, but this depends on your own preference.",
      },
      {
        question: "Why are sauna stones important?",
        answer:
          "The main purpose of the sauna stones in the heater is to store enough energy to efficiently vaporize the water thrown on top of the stones to create temperature increase in the sauna. The stones must be removed at least once a year or every 500 hours which ever occurs first. All crumbles must be removed from the heater and replaced with new ones, as described in the heater manual.\n\nNever use the heater without stones as it may cause fire. Use only manufacturer recommended SAWO-stones. Using unsuitable stones may lead to heating element damage and will void the warranty. Never use ceramic stones or other artificial stones of any type!",
      },
      {
        question: "What are the requirements for water thrown to sauna stones?",
        answer:
          "Water thrown onto the sauna stones needs to be suitable for household consumption. Chlorinated water (e.g. from the swimming pool or jacuzzi) or seawater can cause damages for heater and heating elements.",
      },
      {
        question: "How to do sauna maintenance?",
        answer:
          "SAUNA MAINTENANCE FOR EVERY SAUNA SESSION\nUse bench towels during sauna for the purpose of keeping benches well-looking longer.\nAfter sauna session, leave the heater on for 30 minutes to make sauna dry faster from the moisture. Lastly, open the air vents and sauna door to let the sauna ventilate properly.\nEmpty pail from water, and lift the ladle to bench. This will help on preventing cracks on wooden accessories, and keep the sauna fresh.\n\nSAUNA MAINTENANCE AT LEAST 1 to 4 TIMES PER YEAR:\nCheck the sauna stones in the heater. Clean possible stone dust and crumbs from the bottom of the heater. Remove stones and replace disintegrated ones. Last reload stones back to the heater. Checking the stones from time to time will help to increase the lifespan of heating elements as well as saving energy.\nCheck heating elements. In case there are any cracks or elements are bent, replace all elements. Do not replace only one.\nWash the overall surfaces of sauna benches, ceiling, floor and walls with warm water, soft brush and multi-purpose detergent. However, do not use detergent with ammonia or chlorine. Rinse surfaces with cold water and let sauna ventilate well. If needed, you can apply wood treatment oil, suitable for sauna use, such as paraffin oil to the benches.\nIf washing doesn't get the benches clean, sand the benches with sandpaper. Protect benches with wood oil suitable for sauna use. Follow the wood oil instructions and avoid using the sauna before the oil has dried properly.\nWhenever needed, use mild soap water to clean any calcium stains or other dirt from the heater cover. You can also use SAWO Decalcifying solution. Dry after wash.\nClean glass surfaces with window cleaning agent or dish soap. If needed rinse, then dry with a squeegee or microfiber cloth.\nCheck screws (door, sauna benches, railings) and tighten up if necessary.\nClean the floor drain.",
      },
      {
        question: "How often to use sauna?",
        answer:
          "As often as you like. But most people go to the sauna twice or three times a week, usually in the evenings to relax after a hard day's work.",
      },
      {
        question: "How long should I stay in sauna?",
        answer:
          "You can stay in sauna as long as you feel comfortable. Leave the sauna to cool off immediately if you start to feel uncomfortable.",
      },
      {
        question: "When should I not use the sauna?",
        answer:
          "Do not use sauna with a full stomach or under the influence of alcohol. People with heart problems or acute illnesses should consult a doctor before taking a sauna.",
      },
      {
        question: "Can small children go to sauna?",
        answer:
          "Children can safely enjoy a sauna under close adult supervision. For their first few visits, keep sessions brief — just a few minutes — and maintain a moderate temperature. Because heat rises, always have children sit on the lower benches where the air is much cooler.",
      },
    ],
  },
];

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
        title="Frequently Asked Questions"
        description="Answers to common questions about SAWO Finnish saunas, heaters, steam generators, and sauna care, from heat sources to wood types."
        path="/support/faq"
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
          <h1 className="faq-hero-title">FAQ</h1>
          <p className="faq-hero-subtitle">Frequently Asked Questions</p>
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
                  {section.items.length} {section.items.length === 1 ? "question" : "questions"}
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
                alt="FAQ"
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
                  Quick Help
                </span>
              </div>
              <p style={{ fontFamily:"Montserrat,sans-serif", fontWeight:300, fontSize:"0.82rem", color:"rgba(255,255,255,0.82)", lineHeight:1.6, margin:0 }}>
                Click any question to expand the answer. Switch between categories using the tabs above.
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
              Still have questions?
            </h3>
            <p style={{ fontFamily:"Montserrat,sans-serif", fontWeight:300, fontSize:"0.98rem", color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.6 }}>
              Our sauna experts are ready to help you with anything you need.
            </p>
          </div>
          <a
            href="/contact"
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
            CONTACT US <i className="fas fa-chevron-right" style={{ fontSize:"0.75rem" }} />
          </a>
        </div>
      </section>
    </div>
  );
}