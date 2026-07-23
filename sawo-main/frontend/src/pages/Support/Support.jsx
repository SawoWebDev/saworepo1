import React from 'react';
import { Link } from 'react-router-dom';
import menuPaths from '../../menuPaths';
import ButtonClear from '../../components/Buttons/ButtonClear';
import HeroWave from '../../components/HeroWave';

import supportHeroImg from '../../assets/CUB3-Ni2_InsideSaunaRoom.webp';

const Support = () => {
  return (
    <div className="relative">
      <style>{`

        /* Hero follows the same template as the heater pages (see
           pages/Sauna/heaters/WallMounted.jsx) — full-bleed image from y=0,
           no external margin pushing it down (that gap is what let the
           page's white background show through the transparent header). */
        .support-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px; line-height: 52px;
          font-weight: 700; color: #fff; margin: 0 0 12px;
          letter-spacing: 0.5px;
        }

        .support-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 20px; font-weight: 300;
          color: rgba(255,255,255,0.88); margin: 0 auto;
          max-width: 600px; line-height: 1.5;
        }

        .support-section {
          padding: 80px 32px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Montserrat', sans-serif;
          background: transparent;
        }

        .support-section h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
        }

        .support-section > p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #333;
          margin-bottom: 40px;
          text-align: center;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .support-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin: 48px 0;
        }

        .support-card {
          padding: 28px 18px;
          border: 2px solid rgba(175, 133, 100, 0.2);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.5);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(139, 94, 60, 0.08);
          backdrop-filter: blur(8px);
        }

        .support-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(166, 120, 83, 0.08) 0%, rgba(166, 120, 83, 0.03) 100%);
          transition: left 0.35s ease;
          z-index: 0;
        }

        .support-card:hover {
          transform: translateY(-8px);
          border-color: #af8564;
          box-shadow: 0 12px 32px rgba(175, 133, 100, 0.15);
          background: rgba(255, 255, 255, 0.8);
        }

        .support-card:hover::before {
          left: 0;
        }

        .support-card:hover::before {
          left: 0;
        }

        .support-card > * {
          position: relative;
          z-index: 1;
        }

        .support-card-icon {
          font-size: 36px;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 14px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: rgba(175, 133, 100, 0.1);
          -webkit-background-clip: unset;
          -webkit-text-fill-color: #af8564;
        }

        .support-card:hover .support-card-icon {
          transform: scale(1.1) rotate(5deg);
          background: rgba(175, 133, 100, 0.2);
        }

        .support-card h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #2c1a0e;
          margin-bottom: 10px;
          transition: color 0.3s ease;
          letter-spacing: 0.3px;
        }

        .support-card:hover h3 {
          color: #af8564;
        }

        .support-card p {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #666;
          flex-grow: 1;
          margin-bottom: 12px;
        }

        .support-card-link {
          color: #af8564;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(175, 133, 100, 0.08);
        }

        .support-card:hover .support-card-link {
          gap: 10px;
          background: rgba(175, 133, 100, 0.15);
          color: #8b5e3c;
        }

        .support-contact-section {
          background: #fff;
          padding: 0;
        }

        .support-contact-box {
          background: transparent;
          padding: 40px 0;
          border-radius: 0;
          margin-top: 40px;
          border: none;
          box-shadow: none;
        }

        .support-contact-box h3 {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 32px;
          text-align: center;
        }

        .support-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .support-contact-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 18px;
          border: 2px solid rgba(175, 133, 100, 0.2);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.5);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(139, 94, 60, 0.08);
          backdrop-filter: blur(8px);
        }

        .support-contact-item:hover {
          transform: translateY(-8px);
          border-color: #af8564;
          box-shadow: 0 12px 32px rgba(175, 133, 100, 0.15);
          background: rgba(255, 255, 255, 0.8);
        }

        .support-contact-item i {
          font-size: 40px;
          color: #af8564;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(175, 133, 100, 0.1);
          border-radius: 50%;
          margin-bottom: 14px;
          transition: all 0.3s ease;
        }

        .support-contact-item:hover i {
          transform: scale(1.1) rotate(-5deg);
          background: rgba(175, 133, 100, 0.2);
        }

        .support-contact-item strong {
          color: #2c1a0e;
          font-weight: 700;
          font-size: 1.05rem;
          margin-bottom: 10px;
          letter-spacing: 0.3px;
        }

        .support-contact-item a {
          color: #af8564;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .support-contact-item a:hover {
          color: #8b5e3c;
        }

        .support-contact-note {
          margin-top: 32px;
          padding: 24px;
          background: rgba(175, 133, 100, 0.06);
          border-left: 4px solid #af8564;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #2c1a0e;
          line-height: 1.6;
          width: 100%;
        }

        .support-cta-section {
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          color: white;
          text-align: center;
          padding: 48px 32px !important;
          border-radius: 16px;
          margin-top: 60px;
          margin-bottom: 40px;
          box-shadow: 0 20px 60px rgba(139, 94, 60, 0.25);
        }

        .support-cta-section h2 {
          color: white;
          background: none;
          -webkit-text-fill-color: unset;
          font-size: 1.8rem;
          margin-bottom: 12px;
        }

        .support-cta-section p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .support-hero-title {
            font-size: 28px;
            line-height: 36px;
          }

          .support-hero-subtitle {
            font-size: 16px;
          }

          .support-section {
            padding: 60px 24px;
          }

          .support-section h2 {
            font-size: 2rem;
          }

          .support-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .support-contact-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .support-contact-box {
            padding: 32px 24px;
          }

          .support-cta-section {
            padding: 60px 24px !important;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="relative isolate min-h-[95vh] flex flex-col justify-center items-center text-center px-6" style={{ backgroundColor: "#241c17" }}>
        <img
          src={supportHeroImg}
          alt="Support Center"
          className="absolute inset-0 w-full h-full object-cover object-center -z-10"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-black/40 -z-10" />
        <div className="relative z-10">
          <h1 className="support-hero-title">SUPPORT CENTER</h1>
          <p className="support-hero-subtitle">Everything you need to get the most out of your SAWO products</p>
        </div>
        <HeroWave />
      </section>

      {/* SUPPORT RESOURCES */}
      <section className="support-section">
        <h2>How Can We Help?</h2>
        <p>
          Explore our comprehensive support resources, from detailed product guides to interactive tools and FAQs.
          We're here to ensure you get the perfect SAWO experience.
        </p>

        <div className="support-grid">
          {/* FAQ Card */}
          <Link to={menuPaths.support.faq} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="support-card">
              <div className="support-card-icon">
                <i className="fas fa-question-circle"></i>
              </div>
              <h3>Frequently Asked Questions</h3>
              <p>
                Find answers to common sauna and product questions.
              </p>
              <span className="support-card-link">
                Browse FAQ <i className="fas fa-chevron-right"></i>
              </span>
            </div>
          </Link>

          {/* Sauna Calculator Card */}
          <Link to={menuPaths.support.saunaCalculator} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="support-card">
              <div className="support-card-icon">
                <i className="fas fa-calculator"></i>
              </div>
              <h3>Sauna Calculator</h3>
              <p>
                Use our interactive tool to calculate the perfect sauna heater size for your space based on room dimensions.
              </p>
              <span className="support-card-link">
                Use Calculator <i className="fas fa-chevron-right"></i>
              </span>
            </div>
          </Link>

          {/* User Manuals Card */}
          <Link to={menuPaths.support.manuals} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="support-card">
              <div className="support-card-icon">
                <i className="fas fa-book"></i>
              </div>
              <h3>User Manuals</h3>
              <p>
                Download detailed instruction manuals for all SAWO products including heaters, controls, and accessories.
              </p>
              <span className="support-card-link">
                Download Manuals <i className="fas fa-chevron-right"></i>
              </span>
            </div>
          </Link>

          {/* Product Catalogue Card */}
          <Link to={menuPaths.support.catalogue} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="support-card">
              <div className="support-card-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <h3>Product Catalogue</h3>
              <p>
                Browse our complete product catalogue with specifications, pricing, and technical details for all offerings.
              </p>
              <span className="support-card-link">
                View Catalogue <i className="fas fa-chevron-right"></i>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* CONTACT SUPPORT */}
      <section className="support-section support-contact-section">
        <h2>Need Direct Support?</h2>
        <p>
          Our technical support team is ready to help with questions, troubleshooting, or special requests.
        </p>

        <div className="support-contact-box">
          <h3>Technical Support</h3>

          <div className="support-contact-grid">
            <div className="support-contact-item">
              <i className="fas fa-envelope"></i>
              <strong>Email</strong>
              <a href="mailto:help@sawo.com">help@sawo.com</a>
            </div>

            <div className="support-contact-item">
              <i className="fas fa-phone"></i>
              <strong>Phone</strong>
              <a href="tel:+63323412233">+63 323 412 233</a>
            </div>

            <div className="support-contact-item">
              <i className="fab fa-whatsapp"></i>
              <strong>WhatsApp</strong>
              <a href="tel:+639497594450">+63 949 759 4450</a>
            </div>
          </div>

          <div className="support-contact-note">
            <i className="fas fa-info-circle" style={{ marginRight: '12px', color: '#af8564' }}></i>
            For technical support and troubleshooting, we recommend reaching out via WhatsApp or email. Our team typically responds within 24 hours.
          </div>
        </div>
      </section>

      {/* GETTING STARTED / CTA */}
      <section className="support-section support-cta-section">
        <h2>Ready to Explore Our Products?</h2>
        <p>Discover the perfect sauna, steam room, or infrared solution for your needs.</p>
        <div style={{ marginTop: "32px" }}>
          <ButtonClear
            text="BROWSE ALL PRODUCTS"
            href={menuPaths.products}
          />
        </div>
      </section>
    </div>
  );
};

export default Support;
