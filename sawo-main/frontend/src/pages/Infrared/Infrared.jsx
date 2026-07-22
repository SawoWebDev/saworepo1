// Infrared.jsx

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import heroBg from "../../assets/Infrared/hero.webp";
import saunaRoom from "../../assets/Infrared/sauna-room.webp";
import irPanels from "../../assets/Infrared/ir-panels.webp";
import irBackrest from "../../assets/Infrared/ir-backrest.webp";
import interfaceHolder from "../../assets/Infrared/interface-holder.webp";
import irUiV2 from "../../assets/Infrared/ir-ui-v2.webp";
import irPowerController from "../../assets/Infrared/ir-power-controller.webp";
import irBuiltinControl from "../../assets/Infrared/ir-builtin-control.webp";
import HeroWave from "../../components/HeroWave";

const accessories = [
  { img: irPanels, title: "Infrared Panels", slug: "infrared-panels-ir-panel-2" },
  { img: irBackrest, title: "Infrared Backrest", slug: "infrared-backrest-505-ir-a-d" },
  { img: interfaceHolder, title: "Interface Holder", slug: "interface-holder-saunova-2" },
];

const controls = [
  { img: irUiV2, title: "Infrared 2.0 User Interface", slug: "infrared-2-0-user-interface-ir-ui-v2" },
  { img: irPowerController, title: "Infrared 2.0 Power Controller", slug: "infrared-2-0-power-controller" },
  { img: irBuiltinControl, title: "Infrared 2.0 Built-In Control", slug: "infrared-2-0-built-in-control" },
];

const benefits = [
  { icon: "fas fa-spa", label: "Stress Relief", desc: "Reduces stress, promotes relaxation, and alleviates anxiety" },
  { icon: "fas fa-heartbeat", label: "Heart Health", desc: "Enhances blood circulation, reduces arterial stiffness, and supports healthy blood pressure" },
  { icon: "fas fa-lungs", label: "Respiratory Relief", desc: "Relieves nasal, sinus, and chest congestion" },
  { icon: "fas fa-dumbbell", label: "Muscle Recovery", desc: "Accelerates muscle recovery following exercise" },
  { icon: "fas fa-bed", label: "Better Sleep", desc: "Promotes deeper, more restorative sleep by extending REM sleep duration" },
  { icon: "fas fa-heart", label: "Disease Prevention", desc: "Lowers risk of cardiovascular diseases, including stroke, hypertension, dementia, and Alzheimer's disease" },
  { icon: "fas fa-droplet", label: "Skin Detox", desc: "Opens pores, reduces blackheads, eliminates toxins, and improves skin" },
  { icon: "fas fa-wand-magic-sparkles", label: "Collagen Boost", desc: "Stimulates fibroblast activity to boost collagen production and enhance skin texture" },
  { icon: "fas fa-hand-holding-droplet", label: "Skin Hydration", desc: "Improves skin hydration, stabilizes pH balance, and strengthens the skin's natural barrier" },
  { icon: "fas fa-shield-alt", label: "Immune Support", desc: "Supports the body's natural immune defenses and aids recovery after illness" },
  { icon: "fas fa-fire", label: "Metabolism Boost", desc: "Stimulates protein repair, improves insulin sensitivity, and enhances metabolic rate" },
  { icon: "fas fa-smile", label: "Mental Wellness", desc: "Significantly reduces symptoms of depression with consistent use" },
];

