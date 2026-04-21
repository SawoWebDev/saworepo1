// LatestNews.jsx

import React from "react";

// Image imports
import LNhero from "../../assets/About/Latest News/LNhero.webp";
import LN1 from "../../assets/About/Latest News/LN1.webp";
import LN2 from "../../assets/About/Latest News/LN2.webp";
import LN3 from "../../assets/About/Latest News/LN3.jpg";
import LN4 from "../../assets/About/Latest News/LN4.jpg";
import AquanaleLogo from "../../assets/About/Latest News/Aquanale-logo.webp";
import PiscinaLogo from "../../assets/About/Latest News/piscina-logo.webp";

const LatestNews = () => {
  return (
    <div className="relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap');

        /* ── BASE ── */
        .ln-wrapper * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .ln-wrapper {
          font-family: 'Montserrat', sans-serif;
          color: #333;
          background: #fff;
        }

        /* ── HERO ── */
        .ln-hero {
          min-height: 95vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .ln-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .ln-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.42);
        }
        .ln-hero h1 {
          position: relative;
          z-index: 2;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          font-weight: 700;
          line-height: 45px;
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        .ln-hero p {
          position: relative;
          z-index: 2;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 22px;
          line-height: 40px;
          margin-top: 16px;
          opacity: 0.92;
        }

        /* ── SHARED CONTAINER ── */
        .ln-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        /* ── SECTION HEADING (matches heater pages style) ── */
        .ln-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #AF8564;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .ln-section-title span {
          font-weight: 700;
          color: #AF8564;
        }
        .ln-section-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #141617;
          margin-bottom: 20px;
        }

        /* ── NEWS ROW ── */
        .ln-news-row {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 48px;
          align-items: center;
        }
        .ln-news-img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 8px;
          display: block;
          box-shadow: 0 15px 40px rgba(139, 94, 60, 0.18);
          transition: all 0.4s ease;
        }
        .ln-news-img:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(139, 94, 60, 0.28);
        }

        /* ── CUSTOMIZABLE LOGO BAR IMAGES ── */
        /* AQUANALE Logo - Customize here */
        .ln-logo-bar .aquanale-logo {
          height: 200px !important;  /* ← Change this value to adjust logo height */
          width: auto !important;
          object-fit: contain !important;
        }
        /* PISCINA Logo - Customize here */
        .ln-logo-bar .piscina-logo {
          height: 130px !important;  /* ← Change this value to adjust logo height */
          width: auto !important;
          object-fit: contain !important;
        }

        /* ── BODY TEXT ── */
        .ln-body {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 300;
          color: #141617;
          line-height: 1.75;
          letter-spacing: 0.2px;
        }
        .ln-body p {
          margin-bottom: 12px;
        }
        .ln-body p:last-child {
          margin-bottom: 0;
        }

        /* ── EVENT DATE LABEL ── */
        .ln-event-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: #AF8564;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 2px;
          display: block;
        }
        .ln-event-info {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 300;
          color: #777;
          margin-bottom: 16px;
          letter-spacing: 0.2px;
        }

        /* ── DIVIDER ── */
        .ln-divider {
          border: none;
          border-top: 1px solid #ede5db;
          margin: 0 20px;
        }

        /* ── LOGO BAR ── */
        .ln-logo-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 36px 20px;
          border-top: 1px solid #ede5db;
          border-bottom: 1px solid #ede5db;
        }
        .ln-logo-bar img {
          height: 52px;
          width: auto;
          object-fit: contain;
          filter: saturate(0.85);
          transition: filter 0.25s, transform 0.25s;
        }
        .ln-logo-bar img:hover {
          filter: saturate(1.5);
          transform: scale(1.05);
        }


        /* ── ITALIC / BOLD ── */
        .ln-italic { font-style: italic; }
        .ln-bold   { font-weight: 700; color: #222; }

        /* ── CLOSING CTA BANNER ── */
        .ln-cta-banner {
          background: linear-gradient(135deg, #AF8564 0%, #c4a077 100%);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(175, 133, 100, 0.35);
          transition: all 0.4s ease;
        }
        .ln-cta-banner:hover {
          box-shadow: 0 25px 70px rgba(175, 133, 100, 0.45);
          transform: translateY(-5px);
        }
        .ln-cta-icon {
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          transition: all 0.4s ease;
        }
        .ln-cta-banner:hover .ln-cta-icon {
          transform: scale(1.12) rotate(8deg);
        }
        .ln-cta-icon i {
          font-size: 2rem;
          color: #AF8564;
        }
        .ln-cta-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #fff;
          max-width: 700px;
          margin: 0 auto 24px;
        }

        /* ── CUSTOM BUTTONS ── */
        .ln-btn {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 14px 36px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: inline-block;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .ln-btn-brown {
          background-color: #AF8564;
          color: #fff;
        }
        .ln-btn-brown:hover {
          background-color: #8b5e3c;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(175, 133, 100, 0.3);
        }
        .ln-btn-white {
          background-color: #fff;
          color: #AF8564;
        }
        .ln-btn-white:hover {
          background-color: #f5f5f5;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .ln-news-row {
            grid-template-columns: 1fr;
          }
          .ln-news-img {
            height: 240px;
            order: -1;
          }
          .ln-section-title {
            font-size: 1.9rem;
          }
          .ln-hero h1 {
            font-size: 28px !important;
            line-height: 32px !important;
          }
          .ln-hero p {
            font-size: 16px !important;
            line-height: 28px !important;
          }
          .ln-logo-bar {
            gap: 28px;
          }
          .ln-logo-bar img {
            height: 38px;
          }
          .ln-container {
            padding: 40px 20px;
          }
          .ln-cta-banner {
            padding: 30px 20px;
          }
        }
      `}</style>

      <div className="ln-wrapper">

        {/* ════════════════════════════
             HERO
        ════════════════════════════ */}
        <section className="ln-hero">
          <img src={LNhero} alt="SAWO sauna interior" className="ln-hero-img" />
          <div className="ln-hero-overlay" />
          <h1>Latest News</h1>
          <p>Stay updated with SAWO stories, events, and milestones</p>
        </section>

        {/* ════════════════════════════
             SECTION 1 — Recent Exhibitions
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>Recent</span>
              <h2 className="ln-section-title">
                <span>Exhibitions</span>
              </h2>
              <p className="ln-section-subtitle">Aquanale &amp; Piscina Barcelona</p>

              <div className="ln-body">
                <p>
                  We are happy to announce that we will be attending two exhibitions in Europe less than a month apart. Come and see us at Aquanale and Piscina Barcelona.
                </p>

                <span className="ln-event-label" style={{ marginTop: "16px" }}>Aquanale: OCTOBER 28-31, 2025</span>
                <p className="ln-event-info">
                  Hall 8 Stand A028 – B209, Messeplatz 1, 50679 Cologne, Germany
                </p>

                <span className="ln-event-label">Piscina Barcelona: NOVEMBER 17-20, 2025</span>
                <p className="ln-event-info">
                  Stand D90, Recinto Gran Via, Pabellon P1, Nivel 0, Gran Via, Exhibition Centre, Barcelona, Spain
                </p>

                <p>
                  More than simply creating products, we help you bring authentic and personalized Finnish sauna experiences. As we see it, sauna belongs to everyone around the world.
                </p>
                <p>
                  This time around, our exhibition highlights have to do with exceptional innovation in sauna controls and heater design. For further information about these upcoming products, be on the lookout for updates on our website and in our social media channels.
                </p>
                <p>
                  We'll also unveil our new accessory collections—from Essential and Rustic sets to Signature and Dragon designs. Each set is crafted to complement each sauna's aesthetic while focusing on the user's personal sauna experience.
                </p>
                <p>
                  Sauna is more than a room, it provides a wellness lifestyle. At both Aquanale and Piscina Barcelona, you will discover how our products blend authenticity, design, and modern innovations to transform everyday routines into moments of true wellness.
                </p>
                <p className="ln-italic ln-bold">Come see it, feel it, and experience it for yourself.</p>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN1} alt="SAWO exhibition booth" className="ln-news-img" />
          </div>
        </div>

        {/* ── Partner Logo Bar ── */}
        <div className="ln-logo-bar">
          <img src={AquanaleLogo} alt="Aquanale logo" className="aquanale-logo" />
          <img src={PiscinaLogo} alt="Piscina Barcelona logo" className="piscina-logo" />
        </div>

        <hr className="ln-divider" />

        {/* ════════════════════════════
             SECTION 2 — MEZ2 Plant 4 Expansion
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>MEZ2</span>
              <h2 className="ln-section-title">
                Plant 4 <span>Expansion</span>
              </h2>
              <p className="ln-section-subtitle">SAWO Strengthens Global Position With Expansion</p>

              <div className="ln-body">
                <p>
                  We are proud to announce the acquisition of our new Plant 4 in the Mactan Economic Zone 2, MEZ2, in Cebu. This development officially makes us the largest operator in the Estate. The expansion marks a bold step forward in our commitment to meeting global demand and continuing to lead the sauna industry with uncompromising quality and innovation.
                </p>
                <p>
                  By expanding our facilities, we increase our production capacity and reinforce our position as a trusted global brand. The wellness industry continues to experience a remarkable boom, and we are even better equipped to take it on with the expansion.
                </p>
                <p>
                  At the heart of this achievement lies our desire to deliver authentic, personal Finnish sauna experiences worldwide. Every product we create is designed with an emphasis on tradition, quality, and innovation.
                </p>
                <p>
                  We extend our thank you to the Aboitiz Group for their support throughout this journey, to our partners, and to every member of the SAWO community for making this possible.
                </p>
                <p>We look forward to shaping the next era of sauna innovation—together.</p>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN2} alt="MEZ2 Plant 4 contract signing ceremony" className="ln-news-img" />
          </div>
        </div>

        <hr className="ln-divider" />

        {/* ════════════════════════════
             SECTION 3 — Talent Search
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>Talent</span>
              <h2 className="ln-section-title">
                <span>Search</span>
              </h2>
              <p className="ln-section-subtitle">Join Our Growing Team In Cebu</p>

              <div className="ln-body">
                <p>
                  We believe that our people are the driving force behind every achievement. As we celebrate the expansion of Plant 4 in Cebu, we are opening a new chapter—not only for production, but also for people. We are now looking for passionate individuals to join our team in Cebu, Philippines.
                </p>
                <p>
                  We are looking for talents who bring experience in the sauna and wellness industry, and who are eager to contribute to a global brand that delivers authentic Finnish sauna experiences to over 90 countries and counting. If you are a self-starter that thrives in a dynamic, tropical setting and wants to be part of a company that blends tradition with innovation, we are the right fit for you.
                </p>
                <p className="ln-bold ln-italic">
                  Explore our job openings and join us in shaping the next era of wellness.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                <a href="/careers" className="ln-btn ln-btn-brown">Job Openings</a>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN3} alt="SAWO talent search" className="ln-news-img" />
          </div>
        </div>

        <hr className="ln-divider" />

        {/* ════════════════════════════
             SECTION 4 — Earthquake Relief
        ════════════════════════════ */}
        <div className="ln-container">
          <div className="ln-news-row">

            {/* LEFT: Text */}
            <div>
              <span className="ln-event-label" style={{ marginBottom: "4px" }}>Earthquake</span>
              <h2 className="ln-section-title">
                Relief in <span>Cebu</span>
              </h2>
              <p className="ln-section-subtitle">SAWO Staff Join Forces to Aid Cebu Earthquake Victims</p>

              <div className="ln-body">
                <p>When disaster strikes close to home, we come together to help.</p>
                <p>
                  On September 30th, a strong, 6.9 magnitude earthquake struck off the Northeast coast of Cebu, leaving dozens dead, hundreds injured, and many more without shelter. As part of the Cebu community, we acted quickly to support those affected.
                </p>
                <p>
                  Shortly after the quake, we organized a company-wide relief effort, delivering mattresses, food, hygiene products, and other essentials to the hardest-hit areas. Our team members personally distributed the supplies to affected SAWO families and their neighbors in the surrounding communities.
                </p>
                <p>
                  Cebu has long been home to SAWO, and during this time of hardship, we're reminded how important it is to stand with the community that has embraced us. In turn, it is up to us to embrace the community back.
                </p>
              </div>
            </div>

            {/* RIGHT: Image */}
            <img src={LN4} alt="SAWO earthquake relief efforts in Cebu" className="ln-news-img" />
          </div>
        </div>

        {/* ════════════════════════════
             CLOSING CTA BANNER
             (mirrors unique-wellbeing-cta from Sustainability)
        ════════════════════════════ */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 60px" }}>
          <div className="ln-cta-banner">
            <div className="ln-cta-icon">
              <i className="fas fa-newspaper"></i>
            </div>
            <p className="ln-cta-text">
              Stay connected with the SAWO story. From product breakthroughs to community action,
              every chapter is a reflection of who we are and what we stand for.
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
              <a href="/sauna-products" className="ln-btn ln-btn-white">Explore Products</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LatestNews;