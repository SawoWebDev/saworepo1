// Infrared.jsx

import React from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";

const Infrared = () => {
  return (
    <div className="relative">
      <style>{`
        .ir-hero {
          min-height: 95vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 48px 24px;
          background: linear-gradient(135deg, #2c1f13 0%, #5c3d2a 50%, #2c1f13 100%);
          color: white;
        }
        .ir-hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; font-family: 'Montserrat', sans-serif; }
        .ir-hero p { font-size: 20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; }
        .ir-section { padding: 64px 24px; max-width: 1200px; margin: 0 auto; }
        .ir-section h2 { font-size: 32px; font-weight: 700; margin-bottom: 16px; color: #2c1f13; }
        .ir-section p { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 24px; }
        .ir-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; margin: 32px 0; }
        .ir-card { padding: 24px; border: 1px solid #e0d5c7; border-radius: 8px; background: #fafaf8; transition: all 0.3s; }
        .ir-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: #a67853; }
        .ir-card h3 { font-size: 18px; font-weight: 600; color: #2c1f13; margin-bottom: 12px; }
        @media (max-width: 640px) { .ir-hero h1 { font-size: 32px; } }
      `}</style>

      {/* HERO */}
      <section className="ir-hero">
        <div>
          <h1>INFRARED SAUNAS</h1>
          <p>Healing warmth through infrared technology — deeper penetration, gentler on the body</p>
          <div style={{ marginTop: "24px" }}>
            <ButtonClear
              text="EXPLORE PRODUCTS"
              href="https://www.sawo.com/sawo-products/infrared-sauna/"
            />
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="ir-section" style={{ backgroundColor: "#f9f7f5" }}>
        <h2>Why Choose Infrared Saunas</h2>
        <p>
          Infrared saunas use radiant heat to penetrate deep into your body, promoting wellness and relaxation
          without the extreme temperatures of traditional saunas. Perfect for those seeking health benefits with
          enhanced comfort.
        </p>
        <div className="ir-grid">
          <div className="ir-card">
            <i className="fas fa-heartbeat" style={{ fontSize: "32px", color: "#a67853", marginBottom: "12px" }} />
            <h3>Deep Heat Penetration</h3>
            <p>Infrared rays penetrate 1.5 inches below the skin, promoting circulation and muscle relaxation.</p>
          </div>
          <div className="ir-card">
            <i className="fas fa-thermometer-half" style={{ fontSize: "32px", color: "#a67853", marginBottom: "12px" }} />
            <h3>Lower Temperatures</h3>
            <p>Operates at 120-150°F compared to traditional saunas at 160-200°F, gentler and more comfortable.</p>
          </div>
          <div className="ir-card">
            <i className="fas fa-leaf" style={{ fontSize: "32px", color: "#a67853", marginBottom: "12px" }} />
            <h3>Health Benefits</h3>
            <p>Improved cardiovascular health, detoxification, pain relief, and enhanced recovery.</p>
          </div>
          <div className="ir-card">
            <i className="fas fa-zap" style={{ fontSize: "32px", color: "#a67853", marginBottom: "12px" }} />
            <h3>Energy Efficient</h3>
            <p>Uses 30-40% less energy than traditional saunas while delivering superior wellness results.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ir-section">
        <h2>How Infrared Technology Works</h2>
        <p>
          Infrared saunas emit electromagnetic radiation in the infrared spectrum—the same wavelengths your body
          naturally emits. Unlike traditional saunas that heat the air around you, infrared heaters warm your body
          directly, creating a more efficient and therapeutic experience.
        </p>
        <div style={{
          background: "linear-gradient(135deg, #f0ebe3 0%, #e8dfd5 100%)",
          padding: "32px",
          borderRadius: "8px",
          marginTop: "24px"
        }}>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            <strong>Pro Tip:</strong> Start with 20-30 minute sessions at 120°F and gradually increase as your body adapts.
            Stay hydrated and consult your doctor if you have existing health conditions.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="ir-section" style={{ backgroundColor: "#2c1f13", color: "white", textAlign: "center" }}>
        <h2 style={{ color: "white" }}>Ready to Experience Infrared Wellness?</h2>
        <p>Explore our complete range of infrared sauna models and find the perfect fit for your home or facility.</p>
        <ButtonClear
          text="VIEW CATALOGUE"
          href="https://www.sawo.com/sawo-products/infrared-sauna/"
        />
      </section>
    </div>
  );
};

export default Infrared;