const Infrared = () => {
  // Benefit-card interaction (hover on desktop, tap on touch devices)
  useEffect(() => {
    const cards = document.querySelectorAll(".sauna-card-unique");
    const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups = [];

    if (isDesktop) {
      cards.forEach((card) => {
        const enter = () => {
          cards.forEach((c) => c !== card && c.classList.remove("active"));
          card.classList.add("active");
        };
        const leave = () => card.classList.remove("active");
        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", enter);
          card.removeEventListener("mouseleave", leave);
        });
      });
    } else {
      cards.forEach((card) => {
        const closeBtn = card.querySelector(".sauna-card-unique-close");
        const onCard = (e) => {
          if (e.target.closest(".sauna-card-unique-close")) return;
          cards.forEach((c) => c !== card && c.classList.remove("active"));
          card.classList.toggle("active");
        };
        const onClose = (e) => {
          e.stopPropagation();
          card.classList.remove("active");
        };
        card.addEventListener("click", onCard);
        closeBtn && closeBtn.addEventListener("click", onClose);
        cleanups.push(() => {
          card.removeEventListener("click", onCard);
          closeBtn && closeBtn.removeEventListener("click", onClose);
        });
      });
      const onDoc = (e) => {
        if (!e.target.closest(".sauna-card-unique")) {
          cards.forEach((card) => card.classList.remove("active"));
        }
      };
      document.addEventListener("click", onDoc);
      cleanups.push(() => document.removeEventListener("click", onDoc));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="relative">

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="ir-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundColor: "#241c17", // warm-dark placeholder so it doesn't flash gray before the hero image decodes
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="ir-hero-overlay" />
        <div className="ir-hero-content">
          <h1 className="ir-hero-title">INFRARED SAUNA</h1>
          <div style={{ marginTop: "28px" }}>
            <a
              href="https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Infrared-Brochure-2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="ir-brochure-btn"
            >
              VIEW BROCHURE
            </a>
          </div>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* INFRARED SAUNA ROOM   */}
      {/* ===================== */}
      <section className="max-w-[1000px] mx-auto px-6 py-20 text-center">
        <h2 className="ir-group-title ir-group-title--center">Infrared Sauna Room</h2>
        <div className="ir-room-img-wrap">
          <img src={saunaRoom} alt="Infrared Sauna Room" className="ir-room-img" />
        </div>
        <p className="ir-room-desc">
          Indulge in the therapeutic benefits of our Infrared Sauna Room, designed to promote
          relaxation and well-being through the gentle warmth of infrared technology. Experience a
          soothing escape in the comfort of your own space. Our Infrared Sauna Room is available for
          single person and two people.
        </p>
      </section>

      {/* ===================== */}
      {/* INFRARED ACCESSORIES  */}
      {/* ===================== */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <h2 className="ir-group-title ir-group-title--center">Infrared Accessories</h2>
        <div className="ir-acc-grid">
          {accessories.map((item, i) => (
            <Link to={`/products/${item.slug}`} className="ir-acc-card" key={i}>
              <div className="ir-acc-img-wrap">
                <img src={item.img} alt={item.title} className="ir-acc-img" />
              </div>
              <h3 className="ir-acc-title">{item.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* HEALTH BENEFITS CAROUSEL */}
      {/* ===================== */}
      <section className="sauna-card-unique-section">
        <div className="sauna-carousel-wrapper">
          <div className="sauna-card-unique-grid">
            {[...benefits, ...benefits].map((b, i) => (
              <div className="sauna-card-unique" key={i}>
                <div className="sauna-card-unique-close"><i className="fa-solid fa-times" /></div>
                <div className="sauna-card-unique-content">
                  <div className="sauna-card-unique-icon"><i className={b.icon} /></div>
                  <div className="sauna-card-unique-label">{b.label}</div>
                  <div className="sauna-card-unique-description">{b.desc}</div>
                </div>
                <div className="sauna-card-unique-click" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* INFRARED SAUNA CONTROLS */}
      {/* ===================== */}
      <section className="max-w-[1100px] mx-auto px-6 py-20">
        <h2 className="ir-group-title ir-group-title--center">Infrared Sauna Controls</h2>
        <div className="ir-ctrl-grid">
          {controls.map((item, i) => (
            <Link to={`/products/${item.slug}`} className="ir-ctrl-card" key={i}>
              <div className="ir-ctrl-img-wrap">
                <img src={item.img} alt={item.title} className="ir-ctrl-img" />
              </div>
              <h3 className="ir-ctrl-title">{item.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`
        :root {
          --ir-primary: #af8564;
          --ir-primary-dark: #9e7456;
          --ir-primary-light: #c79a77;
          --ir-text-dark: #2f2f2f;
        }

        /* --- Hero --- */
        .ir-hero-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); z-index: 0; }
        .ir-hero-content { position: relative; z-index: 1; }
        .ir-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 46px; line-height: 54px; font-weight: 700; color: #ffffff;
          letter-spacing: 1px;
        }
        .ir-brochure-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px;
          padding: 12px 34px; border: 2px solid #ffffff; color: #ffffff;
          background: transparent; border-radius: 6px; text-decoration: none;
          display: inline-block; transition: all 0.3s ease;
        }
        .ir-brochure-btn:hover { background: #ffffff; color: var(--ir-primary); }

        /* --- Section titles --- */
        .ir-group-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.8rem; font-weight: 700; color: var(--ir-primary);
          margin-bottom: 40px; letter-spacing: 1px; text-transform: uppercase;
        }
        .ir-group-title--center { text-align: center; }

        /* --- Sauna room --- */
        .ir-room-img-wrap {
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; max-width: 640px;
        }
        .ir-room-img {
          width: 100%; height: auto; border-radius: 12px; display: block;
          box-shadow: 0 14px 40px rgba(170,129,97,0.18);
        }
        .ir-room-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem; line-height: 1.8; color: #555; max-width: 620px;
          margin: 0 auto;
        }

        /* --- Accessories --- */
        .ir-acc-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
        }
        .ir-acc-card {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 28px 20px; border-radius: 16px; border: 1px solid #ede5db;
          background: #ffffff; transition: transform 0.35s ease, box-shadow 0.35s ease;
          text-decoration: none; cursor: pointer;
        }
        .ir-acc-card:hover { transform: translateY(-6px); box-shadow: 0 14px 36px rgba(170,129,97,0.15); }
        .ir-acc-img-wrap {
          width: 100%; height: 170px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; overflow: hidden;
        }
        .ir-acc-img {
          max-height: 160px; max-width: 100%; object-fit: contain; transition: transform 0.4s ease;
        }
        .ir-acc-card:hover .ir-acc-img { transform: scale(1.08); }
        .ir-acc-title {
          font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700;
          color: var(--ir-primary); margin: 0;
        }

        /* --- Controls --- */
        .ir-ctrl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .ir-ctrl-card {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 28px 20px; border-radius: 16px; border: 1px solid #ede5db;
          background: #ffffff; transition: transform 0.35s ease, box-shadow 0.35s ease;
          text-decoration: none; cursor: pointer;
        }
        .ir-ctrl-card:hover { transform: translateY(-6px); box-shadow: 0 14px 36px rgba(170,129,97,0.15); }
        .ir-ctrl-img-wrap {
          width: 100%; height: 200px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; overflow: hidden;
        }
        .ir-ctrl-img {
          max-height: 190px; max-width: 100%; object-fit: contain; transition: transform 0.4s ease;
        }
        .ir-ctrl-card:hover .ir-ctrl-img { transform: scale(1.08); }
        .ir-ctrl-title {
          font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700;
          color: var(--ir-primary); margin: 0;
        }

        /* ===================== */
        /* Health benefits carousel */
        /* ===================== */
        .sauna-card-unique-section {
          max-width: 100%; margin: 0 auto; overflow: hidden; padding: 24px 0;
          background: var(--ir-primary);
        }
        .sauna-carousel-wrapper { position: relative; overflow: hidden; }
        .sauna-card-unique-grid {
          display: flex; gap: 24px; animation: ir-scroll-carousel 60s linear infinite; width: max-content;
        }
        .sauna-carousel-wrapper:hover .sauna-card-unique-grid { animation-play-state: paused; }

        @keyframes ir-scroll-carousel { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .sauna-card-unique {
          background: #fff; border-radius: 20px; width: 220px; min-width: 220px; aspect-ratio: 1 / 1;
          text-align: center; transition: 0.4s ease; position: relative; cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 18px 16px;
          border: 2px solid transparent; overflow: hidden; color: var(--ir-primary);
        }
        .sauna-card-unique::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--ir-primary-light), #fff, var(--ir-primary-light));
          transform: scaleX(0); transition: 0.4s ease;
        }
        .sauna-card-unique:hover::before { transform: scaleX(1); }
        .sauna-card-unique.active {
          box-shadow: 0 22px 50px rgba(139,94,60,0.28);
          border-color: var(--ir-primary-light); color: var(--ir-primary-dark);
        }
        .sauna-card-unique-content { display: flex; flex-direction: column; align-items: center; }
        .sauna-card-unique-icon {
          width: 76px; height: 76px; border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, #e4c3a8 0%, var(--ir-primary-light) 35%, var(--ir-primary) 65%, var(--ir-primary-dark) 100%);
          display: flex; align-items: center; justify-content: center;
          transition: 0.45s cubic-bezier(0.68,-0.55,0.265,1.55);
        }
        .sauna-card-unique-icon i { font-size: 2rem; color: #fff; transition: 0.4s ease; }
        .sauna-card-unique:hover .sauna-card-unique-icon { transform: rotate(10deg) scale(1.06); }
        .sauna-card-unique.active .sauna-card-unique-icon {
          background: radial-gradient(circle at 30% 25%, #f1d7c2 0%, var(--ir-primary-light) 40%, var(--ir-primary) 70%, var(--ir-primary-dark) 100%);
          transform: scale(0.62);
        }
        .sauna-card-unique.active .sauna-card-unique-icon i { font-size: 2.3rem; }
        .sauna-card-unique-label {
          font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1.05rem;
          margin-top: 8px; transition: 0.3s ease;
        }
        .sauna-card-unique.active .sauna-card-unique-label { color: var(--ir-primary-dark); }
        .sauna-card-unique-description {
          font-family: 'Montserrat', sans-serif; font-size: 0.9rem; line-height: 1.45;
          max-height: 0; opacity: 0; overflow: hidden; transition: 0.45s ease;
          text-align: center; padding: 4px 6px; color: #fff;
        }
        .sauna-card-unique.active .sauna-card-unique-description { max-height: 160px; opacity: 1; color: var(--ir-text-dark); }
        .sauna-card-unique-click { position: absolute; inset: 0; }
        .sauna-card-unique-close {
          position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%;
          background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: 0.25s ease;
        }
        .sauna-card-unique.active .sauna-card-unique-close { opacity: 1; }
        .sauna-card-unique-close i { color: #fff; font-size: 0.8rem; }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .ir-hero-title { font-size: 30px; line-height: 38px; }
          .ir-group-title { font-size: 1.4rem; }
          .ir-acc-grid { grid-template-columns: 1fr; }
          .ir-ctrl-grid { grid-template-columns: 1fr; }
          .sauna-card-unique { width: 200px; min-width: 200px; }
          .sauna-card-unique-label { font-size: 0.9rem; }
          .sauna-card-unique-description { font-size: 0.8rem; line-height: 1.35; }
          .sauna-card-unique-icon i { font-size: 1.8rem; }
        }
      `}</style>

    </div>
  );
};

export default Infrared;
