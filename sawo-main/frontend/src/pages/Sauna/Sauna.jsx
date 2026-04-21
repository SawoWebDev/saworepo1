// Sauna.jsx

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ButtonClear from "../../components/Buttons/ButtonClear";

// Import hero background - update path as needed
// import heroBg from "assets/Sauna/Sauna-hero.webp";

const Sauna = () => {
  useEffect(() => {
    // Inject Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const faLink = document.createElement("link");
      faLink.rel = "stylesheet";
      faLink.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(faLink);
    }

    // ==============================
    // SAUNA CARDS CAROUSEL SCRIPT
    // ==============================
    const initCards = () => {
      const cards = document.querySelectorAll(".sauna-card-unique");
      if (!cards.length) return;

      const isDesktop = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches;

      if (isDesktop) {
        cards.forEach((card) => {
          card.addEventListener("mouseenter", () => {
            cards.forEach((c) => c !== card && c.classList.remove("active"));
            card.classList.add("active");
          });
          card.addEventListener("mouseleave", () => {
            card.classList.remove("active");
          });
        });
      } else {
        cards.forEach((card) => {
          const closeBtn = card.querySelector(".sauna-card-unique-close");
          card.addEventListener("click", function (e) {
            if (e.target.closest(".sauna-card-unique-close")) return;
            cards.forEach((c) => c !== card && c.classList.remove("active"));
            card.classList.toggle("active");
          });
          if (closeBtn) {
            closeBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              card.classList.remove("active");
            });
          }
        });
        document.addEventListener("click", function (e) {
          if (!e.target.closest(".sauna-card-unique")) {
            cards.forEach((card) => card.classList.remove("active"));
          }
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initCards, 100);
    return () => clearTimeout(timer);
  }, []);

  const benefitCards = [
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

  const controlCards = [
    {
      img: "https://secret-newsite.sawo.com/wp-content/uploads/2024/11/Innova-Classic-2.0.png",
      title: "Innova Series",
      href: "https://www.sawo.com/sawo-products/finnish-sauna/innova-series/",
      desc: "Saunova 2.0 seamlessly pairs with heaters up to 9 kW, featuring smart temperature control, a precise bench sensor, and a versatile user interface—no separate power controller needed.",
    },
    {
      img: "https://secret-newsite.sawo.com/wp-content/uploads/2024/11/saunova-2.0_user-interface.png",
      title: "Saunova Series",
      href: "https://www.sawo.com/sawo-products/finnish-sauna/saunova-series/",
      desc: "Versatile control for sauna temperature, humidity, ventilation, and lighting, featuring Smart Controlling, Door Sensor, Prerun Timer, and optional Fan, Dimmer, and Combi functions.",
    },
    {
      img: "https://www.sawo.com/wp-content/uploads/2024/10/INNOVA-CLASSIC-1000X1000.webp",
      title: "Control Accessories",
      href: "https://www.sawo.com/sawo-products/finnish-sauna/control-accessories/",
      desc: "Modern sauna control systems enhance your experience by managing heat, adjusting ambiance, monitoring energy usage, and providing maintenance alerts.",
    },
  ];

  return (
    <div className="relative">
      {/* ===================== */}
      {/* HERO SECTION          */}
      {/* ===================== */}
      <section
        className="sauna-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(https://www.sawo.com/wp-content/uploads/2025/06/SAWO_Finnish_Sauna_Room_Cedar_Cover-scaled.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.38)",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="text-white font-bold hero-title"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "40px",
              lineHeight: "52px",
              fontWeight: 700,
            }}
          >
            FINNISH SAUNA
          </h1>

          <p
            className="text-white mt-4 hero-subtitle"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              fontSize: "22px",
              lineHeight: "38px",
              maxWidth: "900px",
              margin: "16px auto 0",
            }}
          >
            Experience the authentic Finnish sauna with our heaters — Smooth
            heat, humidity, and the perfect balance for ultimate relaxation.
          </p>

          <div style={{ marginTop: "32px" }}>
            <ButtonClear
              text="EXPLORE HEATERS"
              href="https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf"
              download
            />
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 1: HEATERS    */}
      {/* ===================== */}
      <section className="sauna-heaters-section max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "#af8564",
              fontSize: "36px",
              marginBottom: "16px",
            }}
          >
            Sauna Heater
          </h2>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "rgb(20, 22, 23)",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "780px",
              margin: "0 auto",
            }}
          >
            Called the "heart of sauna," we have over 100 different heater
            models to choose from. SAWO heaters are designed with strong
            expertise to fit both residential and commercial saunas.
          </p>
        </div>

        {/* Heaters Grid - sawo-sec */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body { margin: 0; overflow-x: hidden; }

          .sawo-sec .sawo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            width: 100%;
            margin: 0 auto;
            gap: 30px;
            font-family: 'Montserrat', sans-serif;
            padding: 20px;
          }
          .sawo-sec .sawo-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: left;
            overflow: hidden;
          }
          .sawo-sec .sawo-card img {
            width: 100%;
            height: auto;
            transition: transform .5s ease;
            border-radius: 6px;
          }
          .sawo-sec .sawo-card:hover img { transform: scale(1.05); }
          .sawo-sec .sawo-title {
            font-size: 23px;
            font-weight: 400;
            line-height: 1;
            color: #141617;
            margin: 15px 0 10px;
            align-self: flex-start;
          }
          .sawo-sec .sawo-caption {
            font-size: 14px;
            font-weight: 400;
            line-height: 1.3;
            color: #141617;
            margin-bottom: 15px;
            align-self: flex-start;
          }
          .sawo-sec .sawo-center {
            display: flex;
            justify-content: center;
            margin-top: 10px;
          }
          .sawo-sec .sawo-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: #333;
            text-decoration: none;
            transition: color .3s ease;
          }
          .sawo-sec .sawo-link:hover { color: #af8564; }
          .sawo-sec .sawo-icon { transition: transform .3s ease; }
          .sawo-sec .sawo-link:hover .sawo-icon { transform: translateX(3px); }

          @media (min-width: 1280px) {
            .sawo-sec.heaters .sawo-grid { grid-template-columns: repeat(2, 1fr); }
            .sawo-sec.controls .sawo-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 480px) {
            .sawo-sec .sawo-grid { padding: 0 10px; }
          }
        `}</style>

        <div className="sawo-sec heaters">
          <div className="sawo-grid">
            <div className="sawo-card">
              <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/tower-series/">
                <img src="https://www.sawo.com/wp-content/uploads/2025/04/TOWER-SERIES-2-600x360-1.webp" alt="Tower Series" />
              </a>
              <div className="sawo-title">Tower Series</div>
              <div className="sawo-caption">SAWO Tower Series a sauna stone pillar design for full-body steam distribution, ensuring a luxurious and immersive steam experience from floor to ceiling.</div>
            </div>
            <div className="sawo-card">
              <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/stone-series/">
                <img src="https://www.sawo.com/wp-content/uploads/2025/06/STONE-SERIES-3-600x320-new-.webp" alt="Stone Series" />
              </a>
              <div className="sawo-title">Stone Series</div>
              <div className="sawo-caption">SAWO Stone Series features a durable stainless steel body with heat-conducting Finnish soapstone, ensuring efficient heating and quick drying after use.</div>
            </div>
            <div className="sawo-card">
              <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/wall-mounted-series/">
                <img src="https://www.sawo.com/wp-content/uploads/2025/09/WALL-MOUNTED-SERIES-v2-1.webp" alt="Wall Mounted Series" />
              </a>
              <div className="sawo-title">Wall Mounted Series</div>
              <div className="sawo-caption">SAWO Wall-Mounted Series features sleek, space-saving heaters that blend efficiency with modern design for optimal warmth and comfort.</div>
            </div>
            <div className="sawo-card">
              <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/floor-series/">
                <img src="https://www.sawo.com/wp-content/uploads/2025/05/FLOOR-MOUNTED-SERIES1-1024x614-1.webp" alt="Floor Series" />
              </a>
              <div className="sawo-title">Floor Series</div>
              <div className="sawo-caption">SAWO Floor Series offers movable, high-performance stand-alone heaters for optimal heat distribution and lasting comfort.</div>
            </div>
            <div className="sawo-card">
              <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/dragonfire-series/">
                <img src="https://www.sawo.com/wp-content/uploads/2025/04/DRAGON-SERIES-1-600x360-1.webp" alt="Dragonfire Series" />
              </a>
              <div className="sawo-title">Dragonfire Series</div>
              <div className="sawo-caption">Elevate your sauna experience with the SAWO Dragonfire series, crafted by renowned Finnish designer Stefan Lindfors for modern living.</div>
            </div>
            <div className="sawo-card">
              <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/combi-series/">
                <img src="https://www.sawo.com/wp-content/uploads/2025/04/COMBI-SERIES-600x360-1.webp" alt="Combi Series" />
              </a>
              <div className="sawo-title">Combi Series</div>
              <div className="sawo-caption">Versatile electric heaters with integrated steamers, offering traditional and steam sauna options with aroma oil basins for added luxury.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 2: BENEFITS   */}
      {/* ===================== */}
      <section
        className="sauna-benefits-section relative w-full py-16"
        style={{ background: "#AF8564" }}
      >
        <style>{`
          *{ box-sizing: border-box; }
          .sauna-card-unique-section { max-width: 100%; margin: 0 auto; overflow: hidden; padding: 14px 0; }
          .sauna-carousel-wrapper { position: relative; overflow: hidden; }
          .sauna-card-unique-grid {
            display: flex;
            gap: 24px;
            animation: scroll-carousel 60s linear infinite;
            width: max-content;
          }
          .sauna-carousel-wrapper:hover .sauna-card-unique-grid { animation-play-state: paused; }

          @keyframes scroll-carousel {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .sauna-card-unique {
            background: #fff;
            border-radius: 20px;
            width: 250px;
            min-width: 250px;
            aspect-ratio: 1/1;
            text-align: center;
            transition: .4s ease;
            position: relative;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px 16px;
            border: 2px solid transparent;
            overflow: hidden;
            color: #af8564;
          }
          .sauna-card-unique::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #c79a77, #fff, #c79a77);
            transform: scaleX(0);
            transition: .4s ease;
          }
          .sauna-card-unique:hover::before { transform: scaleX(1); }
          .sauna-card-unique.active {
            box-shadow: 0 22px 50px rgba(139,94,60,.28);
            border-color: #c79a77;
            color: #9e7456;
          }
          .sauna-card-unique-content { display: flex; flex-direction: column; align-items: center; }
          .sauna-card-unique-icon {
            width: 76px; height: 76px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 25%, #e4c3a8 0%, #c79a77 35%, #af8564 65%, #9e7456 100%);
            display: flex; align-items: center; justify-content: center;
            transition: .45s cubic-bezier(.68,-.55,.265,1.55);
          }
          .sauna-card-unique-icon i { font-size: 2rem; color: #fff; transition: .4s ease; }
          .sauna-card-unique:hover .sauna-card-unique-icon { transform: rotate(10deg) scale(1.06); }
          .sauna-card-unique.active .sauna-card-unique-icon {
            background: radial-gradient(circle at 30% 25%, #f1d7c2 0%, #c79a77 40%, #af8564 70%, #9e7456 100%);
            transform: scale(.62);
          }
          .sauna-card-unique.active .sauna-card-unique-icon i { font-size: 2.3rem; }
          .sauna-card-unique-label {
            font-family: Montserrat, sans-serif;
            font-weight: 700; font-size: 1.05rem;
            margin-top: 8px; transition: .3s ease;
          }
          .sauna-card-unique.active .sauna-card-unique-label { color: #9e7456; }
          .sauna-card-unique-description {
            font-family: Montserrat, sans-serif;
            font-size: .9rem; line-height: 1.45;
            max-height: 0; opacity: 0; overflow: hidden;
            transition: .45s ease;
            text-align: center; padding: 4px 6px; color: #fff;
          }
          .sauna-card-unique.active .sauna-card-unique-description { max-height: 160px; opacity: 1; color: #2f2f2f; }
          .sauna-card-unique-click { position: absolute; inset: 0; }
          .sauna-card-unique-close {
            position: absolute; top: 12px; right: 12px;
            width: 26px; height: 26px; border-radius: 50%;
            background: rgba(255,255,255,.15);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: .25s ease;
          }
          .sauna-card-unique.active .sauna-card-unique-close { opacity: 1; }
          .sauna-card-unique-close i { color: #fff; font-size: .8rem; }

          @media(max-width: 768px) {
            .sauna-card-unique { width: 220px; min-width: 220px; }
            .sauna-card-unique-label { font-size: 0.9rem; }
            .sauna-card-unique-description { font-size: 0.8rem; line-height: 1.35; }
            .sauna-card-unique-icon i { font-size: 1.8rem; }
          }
        `}</style>

        <section className="sauna-card-unique-section">
          <div className="sauna-carousel-wrapper">
            <div className="sauna-card-unique-grid">
              {/* Render cards twice for seamless infinite loop */}
              {[...benefitCards, ...benefitCards].map((card, i) => (
                <div className="sauna-card-unique" key={i}>
                  <div className="sauna-card-unique-close">
                    <i className="fa-solid fa-times"></i>
                  </div>
                  <div className="sauna-card-unique-content">
                    <div className="sauna-card-unique-icon">
                      <i className={card.icon}></i>
                    </div>
                    <div className="sauna-card-unique-label">{card.label}</div>
                    <div className="sauna-card-unique-description">{card.desc}</div>
                  </div>
                  <div className="sauna-card-unique-click"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      {/* ===================== */}
      {/* SECTION 3: CONTROLS   */}
      {/* ===================== */}
      <section className="sauna-controls-section max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "#af8564",
              fontSize: "36px",
              marginBottom: "16px",
            }}
          >
            Sauna Controls
          </h2>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "rgb(20, 22, 23)",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "820px",
              margin: "0 auto",
            }}
          >
            Using a separate control with SAWO heaters will let you decide what
            type of sauna experience you will have. Control features such as
            temperature, humidity, time, use of fan and light dimmer or even
            save energy with power consumption counter.
          </p>
        </div>

        <style>{`
          .controls-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
          }
          .control-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(139,94,60,0.10);
            transition: all 0.35s ease;
            border: 1px solid #f0e8e0;
          }
          .control-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 40px rgba(139,94,60,0.18);
          }
          .control-card img {
            width: 100%;
            height: 260px;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          .control-card:hover img { transform: scale(1.04); }
          .control-card-body { padding: 20px 22px 24px; }
          .control-card-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 1.15rem;
            color: #8b5e3c;
            margin-bottom: 10px;
          }
          .control-card-desc {
            font-family: 'Montserrat', sans-serif;
            font-weight: 400;
            font-size: 0.9rem;
            line-height: 1.6;
            color: #141617;
          }
          @media (max-width: 992px) {
            .controls-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .controls-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="controls-grid">
          {controlCards.map((card, i) => (
            <a href={card.href} className="control-card" key={i} style={{ textDecoration: "none" }}>
              <img src={card.img} alt={card.title} />
              <div className="control-card-body">
                <div className="control-card-title">{card.title}</div>
                <div className="control-card-desc">{card.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ======================= */}
      {/* SECTION 4: ACCESSORIES  */}
      {/* ======================= */}
      <section className="sauna-accessories-section max-w-[1200px] mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "#af8564",
              fontSize: "36px",
              marginBottom: "16px",
            }}
          >
            Sauna Accessories
          </h2>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 400,
              color: "rgb(20, 22, 23)",
              fontSize: "16px",
              lineHeight: "1.7",
              maxWidth: "780px",
              margin: "0 auto",
            }}
          >
            We have wide selection of timeless sauna accessories from Cedar,
            Aspen and Pine. Choose your favorites to customize the sauna to be
            exactly for your liking.
          </p>
        </div>

        <style>{`
          .custom-product-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }
          .custom-product-grid .product {
            display: flex;
            flex-direction: column;
            text-decoration: none;
            color: inherit;
            border-radius: 12px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 4px 16px rgba(139,94,60,0.08);
            border: 1px solid #f0e8e0;
            transition: all 0.35s ease;
          }
          .custom-product-grid .product:hover {
            transform: translateY(-5px);
            box-shadow: 0 14px 36px rgba(139,94,60,0.16);
          }
          .custom-product-grid .product img {
            width: 100%;
            height: 220px;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          .custom-product-grid .product:hover img { transform: scale(1.05); }
          .custom-product-grid .product h3 {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 1rem;
            font-weight: 600;
            color: #8b5e3c;
            margin: 14px 16px 8px;
          }
          .custom-product-grid .product p {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.85rem;
            line-height: 1.55;
            color: #141617;
            margin: 0 16px 16px;
            font-weight: 400;
          }
          @media (max-width: 992px) {
            .custom-product-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .custom-product-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="custom-product-grid">
          <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/pails-ladles/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/04/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE-600x600-1.webp" alt="Pails & Ladles" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Pails & Ladles</h3>
            <p>Essential to Finnish saunas, our SAWO selection offers pails ranging from 2 to 40 liters. Choose from traditional cedar, aspen, and pine or modern stainless steel options. Complete your set with ladles.</p>
          </a>
          <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/thermometers-combined-meters/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/09/BoxType2-copy-new.jpg" alt="Thermometers & Combined meters" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Thermometers & Combined meters</h3>
            <p>Traditional Thermo and Hygrometers signal sauna readiness. Explore diverse shapes and styles. Enhance your lounge with wooden clocks and try our 15-minute sand timers for socializing or newcomers.</p>
          </a>
          <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/thermometers-combined-meters/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/09/sand-timer-copy-new.jpg" alt="Clocks & Timers" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Clocks & Timers</h3>
            <p>Want to see who lasts the longest in sauna? Our 15min sand timers are a great way to create conversation or perfect for those who are new to Finnish sauna.</p>
          </a>
          <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-light/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/09/917-D_Display_new-.jpg" alt="Sauna Lights" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Sauna Lights</h3>
            <p>Create the perfect ambience with a proper play of lighting. Our different light shades allow you to create the feel of soothing and warm.</p>
          </a>
          <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/headrests-backrests/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/09/506-2-D.jpg" alt="Headrests & Backrests" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Headrests & Backrests</h3>
            <p>Wooden headrests and backrests, along with lounge backrests, made from durable materials like wood, memory foam, or fabric, offer comfort in the sauna and lounge with moisture-resistant upholstery for durability.</p>
          </a>
          <a href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/doors-handles/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/09/DOORS-AND-HANDLES-copy.jpg" alt="Doors & Handles" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Doors & Handles</h3>
            <p>Elevate your sauna with SAWO's sauna doors. Crafted for durability, they feature rubber lining, magnetic lock, stainless hinges, and laminated jambs. Choose from glass options for a light-filled, spacious feel.</p>
          </a>
          <a href="https://www.sawo.com/benches-cloth-hangers-and-floor-mat-tiles/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/08/siro-bench.webp" alt="Benches" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Benches & Floor Tiles</h3>
            <p>Upgrade your sauna experience with comfy, stylish benches that support and enhance relaxation. Choose from various high-quality designs to suit your taste and space, creating a wellness sanctuary for your body and mind.</p>
          </a>
          <a href="https://www.sawo.com/kivistone/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/08/R-500-D_Scene2.webp" alt="Kivistone" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Kivistone</h3>
            <p>Kivistone offers a variety of unique soapstone products for homes, gifts, and corporate use, featuring a wide range of innovative designs.</p>
          </a>
          <a href="https://www.sawo.com/ventilations-miscellaneous-items/" className="product">
            <img src="https://www.sawo.com/wp-content/uploads/2025/08/Ventilation.webp" alt="Ventilations & Miscellaneous Items" />
            <h3 style={{ fontFamily: "'Montserrat', sans-serif" }}>Ventilations & Add-Ons</h3>
            <p>Explore your sauna experience with our range of ventilations and essential items. Elevate your time in the sauna with SAWO's complimentary items. Discover our fascinating selection today!</p>
          </a>
        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap');

        .sauna-hero {
          position: relative;
        }

        .sauna-hero-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 12px 34px;
          border: 2px solid #ffffff;
          color: #ffffff;
          background: transparent;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .sauna-hero-btn:hover {
          background: #ffffff;
          color: #af8564;
        }

        @media (max-width: 768px) {
          .sauna-hero h1 {
            font-size: 28px !important;
            line-height: 36px !important;
          }
          .sauna-hero p {
            font-size: 16px !important;
            line-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Sauna;