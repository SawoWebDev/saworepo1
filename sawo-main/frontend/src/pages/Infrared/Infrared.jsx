// Infrared.jsx

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import heroBg from "../../assets/Infrared/hero.webp";
import saunaRoom from "../../assets/Infrared/sauna-room.webp";
import irPanels from "../../assets/Infrared/ir-panels.webp";
import irBackrest from "../../assets/Infrared/ir-backrest.webp";
import interfaceHolder from "../../assets/Infrared/interface-holder.webp";
import irUiV2 from "../../assets/Infrared/ir-ui-v2.webp";
import irPowerController from "../../assets/Infrared/ir-power-controller.webp";
import irBuiltinControl from "../../assets/Infrared/ir-builtin-control.webp";
import HeroWave from "../../components/HeroWave";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import SEO from "../../components/SEO";
import PageCTA from "../../components/PageCTA";

const accessories = [
  { img: irPanels, title: "Infrared Panels", slug: "infrared-panels" },
  { img: irBackrest, title: "Infrared Backrest", slug: "infrared-backrest" },
  { img: interfaceHolder, title: "Interface Holder", slug: "interface-holder" },
];

const controls = [
  { img: irUiV2, title: "Infrared 2.0 User Interface", slug: "infrared-2-0-user-interface" },
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
  const heroLoaded = useHeroLoaded(heroBg);
  const location = useLocation();

  // Scroll to the target section when arriving via a hash link (e.g. /infrared#infrared-controls)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location]);

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
      <SEO
        title="Infrared Sauna"
        description="Discover SAWO infrared saunas: cedar-crafted rooms with gentle, therapeutic infrared heat panels and controls for deep relaxation and wellness."
        path="/infrared"
      />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "SAWO Infrared Sauna",
          description:
            "Cedar-crafted infrared sauna room with therapeutic infrared heat panels, backrests, and digital controls for relaxation, muscle recovery, and skin wellness. Available in single- and two-person configurations.",
          brand: { "@type": "Brand", name: "SAWO" },
          category: "Infrared Sauna",
          image: heroBg,
        })}
      </script>

      {/* ===================== */}
      {/* HERO                  */}
      {/* ===================== */}
      <section
        className="ir-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
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
        <div className="ir-hero-overlay" />
        <div className="ir-hero-content">
          <h1 className="ir-hero-title">INFRARED SAUNA</h1>
          <div style={{ marginTop: "28px" }}>
            <BrochureDropdownButton
              text="VIEW BROCHURE"
              href="https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Infrared-Brochure-2026-1.pdf"
            />
          </div>
        </div>
      <HeroWave />
      </section>

      {/* ===================== */}
      {/* INFRARED ROOM   */}
      {/* ===================== */}
      <section id="infrared-room" className="max-w-[1100px] mx-auto px-6 py-20">
        <div className="ir-room-grid">
          <div className="ir-room-left">
            <h2 className="ir-group-title">Infrared Room</h2>
            <p className="ir-room-desc">
              Indulge in the therapeutic benefits of our Infrared Room, designed to promote
              relaxation and well-being through the gentle warmth of infrared technology. Experience a
              soothing escape in the comfort of your own space. Our Infrared Room is available for
              single person and two people.
            </p>
            <Link to="/infrared/room" className="wm-brochure-btn">
              VIEW INFRARED ROOM
            </Link>
          </div>
          <div className="ir-room-img-wrap">
            <img src={saunaRoom} alt="Infrared Room" className="ir-room-img" />
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* INFRARED ACCESSORIES  */}
      {/* ===================== */}
      <section id="infrared-accessories" className="max-w-[1100px] mx-auto px-6 py-16">
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
      <section id="infrared-controls" className="max-w-[1100px] mx-auto px-6 py-20">
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
      {/* CTA                   */}
      {/* ===================== */}
      <PageCTA
        title="Need Help Choosing?"
        description="From infrared panels to controls and accessories, our team can help you find the right infrared sauna setup for your space."
      />

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

        /* Keeps anchor jumps from hiding under a fixed header. Adjust px to your nav height. */
        #infrared-room,
        #infrared-accessories,
        #infrared-controls {
          scroll-margin-top: 90px;
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
        .ir-room-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;
        }
        .ir-room-left { text-align: left; }
        .ir-room-left .ir-group-title { margin-bottom: 20px; }
        .ir-room-img-wrap {
          display: flex; align-items: center; justify-content: center;
        }
        .ir-room-img {
          width: 100%; height: auto; border-radius: 12px; display: block;
          box-shadow: 0 14px 40px rgba(170,129,97,0.18);
        }
        .ir-room-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem; line-height: 1.8; color: #555;
          margin: 0 0 28px;
        }
        .wm-brochure-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.82rem; font-weight: 600;
          letter-spacing: 1px; padding: 11px 30px;
          border: 2px solid #AA8161; color: #AA8161;
          background: transparent; border-radius: 6px;
          text-decoration: none; display: inline-block;
          transition: all 0.3s ease;
        }
        .wm-brochure-btn:hover { background: #AA8161; color: #fff; }

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
          display: flex; align-items: flex-start; gap: 24px; animation: ir-scroll-carousel 60s linear infinite; width: max-content;
        }
        .sauna-carousel-wrapper:hover .sauna-card-unique-grid { animation-play-state: paused; }

        @keyframes ir-scroll-carousel { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .sauna-card-unique {
          background: #fff; border-radius: 20px; width: 250px; min-width: 250px; height: 250px;
          aspect-ratio: 1 / 1; flex-shrink: 0;
          text-align: center; transition: height 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease, color 0.4s ease;
          position: relative; cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 18px 16px;
          border: 2px solid transparent; overflow: hidden; color: var(--ir-primary);
        }
        /* Grow to fit the description instead of clamping/truncating it —
           .sauna-card-unique-grid uses align-items:flex-start so this
           doesn't stretch the other cards in the row. Sized to match the
           Home page's carousel (250px) instead of the old smaller 220px. */
        .sauna-card-unique.active {
          height: auto;
          min-height: 250px;
          aspect-ratio: auto;
          padding-bottom: 26px;
          box-shadow: 0 22px 50px rgba(139,94,60,0.28);
          border-color: var(--ir-primary-light); color: var(--ir-primary-dark);
        }
        .sauna-card-unique-content { display: flex; flex-direction: column; align-items: center; }
        .sauna-card-unique-icon {
          width: 76px; height: 76px; border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, #e4c3a8 0%, var(--ir-primary-light) 35%, var(--ir-primary) 65%, var(--ir-primary-dark) 100%);
          display: flex; align-items: center; justify-content: center;
          transition: 0.45s cubic-bezier(0.68,-0.55,0.265,1.55), width 0.3s ease, height 0.3s ease;
        }
        .sauna-card-unique-icon i { font-size: 2rem; color: #fff; transition: 0.4s ease; }
        .sauna-card-unique:hover .sauna-card-unique-icon { transform: rotate(10deg) scale(1.06); }
        .sauna-card-unique.active .sauna-card-unique-icon {
          width: 44px; height: 44px;
          background: radial-gradient(circle at 30% 25%, #f1d7c2 0%, var(--ir-primary-light) 40%, var(--ir-primary) 70%, var(--ir-primary-dark) 100%);
        }
        .sauna-card-unique.active .sauna-card-unique-icon i { font-size: 1.3rem; }
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
        .sauna-card-unique.active .sauna-card-unique-description {
          max-height: 300px; opacity: 1; color: var(--ir-text-dark);
        }
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
          .ir-room-grid { grid-template-columns: 1fr; gap: 28px; }
          .ir-room-left { text-align: center; }
          .ir-room-desc { text-align: center; }
          .ir-acc-grid { grid-template-columns: 1fr; }
          .ir-ctrl-grid { grid-template-columns: 1fr; }
          .sauna-card-unique { width: 220px; min-width: 220px; height: 220px; }
          .sauna-card-unique.active { min-height: 220px; }
          .sauna-card-unique-label { font-size: 0.9rem; }
          .sauna-card-unique-description { font-size: 0.8rem; line-height: 1.35; }
          .sauna-card-unique-icon i { font-size: 1.8rem; }
        }
      `}</style>

    </div>
  );
};

export default Infrared;
