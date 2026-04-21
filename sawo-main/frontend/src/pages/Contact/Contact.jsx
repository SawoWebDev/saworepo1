import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faMapMarkerAlt, faPhone, faEnvelope, faGlobe } from "@fortawesome/free-solid-svg-icons";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you for reaching out! We'll get back to you soon.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap');

        /* ── MAIN SECTION ── */
        .ct-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }
        .ct-section:first-of-type {
          padding-top: 130px;
        }
        .ct-section--dark {
        }
        .ct-intro {
          text-align: center;
          margin-bottom: 60px;
        }
        .ct-intro-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          color: #2c1f13;
          margin-bottom: 16px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .ct-intro-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          color: #666;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto;
        }

        /* ── CONTACT GRID ── */
        .ct-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: start;
        }

        /* ── SECTION TITLE ── */
        .ct-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: #2c1f13;
          margin-bottom: 40px;
          line-height: 1.3;
        }

        /* ── CONTACT CARDS ── */
        .ct-contact-card {
          padding: 28px;
          background: #fff;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #e0d5c7;
          transition: all 0.3s ease;
        }
        .ct-contact-card:hover {
          border-color: #a67853;
          box-shadow: 0 8px 24px rgba(139, 94, 60, 0.1);
          transform: translateY(-2px);
        }
        .ct-contact-card-icon {
          font-size: 1.4rem;
          color: #a67853;
          margin-right: 12px;
          margin-bottom: 12px;
          display: inline-block;
        }
        .ct-contact-card h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #2c1f13;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }
        .ct-contact-card p {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .ct-contact-card a {
          font-family: 'Montserrat', sans-serif;
          color: #a67853;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: color 0.3s;
          display: inline-block;
        }
        .ct-contact-card a:hover {
          color: #8b5e3c;
        }
        /* ── SOCIAL MEDIA SECTION ── */
        .ct-social-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e0d5c7;
        }
        .ct-social-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #a67853;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .ct-social-links {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ct-social-link {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #a67853;
          text-decoration: none;
          transition: all 0.3s ease;
          border-radius: 4px;
        }
        .ct-social-link:hover {
          color: #fff;
          background: #a67853;
          transform: translateY(-2px);
        }
        .ct-social-link i {
          font-size: 1.1rem;
        }

        /* ── CONTACT FORM ── */
        .ct-form {
          padding: 40px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e0d5c7;
        }
        .ct-form-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #2c1f13;
          margin-bottom: 28px;
        }
        .ct-form-group {
          margin-bottom: 24px;
        }
        .ct-form-label {
          display: block;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #2c1f13;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ct-form-input,
        .ct-form-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e0d5c7;
          border-radius: 4px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: #2c1f13;
          transition: all 0.3s ease;
          background: #fafaf9;
        }
        .ct-form-input::placeholder,
        .ct-form-textarea::placeholder {
          color: #c4a882;
        }
        .ct-form-input:focus,
        .ct-form-textarea:focus {
          outline: none;
          border-color: #a67853;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(166, 120, 83, 0.1);
        }
        .ct-form-textarea {
          resize: vertical;
          min-height: 140px;
        }
        .ct-form-submit {
          width: 100%;
          padding: 14px;
          background-color: #a67853;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ct-form-submit:hover {
          background-color: #8b5e3c;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(139, 94, 60, 0.25);
        }

        /* ── CTA BANNER ── */
        .ct-cta-section {
          text-align: center;
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .ct-cta-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #2c1f13;
          margin-bottom: 16px;
          line-height: 1.3;
        }
        .ct-cta-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          color: #666;
          margin-bottom: 32px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
        }
        .ct-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 12px 28px;
          background-color: #a67853;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .ct-cta-btn:hover {
          background-color: transparent;
          color: #a67853;
          border: 2px solid #a67853;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .ct-hero-title {
            font-size: 2.5rem;
          }
        }
        @media (max-width: 768px) {
          .ct-hero-title {
            font-size: 2rem;
          }
          .ct-hero-subtitle {
            font-size: 1rem;
          }
          .ct-section-title {
            font-size: 1.6rem;
          }
          .ct-form {
            padding: 28px;
          }
          .ct-cta-title {
            font-size: 1.5rem;
          }
        }
      `}</style>

      {/* ── CONTACT INFO + FORM ─────────────────────────────────────────── */}
      <section className="ct-section ct-section--dark">
        <div className="ct-intro">
          <h1 className="ct-intro-title">Get In Touch</h1>
          <p className="ct-intro-subtitle">We'd love to hear from you. Reach out with any questions or inquiries about our sauna solutions.</p>
        </div>
        <div className="ct-grid">
          {/* Left: Contact Info */}
          <div>
            <h2 className="ct-section-title">Contact Information</h2>

            <div className="ct-contact-card">
              <h3>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="ct-contact-card-icon" />
                Address
              </h3>
              <p>SAWO Corporation</p>
              <p>Bringing Finnish tradition to the world</p>
              <a href="https://www.sawo.com" target="_blank" rel="noopener noreferrer">
                Visit Website <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: "0.7rem", marginLeft: "4px" }} />
              </a>
            </div>

            <div className="ct-contact-card">
              <h3>
                <FontAwesomeIcon icon={faEnvelope} className="ct-contact-card-icon" />
                Email
              </h3>
              <p>For product inquiries, technical support, and general questions</p>
              <a href="mailto:info@sawo.com">info@sawo.com</a>
            </div>

            <div className="ct-contact-card">
              <h3>
                <FontAwesomeIcon icon={faPhone} className="ct-contact-card-icon" />
                Phone
              </h3>
              <p>Call us during business hours</p>
              <a href="tel:+358123456789">+358 (0) 1 234 56789</a>
            </div>

            <div className="ct-contact-card">
              <h3>
                <FontAwesomeIcon icon={faGlobe} className="ct-contact-card-icon" />
                Follow Us
              </h3>
              <p>Connect with SAWO on social media</p>
              <div className="ct-social-section">
                <div className="ct-social-links">
                  <a href="https://www.facebook.com/sawo" target="_blank" rel="noopener noreferrer" className="ct-social-link" title="Facebook">
                    <i className="fab fa-facebook-f" />
                  </a>
                  <a href="https://www.instagram.com/sawo" target="_blank" rel="noopener noreferrer" className="ct-social-link" title="Instagram">
                    <i className="fab fa-instagram" />
                  </a>
                  <a href="https://www.linkedin.com/company/sawo" target="_blank" rel="noopener noreferrer" className="ct-social-link" title="LinkedIn">
                    <i className="fab fa-linkedin-in" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="ct-form">
            <h3 className="ct-form-title">Send us a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="ct-form-group">
                <label htmlFor="name" className="ct-form-label">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="ct-form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="ct-form-group">
                <label htmlFor="email" className="ct-form-label">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="ct-form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="ct-form-group">
                <label htmlFor="phone" className="ct-form-label">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="ct-form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+358 (0) 1 234 56789"
                />
              </div>

              <div className="ct-form-group">
                <label htmlFor="subject" className="ct-form-label">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="ct-form-input"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                />
              </div>

              <div className="ct-form-group">
                <label htmlFor="message" className="ct-form-label">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  className="ct-form-textarea"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button type="submit" className="ct-form-submit">
                <i className="fas fa-paper-plane" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ─────────────────────────────────────────────────── */}
      <section className="ct-cta-section">
        <h2 className="ct-cta-title">Questions About Our Products?</h2>
        <p className="ct-cta-desc">
          Browse our product catalogues or speak with a specialist to find the perfect sauna solution for your needs.
        </p>
        <a href="/sauna-products" className="ct-cta-btn">
          Explore Products
          <FontAwesomeIcon icon={faChevronRight} />
        </a>
      </section>
    </div>
  );
};

export default Contact;
