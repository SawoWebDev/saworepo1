// Sustainability.jsx

import React, { useEffect } from "react";
import heroBg from "../../assets/About/Sustainability-hero.webp";
import practicesBg from "../../assets/About/Sustainability.webp";
import menuPaths from "../../menuPaths";
import { Link } from "react-router-dom";

const Sustainability = () => {
  useEffect(() => {
    // ==============================
    // FALLING LEAVES SCRIPT (UNCHANGED)
    // ==============================
    const leavesContainer = document.getElementById("leavesContainer");
    if (!leavesContainer) return;

    const containerHeight = window.innerHeight;
    const containerWidth = window.innerWidth;

    let BASE_SPEED = 3.0;
    const SPAWN_DISTANCE = 400;
    const SPAWN_GAP = 1800;
    const MIN_SPEED = 0.4;
    const MAX_SPEED = 1.0;
    const SCROLL_MULTIPLIER = 0.5;
    const SWIRL_MIN = 15;
    const SWIRL_MAX = 60;
    const SIDE_OFFSET = 80;
    const SIDE_WIDTH = 300;
    const ROTATION_MAX = 45;

    let lastScrollY = window.scrollY;
    let scrollBoost = 0;
    let scrollAccumulator = 0;
    let lastSpawnTime = 0;

    let activeLeaves = [];

    function createLeaf(side) {
      const leaf = document.createElement("i");
      leaf.classList.add("fa", "fa-leaf", "fallingLeaf");

      leaf.startLeft =
        side === "left"
          ? SIDE_OFFSET + Math.random() * SIDE_WIDTH
          : containerWidth -
            SIDE_WIDTH -
            SIDE_OFFSET +
            Math.random() * SIDE_WIDTH;

      leaf.style.left = leaf.startLeft + "px";
      leaf.startTop = -100 - Math.random() * 350;
      leaf.style.top = leaf.startTop + "px";

      leaf.swirlAmplitude = SWIRL_MIN + Math.random() * (SWIRL_MAX - SWIRL_MIN);
      leaf.swirlFrequency = 0.5 + Math.random() * 2.5;
      leaf.rotationSpeed = -ROTATION_MAX + Math.random() * ROTATION_MAX * 2;
      leaf.phaseOffset = Math.random() * 300;
      leaf.swayFactor = Math.random() < 0.8 ? 0.6 + Math.random() * 0.5 : 0.2;
      leaf.speedMultiplier = 0.7 + Math.random() * 0.6;
      leaf.fastLeafBoost = Math.random() < 0.3 ? 1.5 + Math.random() * 1.5 : 0;

      leaf.currentSpeed =
        BASE_SPEED * leaf.speedMultiplier + leaf.fastLeafBoost;
      leaf.targetSpeed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      leaf.flipHorizontally = Math.random() < 0.5 ? -1 : 1;

      leavesContainer.appendChild(leaf);
      return leaf;
    }

    function animateLeaves() {
      activeLeaves.forEach((leaf) => {
        leaf.currentSpeed += (leaf.targetSpeed - leaf.currentSpeed) * 0.02;
        leaf.startTop += leaf.currentSpeed + scrollBoost;

        leaf.style.left =
          leaf.startLeft +
          Math.sin(
            ((leaf.startTop + leaf.phaseOffset) / 60) * leaf.swirlFrequency,
          ) *
            leaf.swirlAmplitude *
            leaf.swayFactor +
          "px";

        leaf.style.transform = `scaleX(${leaf.flipHorizontally}) rotate(${
          leaf.rotationSpeed * Math.sin((leaf.startTop + leaf.phaseOffset) / 60)
        }deg)`;

        leaf.style.top = leaf.startTop + "px";

        if (leaf.startTop > containerHeight + 100) {
          leavesContainer.removeChild(leaf);
          activeLeaves = activeLeaves.filter((l) => l !== leaf);
        }
      });

      scrollBoost *= 0.85;
    }

    function loop() {
      animateLeaves();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    window.addEventListener("scroll", () => {
      const now = Date.now();
      const currentScroll = window.scrollY;
      const delta = currentScroll - lastScrollY;

      if (delta < 0) {
        scrollBoost = Math.min(Math.abs(delta) * SCROLL_MULTIPLIER, 30);
      }

      if (delta > 0) {
        scrollAccumulator += delta;
        if (
          scrollAccumulator >= SPAWN_DISTANCE &&
          now - lastSpawnTime >= SPAWN_GAP
        ) {
          setTimeout(() => activeLeaves.push(createLeaf("left")), 100);
          setTimeout(() => activeLeaves.push(createLeaf("right")), 300);
          scrollAccumulator = 0;
          lastSpawnTime = now;
        }
      }

      lastScrollY = currentScroll;
    });
  }, []);

  return (
    <div className="relative">
      {/* Leaves container */}
      <div id="leavesContainer"></div>
      {/* HERO */}
      <section
        className="min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1
          className="text-white font-bold hero-title"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "45px",
            lineHeight: "45px",
          }}
        >
          SUSTAINABILITY
        </h1>

        <p
          className="text-white mt-4 hero-subtitle"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 400,
            fontSize: "22px",
            lineHeight: "40px",
          }}
        >
          We care for you and the Earth
        </p>

        {/* Mobile font adjustments */}
        <style jsx>{`
          @media (max-width: 768px) {
            .hero-title {
              font-size: 28px !important;
              line-height: 32px !important;
            }
            .hero-subtitle {
              font-size: 16px !important;
              line-height: 28px !important;
            }
          }
        `}</style>
      </section>

      {/* Section 1: Commitment Hero */}
      <section className="hero-section grid gap-12 md:grid-cols-2 items-center p-6 max-w-[1200px] mx-auto my-20">
        {/* Text content */}
        <div className="hero-content text-center md:text-left">
          <h2
            className="text-4xl font-bold mb-6 hero-gradient-text"
            style={{
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            Our Commitment to Sustainability
          </h2>
          <p
            className="hero-description"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "1.1rem",
              color: "#000",
              lineHeight: "1.8",
            }}
          >
            At SAWO, we blend wellness with environmental responsibility. Every
            sauna we craft embodies sustainability, from material selection to
            manufacturing processes. We strive to spread authentic Finnish sauna
            culture with high-quality, durable saunas that nurture health while
            respecting our planet.
          </p>
        </div>

        {/* Image */}
        <div className="hero-image w-full max-w-[450px] h-[450px] rounded-lg overflow-hidden shadow-lg mx-auto">
          <img
            src="https://www.sawo.com/wp-content/uploads/2026/01/sustainability-image.webp"
            alt="SAWO Sustainability"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Styles */}
        <style jsx>{`
          .hero-gradient-text {
            background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .hero-description {
            font-weight: 400;
          }
          @media (max-width: 768px) {
            .hero-section {
              grid-template-columns: 1fr !important;
              text-align: center;
            }
            .hero-image {
              margin: 0 auto;
              width: 80%;
              height: auto;
            }
          }
        `}</style>
      </section>

      {/* Section 2: Eco-Friendly Practices */}
      <section
        className="practices-section relative w-full py-20 px-6"
        style={{
          backgroundImage: `url(${practicesBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="text-3xl font-bold mb-12"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "2.2rem",
              fontWeight: 700,
              background:
                "linear-gradient(135deg, #fff 0%, #f5f5f5 50%, #e8e8e8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
              marginBottom: "25px",
              lineHeight: 1.2,
            }}
          >
            Eco-Friendly Manufacturing Practices
          </h2>

          <div className="practices-grid grid gap-6 md:grid-cols-3">
            <div className="practice-card">
              <div className="icon-wrapper1">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>Energy Efficiency</h3>
              <p>
                Advanced technologies, including precision CNC machining,
                minimize energy consumption and reduce waste.
              </p>
            </div>

            <div className="practice-card">
              <div className="icon-wrapper1">
                <i className="fas fa-recycle"></i>
              </div>
              <h3>Waste Reduction</h3>
              <p>
                We repurpose or recycle excess wood and materials, striving for
                zero waste in production.
              </p>
            </div>

            <div className="practice-card">
              <div className="icon-wrapper1">
                <i className="fas fa-leaf"></i>
              </div>
              <h3>Non-Toxic Treatments</h3>
              <p>
                We avoid harmful chemicals, using toxin-free finishes to protect
                the environment and health. Our waste is certified non-toxic.
              </p>
            </div>
          </div>
        </div>

        {/* Add hover and glow styles */}
        <style jsx>{`
          .practice-card {
            background: #fff;
            border-radius: 20px;
            padding: 30px 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.4s ease;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            margin-bottom: 20px;
          }
          .practice-card:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
          }
          .icon-wrapper1 {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #a67853 0%, #c4a574 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            position: relative;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow:
              0 8px 20px rgba(166, 120, 83, 0.4),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
          }
          .icon-wrapper1::before {
            content: "";
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            background: linear-gradient(135deg, #f5d898, #c4a574, #a67853);
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.5s ease;
            z-index: -1;
            filter: blur(8px);
          }
          .practice-card:hover .icon-wrapper1::before {
            opacity: 0.6;
          }
          .practice-card:hover .icon-wrapper1 {
            transform: scale(1.1) rotate(5deg);
            box-shadow:
              0 12px 30px rgba(196, 165, 116, 0.6),
              inset 0 -2px 4px rgba(0, 0, 0, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.5);
          }
          .icon-wrapper1 i {
            font-size: 2rem;
            color: #fff;
            transition: all 0.3s ease;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }
          .practice-card:hover .icon-wrapper1 i {
            animation: iconBounce 0.6s ease;
            transform: scale(1.1);
          }
          @keyframes iconBounce {
            0%,
            100% {
              transform: scale(1.1) translateY(0);
            }
            25% {
              transform: scale(1.1) translateY(-8px);
            }
            50% {
              transform: scale(1.1) translateY(-4px);
            }
            75% {
              transform: scale(1.1) translateY(-6px);
            }
          }
          .practice-card h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 1.4rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a67853 0%, #8b5e3c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            transition: all 0.3s ease;
            letter-spacing: 0.3px;
          }
          .practice-card:hover h3 {
            background: linear-gradient(135deg, #8b5e3c 0%, #6d4a2e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transform: scale(1.05);
          }
          .practice-card p {
            color: black;
            line-height: 1.6;
            font-size: 0.95rem;
            font-weight: 400;
            margin-bottom: 0;
            transition: color 0.3s ease;
          }
          .practice-card:hover p {
            color: black;
          }
          @media (max-width: 992px) {
            .practices-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
          }
          @media (max-width: 768px) {
            .practices-section {
              padding: 0 25px 30px;
            }
            .practices-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            .icon-wrapper1 {
              width: 60px;
              height: 60px;
            }
            .icon-wrapper1 i {
              font-size: 1.4rem;
            }
            .practice-card h3 {
              font-size: 1.3rem;
            }
            .practice-card {
              padding: 25px 20px;
            }
          }
        `}</style>
      </section>

      {/* Section 3: Energy-Smart Sauna Design */}
      <section className="energy-section relative w-full py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="section-header text-center mb-12">
            <h2
              className="text-4xl font-bold mb-2"
              style={{ color: "#8B5E3C", fontFamily: "Montserrat, sans-serif" }}
            >
              Energy-Smart Sauna Design
            </h2>
            <p className="section-subtitle text-center max-w-[800px] mx-auto font-light text-black">
              Our saunas are engineered for optimal energy efficiency, ensuring
              a perfect sauna experience with minimal environmental impact.
            </p>
          </div>

          <div className="energy-grid grid md:grid-cols-2 gap-12 items-center max-w-[1100px] mx-auto">
            {/* Image */}
            <div className="energy-image-card rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:translate-y-[-3px] hover:shadow-2xl">
              <img
                src="https://www.sawo.com/wp-content/uploads/2025/05/SAWO_Cumulus_Wall_NS.webp"
                alt="Energy Smart Sauna Design"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Features */}
            <div className="energy-feature-column flex flex-col items-center">
              <div className="energy-feature-grid grid gap-6 w-full">
                <div className="energy-feature-card flex items-start gap-5 bg-white rounded-lg p-6 border-l-4 border-[#A67853] shadow-md transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                  <div className="icon-wrapper1 w-12 h-12 bg-[#A67853] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-bolt text-white text-xl transition-transform duration-300 hover:scale-110"></i>
                  </div>
                  <p className="energy-feature-text text-black text-sm font-light leading-6 pt-1">
                    Heating systems are perfectly matched to sauna size to
                    prevent energy waste.
                  </p>
                </div>

                <div className="energy-feature-card flex items-start gap-5 bg-white rounded-lg p-6 border-l-4 border-[#A67853] shadow-md transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                  <div className="icon-wrapper1 w-12 h-12 bg-[#A67853] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-thermometer-half text-white text-xl transition-transform duration-300 hover:scale-110"></i>
                  </div>
                  <p className="energy-feature-text text-black text-sm font-light leading-6 pt-1">
                    Some models feature smart thermostats for precise
                    temperature control.
                  </p>
                </div>

                <div className="energy-feature-card flex items-start gap-5 bg-white rounded-lg p-6 border-l-4 border-[#A67853] shadow-md transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                  <div className="icon-wrapper1 w-12 h-12 bg-[#A67853] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-sun text-white text-xl transition-transform duration-300 hover:scale-110"></i>
                  </div>
                  <p className="energy-feature-text text-black text-sm font-light leading-6 pt-1">
                    Infrared technology is incorporated to reduce electricity
                    consumption.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="info-banner relative flex items-center justify-center bg-gradient-to-tr from-[#8B5E3C] to-[#A67853] rounded-xl shadow-lg p-8 mt-6">
            <img
              src="https://www.sawo.com/wp-content/uploads/2026/02/Wood-Pattern-Brown-03.png"
              alt="Sustainable Wood"
              className="absolute left-10 top-1/2 transform -translate-y-1/2 h-[75px] w-auto"
            />
            <p className="text-white text-lg leading-7 max-w-[800px] text-center">
              By choosing SAWO, you invest in a product made from sustainable
              materials, a manufacturing process that respects natural
              resources, and a healthier indoor environment.
            </p>
          </div>
        </div>

        {/* Add custom styles for hover effects */}
        <style jsx>{`
          .energy-image-card img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .energy-feature-card:hover .icon-wrapper1 i {
            transform: scale(1.2);
          }
          @media (max-width: 768px) {
            .energy-grid {
              grid-template-columns: 1fr;
              gap: 8;
            }
            .info-banner img {
              position: static;
              transform: none;
              margin-bottom: 15px;
              height: 60px;
              width: auto;
            }
          }
        `}</style>

        {/* Section 4: Waste Into Worth */}
      </section>
      <section className="waste-hierarchy-section">
        <div className="header-wrapper">
          <h2>Waste into Worth: Closing the Loop</h2>
          <p className="waste-intro">
            We follow the Waste Hierarchy Directive (EU) 2018/851, prioritizing
            waste minimization, reuse, and recovery
          </p>
        </div>
        <div className="waste-two-column">
          <div className="waste-content-col">
            <div className="waste-items">
              <div className="waste-item">
                <div className="waste-number">1</div>
                <div className="waste-item-content">
                  <h3>Waste Minimization</h3>
                  <p>
                    Advanced cutting techniques limit unnecessary waste, using
                    both parts of cut-offs to reduce material consumption.
                  </p>
                </div>
              </div>

              <div className="waste-item">
                <div className="waste-number">2</div>
                <div className="waste-item-content">
                  <h3>Waste Reuse</h3>
                  <p>
                    Any remaining wood pieces are repurposed into other designs.
                  </p>
                </div>
              </div>

              <div className="waste-item">
                <div className="waste-number">3</div>
                <div className="waste-item-content">
                  <h3>Waste Recovery</h3>
                  <p>
                    Sawdust and unsavable wood cut-offs fuel biomass boilers,
                    powering our facilities with renewable energy and reducing
                    our carbon footprint.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="waste-image-col">
            <div className="waste-image-wrapper">
              <img
                src="https://www.sawo.com/wp-content/uploads/2026/01/waste-hierarchy-sustainability.png"
                alt="Waste Hierarchy"
              />
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx>{`
          @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap");

          .waste-hierarchy-section {
            max-width: 1200px;
            margin: 0 auto;
            padding: 60px 20px;
            font-family: "Montserrat", sans-serif;
          }

          .header-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          h2 {
            font-family: "Montserrat", sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: #a67853;
            line-height: 1.15;
            margin-bottom: 6px;
          }

          .waste-intro {
            font-size: 1.1rem;
            color: black;
            line-height: 1.4;
            max-width: 700px;
          }

          .waste-two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            align-items: start;
          }

          .waste-content-col {
            order: 1;
          }

          .waste-image-col {
            order: 2;
            position: relative;
          }

          .waste-image-wrapper img {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 8px;
          }

          .waste-items {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .waste-item {
            display: flex;
            gap: 20px;
            padding: 25px;
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
            border-radius: 10px;
            border-left: 4px solid #a67853;
            box-shadow: 0 5px 15px rgba(139, 94, 60, 0.08);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .waste-item:hover {
            transform: translateX(5px);
            box-shadow: 0 12px 35px rgba(139, 94, 60, 0.18);
          }

          .waste-number {
            flex-shrink: 0;
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.1rem;
            box-shadow: 0 4px 15px rgba(139, 94, 60, 0.25);
            transition:
              transform 0.3s ease,
              box-shadow 0.3s ease;
          }

          .waste-item:hover .waste-number {
            transform: scale(1.2);
            box-shadow: 0 6px 20px rgba(139, 94, 60, 0.35);
          }
          .waste-item-content h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 1.2rem;
            font-weight: 600;
            color: #8b5e3c;
            margin-bottom: 8px;
            letter-spacing: 0.3px;
          }

          .waste-item-content p {
            font-size: 0.95rem;
            color: black;
            line-height: 1.6;
            margin: 0;
            font-weight: 300;
            letter-spacing: 0.2px;
          }

          @media (max-width: 992px) {
            .waste-two-column {
              grid-template-columns: 1fr;
              gap: 40px;
            }

            .waste-hierarchy-section {
              padding: 40px 20px;
            }

            h2 {
              font-size: 2.1rem;
            }

            .waste-intro {
              font-size: 1rem;
            }
          }

          @media (max-width: 768px) {
            h2 {
              font-size: 1.9rem;
            }

            .waste-intro {
              font-size: 0.95rem;
            }

            .waste-item {
              padding: 20px;
              gap: 15px;
            }

            .waste-number {
              width: 40px;
              height: 40px;
              font-size: 1rem;
            }

            .waste-item-content h3 {
              font-size: 1.1rem;
            }

            .waste-item-content p {
              font-size: 0.9rem;
            }

            .waste-image-wrapper {
              padding: 20px;
            }
          }
        `}</style>
      </section>

      {/* Section 5: Sauna is Wellbeing */}
      <section className="unique-wellbeing">
        {/* Title */}
        <div className="uw-title-wrapper">
          <div className="uw-title">
            Sauna is Wellbeing
            <span>Sustainability is Wellbeing</span>
          </div>
        </div>

        {/* Quote + Image */}
        <div className="unique-wellbeing-quote-container">
          <div className="unique-wellbeing-quote-box">
            <div className="unique-wellbeing-quote-icon">
              <i className="fas fa-quote-left"></i>
            </div>
            <p className="unique-wellbeing-quote-text">
              Health and wellbeing is at the base of having a good life.
              Sustainability not only looks at the wellbeing of people, but also
              at the wellbeing of the Earth. At SAWO,{" "}
              <span className="unique-wellbeing-quote-highlight">
                wellbeing is our business
              </span>
              . We make sure you are taken care of with a sauna. We also do our
              best to make sure the Earth is taken care of.{" "}
              <span className="unique-wellbeing-quote-highlight">
                Wellbeing is Sustainability. Be well. Sauna well.
              </span>
            </p>
          </div>

          <div className="unique-wellbeing-quote-image-wrapper">
            <img
              className="unique-wellbeing-quote-image"
              src="https://www.sawo.com/wp-content/uploads/2026/01/health-well-being.webp"
              alt="Sauna in a sustainable setting"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="unique-wellbeing-cta">
          <div className="unique-wellbeing-cta-icon">
            <i className="fas fa-spa"></i>
          </div>
          <p className="unique-wellbeing-cta-text">
            Join us on our journey to make sustainable sauna experiences
            accessible and enjoyable worldwide. Experience the warmth of nature
            with a sauna that cares for you and the Earth.
          </p>
          <Link
            to={menuPaths.sauna.rooms} // or whichever Sauna page path you want
            className="uwb-sauna-button"
          >
            EXPLORE <i className="fas fa-chevron-right"></i>
          </Link>
        </div>

        {/* Styles */}
        <style jsx>{`
          @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap");

          .unique-wellbeing {
            max-width: 1200px;
            margin: 0 auto;
            padding: 60px 20px;
            font-family: "Montserrat", sans-serif;
            text-align: center;
          }

          .uw-title-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-bottom: 50px;
          }

          .uw-title {
            font-family: "Montserrat", sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: #a67853;
            line-height: 1.15;
            text-align: center;
            display: inline-block;
          }

          .uw-title span {
            display: block;
            font-family: "Montserrat", sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            color: #a67853;
            line-height: 1.15;
          }

          .unique-wellbeing-quote-container {
            display: flex;
            gap: 30px;
            align-items: flex-start;
            max-width: 1100px;
            margin: 0 auto 40px auto;
            flex-wrap: wrap;
          }

          .unique-wellbeing-quote-box {
            background: #ffffff;
            border-left: 6px solid #a67853;
            border-radius: 24px;
            padding: 60px 40px 40px 40px;
            position: relative;
            box-shadow: 0 20px 60px rgba(139, 94, 60, 0.15);
            flex: 1 1 400px;
            transition: all 0.4s ease;
            font-family: "Montserrat", sans-serif;
          }

          .unique-wellbeing-quote-box:hover {
            box-shadow: 0 30px 80px rgba(139, 94, 60, 0.25);
            transform: translateY(-5px);
          }

          .unique-wellbeing-quote-icon {
            width: 65px;
            height: 65px;
            background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: -32px;
            left: 20px;
            box-shadow: 0 6px 20px rgba(139, 94, 60, 0.3);
            animation: uw-float 3s ease-in-out infinite;
            z-index: 2;
          }

          @keyframes uw-float {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .unique-wellbeing-quote-icon i {
            font-size: 1.8rem;
            color: white;
          }

          .unique-wellbeing-quote-text {
            font-family: "Montserrat", sans-serif;
            font-weight: 400;
            font-style: italic;
            font-size: 1.05rem;
            line-height: 1.7;
            color: black;
            margin: 0;
            text-align: left;
          }

          .unique-wellbeing-quote-highlight {
            font-family: "Montserrat", sans-serif;
            font-weight: 600;
            font-style: italic;
            color: #8b5e3c;
          }

          .unique-wellbeing-quote-image-wrapper {
            flex: 1 1 400px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 40px rgba(139, 94, 60, 0.2);
            transition: all 0.4s ease;
          }

          .unique-wellbeing-quote-image {
            width: 100%;
            height: 380px;
            object-fit: cover;
            border-radius: 20px;
            display: block;
          }

          .unique-wellbeing-cta {
            max-width: 950px;
            margin: 0 auto;
            background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
            border-radius: 24px;
            padding: 35px 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(139, 94, 60, 0.35);
            transition: all 0.4s ease;
          }

          .unique-wellbeing-cta:hover {
            box-shadow: 0 25px 70px rgba(139, 94, 60, 0.45);
            transform: translateY(-5px);
          }

          .unique-wellbeing-cta-icon {
            width: 75px;
            height: 75px;
            border-radius: 50%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 28px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            transition: all 0.4s ease;
          }

          .unique-wellbeing-cta:hover .unique-wellbeing-cta-icon {
            transform: scale(1.12) rotate(8deg);
          }

          .unique-wellbeing-cta-icon i {
            font-size: 2.2rem;
            color: #a67853;
          }

          .unique-wellbeing-cta-text {
            font-family: "Montserrat", sans-serif;
            font-weight: 400;
            font-size: 1.05rem;
            line-height: 1.7;
            color: #ffffff;
            margin-bottom: 20px;
          }

          .uwb-sauna-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 9px 32px;
            background: #ffffff;
            color: #a67853;
            font-size: 0.9rem;
            font-weight: 600;
            font-family: "Montserrat", sans-serif;
            border-radius: 6px;
            border: 3px solid transparent;
            transition: all 0.3s ease;
            letter-spacing: 0.4px;
            line-height: 1;
            box-sizing: border-box;
            text-decoration: none;
          }

          .uwb-sauna-button:hover {
            background: transparent;
            color: #ffffff;
            border: 3px solid #ffffff;
          }

          @media (max-width: 992px) {
            .unique-wellbeing-quote-container {
              flex-direction: column;
              gap: 40px;
            }
            .unique-wellbeing-quote-box,
            .unique-wellbeing-quote-text {
              text-align: center;
            }
          }

          @media (max-width: 768px) {
            .unique-wellbeing {
              padding: 40px 20px;
            }
            .uw-title {
              font-size: 2rem;
            }
            .uw-title span {
              font-size: 2rem;
            }
            .unique-wellbeing-quote-box {
              padding: 40px 30px 30px 30px;
            }
            .unique-wellbeing-quote-image {
              width: 100%;
              height: auto;
              aspect-ratio: 1 / 1;
            }
          }
        `}</style>
      </section>
      {/* Styles required for leaves */}
      <style>{`
        #leavesContainer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        .fallingLeaf {
          position: absolute;
          font-size: 30px;
          color: #af8564;
          opacity: 0.8;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .hero-section {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-image {
            margin: 0 auto;
            width: 80%;
            height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default Sustainability;

