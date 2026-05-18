import React from 'react';
import { Link } from 'react-router-dom';
import menuPaths from '../../menuPaths';
import ButtonClear from '../../components/Buttons/ButtonClear';

const Support = () => {
  return (
    <div className="relative">
      <style>{`
        .support-hero {
          min-height: 95vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 48px 24px;
          background: linear-gradient(135deg, #2c1f13 0%, #5c3d2a 50%, #2c1f13 100%);
          color: white;
        }
        .support-hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; font-family: 'Montserrat', sans-serif; }
        .support-hero p { font-size: 20px; opacity: 0.9; margin-bottom: 32px; max-width: 600px; }
        .support-section { padding: 64px 24px; max-width: 1200px; margin: 0 auto; }
        .support-section h2 { font-size: 32px; font-weight: 700; margin-bottom: 16px; color: #2c1f13; }
        .support-section p { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 24px; }
        .support-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; margin: 32px 0; }
        .support-card { padding: 32px 24px; border: 1px solid #e0d5c7; border-radius: 8px; background: #fafaf8; transition: all 0.3s; cursor: pointer; text-decoration: none; color: inherit; display: flex; flex-direction: column; }
        .support-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: #a67853; transform: translateY(-4px); }
        .support-card-icon { font-size: 48px; color: #a67853; margin-bottom: 16px; }
        .support-card h3 { font-size: 20px; font-weight: 600; color: #2c1f13; margin-bottom: 12px; }
        .support-card p { font-size: 14px; line-height: 1.6; color: #666; flex-grow: 1; margin-bottom: 16px; }
        .support-card-link { color: #a67853; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
        .support-contact-box { background: #f9f7f5; padding: 32px; border-radius: 8px; margin-top: 32px; }
        .support-contact-box h3 { font-size: 20px; font-weight: 600; color: #2c1f13; margin-bottom: 16px; }
        .support-contact-item { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; font-size: 16px; }
        .support-contact-item i { font-size: 24px; color: #a67853; width: 32px; }
        .support-contact-item a { color: #a67853; text-decoration: none; font-weight: 500; }
        .support-contact-item a:hover { text-decoration: underline; }
        @media (max-width: 640px) { .support-hero h1 { font-size: 32px; } }
      `}</style>

      {/* HERO */}
      <section className="support-hero">
        <div>
          <h1>SUPPORT CENTER</h1>
          <p>Everything you need to get the most out of your SAWO products</p>
        </div>
      </section>

      {/* SUPPORT RESOURCES */}
      <section className="support-section" style={{ backgroundColor: "#f9f7f5" }}>
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
                Find answers to common questions about Finnish saunas, steam rooms, installation, maintenance, and more.
              </p>
              <span className="support-card-link">
                Browse FAQ <i className="fas fa-arrow-right"></i>
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
                Use Calculator <i className="fas fa-arrow-right"></i>
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
                Download Manuals <i className="fas fa-arrow-right"></i>
              </span>
            </div>
          </Link>

          {/* Product Catalogue Card */}
          <Link to={menuPaths.support.catalogue} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="support-card">
              <div className="support-card-icon">
                <i className="fas fa-catalog"></i>
              </div>
              <h3>Product Catalogue</h3>
              <p>
                Browse our complete product catalogue with specifications, pricing, and technical details for all offerings.
              </p>
              <span className="support-card-link">
                View Catalogue <i className="fas fa-arrow-right"></i>
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* CONTACT SUPPORT */}
      <section className="support-section">
        <h2>Need Direct Support?</h2>
        <p>
          Our technical support team is ready to help with questions, troubleshooting, or special requests.
        </p>

        <div className="support-contact-box">
          <h3>Technical Support</h3>

          <div className="support-contact-item">
            <i className="fas fa-envelope"></i>
            <div>
              <strong>Email:</strong>{' '}
              <a href="mailto:help@sawo.com">help@sawo.com</a>
            </div>
          </div>

          <div className="support-contact-item">
            <i className="fas fa-phone"></i>
            <div>
              <strong>Phone:</strong>{' '}
              <a href="tel:+63323412233">+63 323 412 233</a>
            </div>
          </div>

          <div className="support-contact-item">
            <i className="fab fa-whatsapp"></i>
            <div>
              <strong>WhatsApp:</strong>{' '}
              <a href="tel:+639497594450">+63 949 759 4450</a>
            </div>
          </div>

          <p style={{ marginTop: '24px', fontSize: '14px', color: '#666', borderTop: '1px solid #e0d5c7', paddingTop: '16px' }}>
            For technical support and troubleshooting, we recommend reaching out via WhatsApp or email. Our team typically responds within 24 hours.
          </p>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section className="support-section" style={{ backgroundColor: "#2c1f13", color: "white", textAlign: "center" }}>
        <h2 style={{ color: "white" }}>Ready to Explore Our Products?</h2>
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
