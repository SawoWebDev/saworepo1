//pages/Support/FAQ.jsx

import React, { useState, useRef, useEffect } from "react";
import heroBg from "../../assets/Support/FAQ/hero.webp";
import faq1 from "../../assets/Support/FAQ/faq1.webp";
import faq2 from "../../assets/Support/FAQ/faq2.webp";
import faq3 from "../../assets/Support/FAQ/faq3.webp";
import faq4 from "../../assets/Support/FAQ/faq4.webp";

// ─── DATA ────────────────────────────────────────────────────────────────────

const faqSections = [
  {
    id: "finnish-sauna",
    title: "Finnish Sauna",
    icon: "fas fa-fire",
    image: faq1,
    items: [
      {
        question: "What is the heat source in sauna?",
        answer:
          "The heat source in sauna is the heater, which is used for warming sauna stones either by using electricity through heating elements or by burning wood. The electric heaters are the most common option markedly for the convenience, fast heating-time and ability to modify sauna experience according to your liking.\n\nDepending on how much water is thrown to the stones, the hotter the temperature will be before starting to lower down slowly.",
      },
      {
        question: "What is the best wood for sauna?",
        answer:
          "Best wood for sauna are the softwoods, such as Western Red Cedar, Common Aspen and Spruce for sauna building. These species have excellent qualities for sauna, especially if sourced from Arctic regions such as Northern US, Canada and Scandinavia. The arctic wood species are naturally isolating heat well and tolerating changing temperatures and moisture without significant swelling or shrinking. Sauna benches made from these woods will remain cool and pleasant to sit in, even when the temperatures in sauna can increase to 70-80 degrees.\n\nWestern Red Cedar (Thuja plicata) is exceptionally beautiful wood with a natural warm reddish color, complemented with uniform fine-grained texture with a satin luster. Cedar is very durable against moisture, making it excellent choice especially for outdoor saunas. The strong scent of cedar wood not only works as a natural repellant against insects and mold but also helps to improve concentration, quality of sleep and relaxing the body.\n\nCommon Aspen: A softwood with white to creamy appearance, perfect for an elegant look. Aspen wood has creamy white knotless appearance, similar to Abachi. This wood specie is very resistant towards moisture, bacteria and fungi, hence excellent choice for commercial or public saunas.\n\nFinnish Spruce is a softwood with a close, even and uniform grain texture. It has a light-yellow appearance with few markings. Spruce is durable and can withstand heat and has small healthy knots, making it one of the most common sauna woods used in Finland. The forest-like natural aroma of spruce is said to make relaxing and breathing easier.",
      },
      {
        question: "What is Finnish sauna?",
        answer:
          "Finnish sauna basically is a room with wooden walls, ceiling and benches. The sauna has for centuries been a place for relaxation. The heart of the sauna is the heater, which is used to warm stones either by using electricity or by burning wood. Unquestionably, what makes a sauna — a Finnish sauna is the act of pouring water from pail to stones. This is called \"löyly\" in Finnish. Depending on how much water you will throw to the stones, the hotter the temperature will be before slowly getting cooler. The changes of temperatures, combined with regular sauna usage has been scientifically proven to have several health benefits. Regular sauna bathing will specifically improve brain and mental health, protect from cardiac health problems and boost immune system.",
      },
    ],
  },
  {
    id: "building-installation",
    title: "Building & Installation",
    icon: "fas fa-hammer",
    image: faq2,
    items: [
      {
        question: "Where is the ideal sauna location?",
        answer:
          "The ideal sauna location would be somewhere dry with good ventilation and concrete, tile, ceramic or vinyl flooring. We recommend to have floor-drain for easier cleaning. The good ventilation will guarantee that the slight condensation from sauna will effectively dry after bathing. Whenever the sauna is in use, it will cause very minor increase in temperature for surrounding areas. With this in mind, if the sauna is modular and installed inside the house is good to consider leaving small gap between sauna room and house walls to ensure air flow.",
      },
      {
        question: "Why there are upper and lower benches in sauna?",
        answer:
          "The temperature of the sauna room is warmer at ceiling level and cooler near the floor. Benches are installed at different heights to give the bather a choice of different bathing temperatures.",
      },
      {
        question: "How to protect the wood panels from moisture?",
        answer:
          "The best way to protect the wood panels from moisture is proper ventilation and drying after using the sauna. Do not apply paint, sealants or any preservative on the wood panels. Wood swells and shrinks and tears off paint and sealants, which are only on the surface of the wood. It is best to leave the wood bare.",
      },
      {
        question: "What are requirements for sauna floor?",
        answer:
          "The requirements for sauna floor is to be waterproof, for easy washability and maintenance. For example tile, cement or heavy-duty vinyl floors are good because they are washable and do not absorb water.",
      },
      {
        question: "Is floor drain in sauna required?",
        answer:
          "The floor drain in sauna is not required, but highly recommended. This will makes cleaning of sauna more convenient.",
      },
    ],
  },
  {
    id: "sauna-heater",
    title: "Sauna Heater",
    icon: "fas fa-bolt",
    image: faq3,
    items: [
      {
        question: "Can I get electric shock from heater?",
        answer:
          "If the heater is installed correctly, electric shock from heater is very unlikely. To ensure the safe use, a qualified electrician must do the installation. All our heaters are tested before delivery and have passed the electrical safety standards.",
      },
    ],
  },
  {
    id: "using-sauna",
    title: "Using Sauna",
    icon: "fas fa-spa",
    image: faq4,
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
          "Small children can go to sauna under adult supervision. However, first times limit the bathing only for few minutes and in a moderate temperature. Children can sit on lower benches, where temperature also is lower.",
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
  const [imgFading, setImgFading] = useState(false);

  const section = faqSections[activeTab];

  const handleTabChange = (i) => {
    if (i === activeTab) return;
    setImgFading(true);
    setOpenIndex(null);
    setTimeout(() => {
      setActiveTab(i);
      setImgFading(false);
    }, 280);
  };

  const handleToggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div style={{ fontFamily: "Montserrat, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap');

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

        .faq-gallery-thumb {
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2.5px solid transparent;
          flex: 1;
        }
        .faq-gallery-thumb:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(139,94,60,0.2); }
        .faq-gallery-thumb.active { border-color: #a67853; box-shadow: 0 6px 16px rgba(139,94,60,0.25); }
        .faq-gallery-thumb img { width:100%; height:58px; object-fit:cover; display:block; }

        .faq-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .faq-main-img.fading {
          opacity: 0;
          transform: scale(0.97);
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
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="faq-hero-overlay" />
        <div className="faq-hero-content">
          <h1 className="faq-hero-title">FAQ</h1>
          <p className="faq-hero-subtitle">Frequently Asked Questions</p>
        </div>
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
                marginBottom: 12,
                aspectRatio: "4/3",
              }}
            >
              <img
                src={section.image}
                alt={section.title}
                className={`faq-main-img${imgFading ? " fading" : ""}`}
              />
            </div>

            {/* Thumbnail strip — all 4 images, click to switch */}
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {faqSections.map((s, i) => (
                <div
                  key={s.id}
                  className={`faq-gallery-thumb${activeTab === i ? " active" : ""}`}
                  onClick={() => handleTabChange(i)}
                  title={s.title}
                >
                  <img src={s.image} alt={s.title} />
                </div>
              ))}
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
                <i className={section.icon} style={{ color:"rgba(255,255,255,0.85)", fontSize:"1rem" }} />
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:"0.9rem", color:"#fff", letterSpacing:"0.3px" }}>
                  {section.title}
                </span>
              </div>
              <p style={{ fontFamily:"Montserrat,sans-serif", fontWeight:300, fontSize:"0.82rem", color:"rgba(255,255,255,0.82)", lineHeight:1.6, margin:0 }}>
                Click any question to expand the answer. Use the thumbnails or tabs above to switch categories.
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