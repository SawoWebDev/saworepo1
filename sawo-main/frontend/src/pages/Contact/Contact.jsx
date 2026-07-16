import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import heroBg from "../../assets/About/Sustainability-hero.webp";
import menuPaths from "../../menuPaths";

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

        /* HERO SECTION */
        .ct-hero {
          min-h-60vh flex flex-col justify-center items-center text-center px-6 relative;
          background-image: url('${heroBg}');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ct-hero h1 {
          color: white;
          font-family: Montserrat, sans-serif;
          font-size: 38px;
          line-height: 42px;
          font-weight: 700;
          margin: 0;
        }
        .ct-hero p {
          color: white;
          font-family: Montserrat, sans-serif;
          font-weight: 400;
          font-size: 18px;
          line-height: 28px;
          margin-top: 12px;
          margin-bottom: 0;
        }

        /* MAIN SECTION */
        .ct-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 50px 30px;
        }

        /* INTRO */
        .ct-intro {
          text-align: center;
          margin-bottom: 50px;
        }
        .ct-intro-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .ct-intro-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          color: #000;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
          font-weight: 300;
        }

        /* CONTACT GRID */
        .ct-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 50px;
          align-items: start;
        }

        /* CONTACT CARDS GRID */
        .ct-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-bottom: 50px;
        }

        /* OFFICES GRID */
        .ct-offices-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
        }

        /* SECTION TITLE */
        .ct-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 30px;
          line-height: 1.3;
        }

        /* CONTACT CARDS */
        .ct-contact-card {
          padding: 25px 22px;
          background: #ffffff;
          border-radius: 14px;
          margin-bottom: 20px;
          border-left: 4px solid #a67853;
          box-shadow: 0 8px 20px rgba(139, 94, 60, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .ct-contact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(139, 94, 60, 0.15);
        }
        .ct-contact-card-icon {
          font-size: 1.4rem;
          background: linear-gradient(135deg, #a67853 0%, #c4a574 100%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          margin-bottom: 14px;
          box-shadow: 0 4px 12px rgba(166, 120, 83, 0.25);
          transition: all 0.3s ease;
        }
        .ct-contact-card:hover .ct-contact-card-icon {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(166, 120, 83, 0.35);
        }
        .ct-contact-card h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a67853 0%, #8b5e3c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
          margin-top: 0;
          letter-spacing: 0.2px;
        }
        .ct-contact-card p {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: #000;
          margin-bottom: 6px;
          margin-top: 0;
          line-height: 1.5;
          font-weight: 300;
        }
        .ct-contact-card a {
          font-family: 'Montserrat', sans-serif;
          color: #a67853;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
          transition: color 0.3s;
        }
        .ct-contact-card a:hover {
          color: #8b5e3c;
        }

        /* SOCIAL SECTION */
        .ct-social-section {
          margin-top: 25px;
          padding-top: 25px;
          border-top: 1px solid #e0d5c7;
        }
        .ct-social-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ct-social-link {
          width: 45px;
          height: 45px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
          transition: all 0.3s ease;
          border-radius: 50%;
          background: linear-gradient(135deg, #a67853 0%, #8b5e3c 100%);
          box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2);
        }
        .ct-social-link:hover {
          transform: translateY(-4px) scale(1.1);
          box-shadow: 0 8px 25px rgba(139, 94, 60, 0.3);
        }
        .ct-social-link i {
          font-size: 1.1rem;
        }

        /* CONTACT FORM */
        .ct-form {
          padding: 35px 30px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 8px 20px rgba(139, 94, 60, 0.1);
          border-left: 4px solid #a67853;
          transition: all 0.3s ease;
        }
        .ct-form:hover {
          box-shadow: 0 12px 35px rgba(139, 94, 60, 0.15);
        }
        .ct-form-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 25px;
          margin-top: 0;
          letter-spacing: 0.3px;
        }
        .ct-form-group {
          margin-bottom: 18px;
        }
        .ct-form-label {
          display: block;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #8b5e3c;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .ct-form-input,
        .ct-form-textarea {
          width: 100%;
          padding: 11px 13px;
          border: 1.5px solid #e0d5c7;
          border-radius: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: #000;
          transition: all 0.3s ease;
          background: #fafaf9;
          box-sizing: border-box;
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
          min-height: 120px;
        }
        .ct-form-submit {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 15px rgba(139, 94, 60, 0.25);
        }
        .ct-form-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 94, 60, 0.35);
        }

        /* CTA SECTION */
        .ct-cta-section {
          max-width: 950px;
          margin: 0 auto;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          border-radius: 16px;
          padding: 40px 35px;
          text-align: center;
          box-shadow: 0 12px 40px rgba(139, 94, 60, 0.25);
          transition: all 0.3s ease;
        }
        .ct-cta-section:hover {
          box-shadow: 0 16px 50px rgba(139, 94, 60, 0.35);
          transform: translateY(-3px);
        }
        .ct-cta-icon {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          transition: all 0.3s ease;
        }
        .ct-cta-section:hover .ct-cta-icon {
          transform: scale(1.1);
        }
        .ct-cta-icon i {
          font-size: 1.7rem;
          color: #a67853;
        }
        .ct-cta-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
          margin-top: 0;
          line-height: 1.3;
        }
        .ct-cta-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          color: #ffffff;
          margin-bottom: 22px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
          font-weight: 300;
        }
        .ct-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          padding: 10px 26px;
          background: #ffffff;
          color: #a67853;
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
          line-height: 1;
          box-sizing: border-box;
        }
        .ct-cta-btn:hover {
          background: transparent;
          color: #ffffff;
          border: 2px solid #ffffff;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .ct-hero {
            min-height: 50vh;
            padding: 40px 20px;
          }
          .ct-hero h1 {
            font-size: 24px;
            line-height: 28px;
          }
          .ct-hero p {
            font-size: 14px;
            line-height: 22px;
            margin-top: 8px;
          }
          .ct-section {
            padding: 40px 20px;
          }
          .ct-intro-title {
            font-size: 1.8rem;
            margin-bottom: 10px;
          }
          .ct-intro-subtitle {
            font-size: 0.95rem;
          }
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }
          .ct-cards-grid {
            grid-template-columns: 1fr;
            gap: 25px;
            margin-bottom: 35px;
          }
          .ct-offices-grid {
            grid-template-columns: 1fr;
            gap: 25px;
          }
          .ct-section-title {
            font-size: 1.3rem;
            margin-bottom: 25px;
          }
          .ct-contact-card {
            padding: 18px 16px;
            margin-bottom: 15px;
            border-left-width: 3px;
          }
          .ct-contact-card h3 {
            font-size: 1rem;
            margin-bottom: 8px;
          }
          .ct-contact-card p {
            font-size: 0.85rem;
            margin-bottom: 5px;
          }
          .ct-contact-card-icon {
            width: 45px;
            height: 45px;
            margin-bottom: 10px;
            font-size: 1.2rem;
          }
          .ct-form {
            padding: 25px 20px;
          }
          .ct-form-title {
            font-size: 1.2rem;
            margin-bottom: 20px;
          }
          .ct-form-group {
            margin-bottom: 14px;
          }
          .ct-form-input,
          .ct-form-textarea {
            padding: 10px 12px;
            font-size: 0.85rem;
          }
          .ct-form-textarea {
            min-height: 100px;
          }
          .ct-form-submit {
            padding: 10px;
            font-size: 0.8rem;
          }
          .ct-cta-section {
            padding: 28px 22px;
            margin: 0 15px;
            border-radius: 12px;
          }
          .ct-cta-icon {
            width: 55px;
            height: 55px;
            margin: 0 auto 15px;
            font-size: 1.4rem;
          }
          .ct-cta-title {
            font-size: 1.3rem;
            margin-bottom: 10px;
          }
          .ct-cta-desc {
            font-size: 0.9rem;
            margin-bottom: 18px;
          }
          .ct-cta-btn {
            font-size: 0.75rem;
            padding: 8px 20px;
          }
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="ct-hero">
        <div>
          <h1>Get In Touch</h1>
          <p>We're here to help. Connect with our team.</p>
        </div>
      </section>

      {/* CONTACT INFO + FORM */}
      <section className="ct-section">
        <div className="ct-intro">
          <h2 className="ct-intro-title">We'd Love to Hear From You</h2>
          <p className="ct-intro-subtitle">Have questions about our saunas or sustainability initiatives? Reach out and our team will be happy to assist you.</p>
        </div>
        {/* Contact Form Section */}
        <div className="ct-grid">
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

        {/* Technical Support Card */}
        <div style={{ marginTop: "50px" }}>
          <div className="ct-contact-card">
            <h3>TECHNICAL SUPPORT</h3>
            <p>For technical support and reclamations, please contact:</p>
            <p style={{ marginBottom: "12px", marginTop: "12px" }}>
              <strong>Whatsapp:</strong> <a href="https://wa.me/63949759450" target="_blank" rel="noopener noreferrer">+63 949 759 4450</a>
            </p>
            <a href="mailto:help@sawo.com">help@sawo.com</a>
          </div>
        </div>

        {/* Offices Section */}
        <div style={{ marginTop: "50px" }}>
          <h2 className="ct-section-title" style={{ marginBottom: "30px", textAlign: "center" }}>OFFICES</h2>
          <div className="ct-offices-grid">
            {/* Office 1 */}
            <div className="ct-contact-card">
              <h3 style={{ fontSize: "0.95rem", marginBottom: "15px" }}>GLOBAL SALES & GENERAL INQUIRIES</h3>
              <p style={{ marginBottom: "6px", fontWeight: "600" }}>SAWO Inc.</p>
              <a href="https://www.google.com/maps/place/SAWO+Inc./@10.2908545,123.9474748,20678m/data=!3m1!1e3!4m6!3m5!1s0x33a999f9aaaaaaab:0x638e93b7abe9d209!8m2!3d10.3065109!4d123.9662661!16s%2Fg%2F11xbg6w1q?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: "12px", marginTop: "6px", color: "#000", fontWeight: "300" }}>Mactan Economic Zone 2, Mactan,<br/>Cebu 6015, Philippines</a>
              <p style={{ marginBottom: "6px" }}><a href="tel:+63323412233">Tel: +63 32 341 2233</a></p>
              <a href="mailto:info@sawo.com">info@sawo.com</a>
            </div>

            {/* Office 2 */}
            <div className="ct-contact-card">
              <h3 style={{ fontSize: "0.95rem", marginBottom: "15px" }}>SALES & WAREHOUSE FOR THE NORDICS</h3>
              <p style={{ marginBottom: "6px", fontWeight: "600" }}>SAWO Nordic Oy.</p>
              <a href="https://www.google.com/maps/place/Sawo+Nordic+Oy/@61.4682459,23.8889861,40152m/data=!3m1!1e3!4m6!3m5!1s0x468f1ff184c90c83:0xe1681d5d0909096b!8m2!3d61.4996934!4d23.7501876!16s%2Fg%2F1q675ymsx?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: "12px", marginTop: "6px", color: "#000", fontWeight: "300" }}>Hampuntie 18, 36220 Kangasala,<br/>Finland</a>
              <p style={{ marginBottom: "6px" }}><a href="tel:+358400383265">Tel: +358 40 038 3265</a></p>
              <a href="mailto:finland@sawo.com">finland@sawo.com</a>
            </div>

            {/* Office 3 */}
            <div className="ct-contact-card">
              <h3 style={{ fontSize: "0.95rem", marginBottom: "15px" }}>SALES & WAREHOUSE FOR ASIA</h3>
              <p style={{ marginBottom: "6px", fontWeight: "600" }}>F.E.M. Ltd</p>
              <a href="https://www.google.com/maps/place/Cable+T+V+Tower,+9+Hoi+Shing+Rd,+Chai+Wan+Kok,+Hong+Kong/@22.3720256,114.1051012,1215m/data=!3m1!1e3!4m6!3m5!1s0x3403f8e56f3381c9:0xbdbb69dc3fa013e4!8m2!3d22.3727747!4d114.1073972!16s%2Fg%2F12j799c55?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: "12px", marginTop: "6px", color: "#000", fontWeight: "300" }}>2302, 23rd Floor, Cable TV Tower 9<br/>Hoi Shing Road, Tsuen Wan, Hong Kong</a>
              <p style={{ marginBottom: "6px" }}><a href="tel:+85224171188">Tel: +852 2417 1188</a></p>
              <a href="mailto:hongkong@sawo.com">hongkong@sawo.com</a>
            </div>

            {/* Office 4 */}
            <div className="ct-contact-card">
              <h3 style={{ fontSize: "0.95rem", marginBottom: "15px" }}>SALES & WAREHOUSE FOR EUROPE</h3>
              <p style={{ marginBottom: "6px", fontWeight: "600" }}>SAWO EUROPE HUB</p>
              <a href="https://www.google.com/maps/place/SAWO+Sauna+Europe+B.V./@51.347626,5.4851098,820m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47c6d7006fe0a9bb:0x95ddf180c98d0533!8m2!3d51.347626!4d5.4876847!16s%2Fg%2F11nbg5c2pp?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: "12px", marginTop: "6px", color: "#000", fontWeight: "300" }}>De Vest 24, 5555 XL Valkenswaard<br/>Netherlands</a>
              <p style={{ marginBottom: "6px" }}><a href="tel:+358400168269">Tel: +358 40 016 8269</a></p>
              <a href="mailto:europehub@sawo.com">europehub@sawo.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: "25px 30px 50px 30px", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="ct-cta-section">
          <div className="ct-cta-icon">
            <i className="fas fa-spa"></i>
          </div>
          <h2 className="ct-cta-title">Explore Our Sauna Solutions</h2>
          <p className="ct-cta-desc">
            Discover our range of sustainable, energy-efficient saunas designed to enhance your wellness journey while respecting the environment.
          </p>
          <Link to={menuPaths.products} className="ct-cta-btn">
            View Products
            <FontAwesomeIcon icon={faChevronRight} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Contact;
