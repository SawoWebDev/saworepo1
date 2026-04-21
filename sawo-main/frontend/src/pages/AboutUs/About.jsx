import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import aboutusHero from '../../assets/About/aboutus-hero.webp';
import aboutusEmployee from '../../assets/About/aboutus-employee.webp';
import ISO9001 from '../../assets/About/aboutus-ISO-9001.webp';
import ISO14001 from '../../assets/About/aboutus-ISO-14001.webp';
import SaunaSupport from '../../assets/About/aboutus-Sauna-Support_LOGO-EN-sininen.webp';
import LN1 from '../../assets/About/Latest News/LN1.webp';
import LN3 from '../../assets/About/Latest News/LN3.jpg';
import LN4 from '../../assets/About/Latest News/LN4.jpg';

const AboutUs = () => {
  return (
    <div className="relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap');

        /* ── HERO SECTION ── */
        .about-hero {
          min-height: 95vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }
        .about-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.3;
        }
        .about-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        .about-hero-content {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          width: 100%;
        }
        .about-hero-img-left {
          width: 100%;
          height: 400px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .about-hero-img-left img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .about-hero-text h1 {
          font-family: 'Montserrat', sans-serif;
          font-size: 3.5rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .about-hero-text p {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.3rem;
          color: #ccc;
          font-weight: 400;
          margin-bottom: 24px;
        }
        .about-hero-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          color: #bbb;
          line-height: 1.8;
          font-weight: 300;
        }

        /* ── MAIN SECTION ── */
        .about-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
        }
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 60px;
          align-items: flex-start;
        }
        .about-grid img {
          width: 100%;
          border-radius: 12px;
          box-shadow: 0 15px 40px rgba(139, 94, 60, 0.2);
        }
        .about-content {
          flex: 1;
        }
        .about-badges {
          display: flex;
          flex-direction: row;
          gap: 24px;
          position: sticky;
          top: 80px;
          align-items: flex-start;
        }

        /* ── INNOVATION SECTION ── */
        .innovation-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #d35444;
          margin-bottom: 30px;
          line-height: 1.3;
        }
        .about-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          color: #333;
          line-height: 1.8;
          font-weight: 400;
        }
        .about-text p {
          margin-bottom: 16px;
        }
        .about-text p:last-child {
          margin-bottom: 0;
        }

        /* ── CERTIFICATIONS ── */
        .certs-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cert-item {
          text-align: center;
          flex: 1;
          min-width: 120px;
        }
        .cert-item img {
          width: 100%;
          max-width: 160px;
          margin: 0 auto;
          object-fit: contain;
          height: auto;
          filter: none;
        }

        /* ── STATS SECTION ── */
        .about-stats {
          display: grid;
          grid-template-columns: auto auto;
          gap: 80px;
          margin-top: 60px;
          padding-top: 60px;
          border-top: 2px solid #ede5db;
        }
        .stat-item {
          text-align: left;
          white-space: nowrap;
        }
        .stat-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        }
        .stat-number {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #d35444;
          display: inline;
        }

        /* ── CTA BUTTON ── */
        .about-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 12px 28px;
          background-color: #AF8564;
          color: #fff;
          border: 4px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          margin-top: 20px;
          transition: all 0.3s ease;
        }
        .about-btn:hover {
          background-color: transparent;
          color: #AF8564;
          border-color: #AF8564;
        }

        /* ── LATEST NEWS SECTION ── */
        .news-section {
          background: #000;
          padding: 80px 20px;
          margin-top: 80px;
        }
        .news-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .news-title {
          text-align: center;
          font-family: 'Montserrat', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 4px;
          margin-bottom: 60px;
          position: relative;
        }
        .news-title::after {
          content: '';
          display: block;
          width: 80px;
          height: 3px;
          background: #AF8564;
          margin: 20px auto 0;
        }
        .news-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .news-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);
          transition: all 0.4s ease;
          display: flex;
          flex-direction: column;
        }
        .news-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .news-card-img {
          width: 100%;
          height: 220px;
          object-fit: cover;
        }
        .news-card-content {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .news-card-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #AF8564;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }
        .news-card-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: #141617;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .news-card-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: #666;
          line-height: 1.6;
          flex: 1;
          margin-bottom: 18px;
        }
        .news-card-link {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: #AF8564;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        .news-card-link:hover {
          color: #8b5e3c;
          gap: 12px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .about-hero-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .about-hero-text h1 {
            font-size: 2.5rem;
          }
          .about-grid {
            grid-template-columns: 1fr;
          }
          .about-badges {
            position: static;
          }
          .cert-item img {
            max-width: 120px;
          }
          .certs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .news-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .about-hero-text h1 {
            font-size: 2rem;
          }
          .about-hero-text p {
            font-size: 1rem;
          }
          .innovation-title {
            font-size: 1.8rem;
          }
          .about-stats {
            grid-template-columns: 1fr;
          }
          .stat-number {
            font-size: 2rem;
          }
          .certs-grid {
            grid-template-columns: 1fr;
          }
          .news-grid {
            grid-template-columns: 1fr;
          }
          .news-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

      {/* ════════════════════════════
           HERO SECTION
      ════════════════════════════ */}
      <section className="about-hero">
        <img src={aboutusHero} alt="SAWO office" className="about-hero-img" />
        <div className="about-hero-overlay" />
        <div className="about-hero-content">
          <div className="about-hero-img-left">
            <img src={aboutusEmployee} alt="SAWO team" />
          </div>
          <div className="about-hero-text">
            <h1>We are SAWO</h1>
            <p>Bringing Finnish tradition to the world</p>
            <p className="about-hero-desc">
              We are a customer-centric, excellence-driven company, consistently prioritizing the needs of our customers at every step—from product design to manufacturing to after-sales. We take pride in delivering only the finest products and the best service to our valued customers.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
           INNOVATION & TRADITION
      ════════════════════════════ */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-content">
            <h2 className="innovation-title">Innovation and tradition</h2>
            <div className="about-text">
              <p>
                We are a pioneering European sauna company with a manufacturing site in Asia – home to over 600 dedicated Filipino and Finnish professionals, and growing. Our success is built on a foundation of competitive pricing, exceptional product quality, and customer service that goes above and beyond.
              </p>
              <p>
                SAWO is a result from fusing the two words Sauna and World. It accurately reflects us as a comprehensive sauna provider. Meeting all your sauna needs, from heaters to door handles and louvers. Driven by a passion for sauna and guided by an innovative company culture, we have become one of the world's leading sauna product manufacturers, serving over 90 countries around the globe, and counting. Our offering ranges from sauna heaters, accessories, and control units to sauna rooms, steam generators, and infrared solutions.
              </p>
              <p>
                We continue to expand our portfolio with thoughtfully designed, high-performing products that exceed customer expectations worldwide. Every item is crafted under Finnish management, ensuring authenticity and a deep respect for the rich heritage of Finnish sauna culture.
              </p>
              <p>
                Our dedication to quality and sustainability is backed by internationally recognized certifications. We first obtained ISO 9001 for Quality Management in 2002 and ISO 14001 for Environmental Management in 2007, both of which were renewed in 2025 under the latest standards; ISO 9001:2015 and ISO 14001:2015. These certifications guarantee that every single product meets the highest global benchmarks for safety, quality, and environmental responsibility.
              </p>
              <p>
                As proud ambassadors of Finnish sauna culture, we are also a member of Sauna from Finland, an association dedicated to promoting the authentic Finnish sauna experience around the world.
              </p>

              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-label">Established excellence</div>
                  <div className="stat-number">30+ years</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Global reach</div>
                  <div className="stat-number">90+ countries worldwide</div>
                </div>
              </div>

              <a href="/sauna-products" className="about-btn">
                Explore Our Products
                <FontAwesomeIcon icon={faChevronRight} />
              </a>
            </div>
          </div>

          <div className="about-badges">
            <div className="cert-item">
              <img src={ISO9001} alt="ISO 9001" />
            </div>
            <div className="cert-item">
              <img src={ISO14001} alt="ISO 14001" />
            </div>
            <div className="cert-item">
              <img src={SaunaSupport} alt="Sauna from Finland" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
           LATEST NEWS
      ════════════════════════════ */}
      <section className="news-section">
        <div className="news-container">
          <h2 className="news-title">Latest News</h2>

          <div className="news-grid">
            {/* Card 1 */}
            <div className="news-card">
              <img
                src={LN1}
                alt="Recent Exhibitions"
                className="news-card-img"
              />
              <div className="news-card-content">
                <span className="news-card-label">Exhibitions</span>
                <h3 className="news-card-title">Recent Exhibitions</h3>
                <p className="news-card-desc">
                  This autumn, we took part in Europe's top wellness exhibitions—Aquanale in Cologne and Piscina Barcelona. A pleasure connecting with industry leaders and showcasing Finnish tradition and wellness.
                </p>
                <a href="/latest-news" className="news-card-link">
                  Read more <span>→</span>
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="news-card">
              <img
                src={LN4}
                alt="Earthquake Relief"
                className="news-card-img"
              />
              <div className="news-card-content">
                <span className="news-card-label">Community</span>
                <h3 className="news-card-title">Earthquake Relief in Cebu</h3>
                <p className="news-card-desc">
                  When a 6.9 magnitude earthquake struck off the Northeast coast of Cebu, our team organized a company-wide relief effort, delivering mattresses, food, hygiene products, and essentials to affected families.
                </p>
                <a href="/latest-news" className="news-card-link">
                  Read more <span>→</span>
                </a>
              </div>
            </div>

            {/* Card 3 */}
            <div className="news-card">
              <img
                src={LN3}
                alt="Talent Search"
                className="news-card-img"
              />
              <div className="news-card-content">
                <span className="news-card-label">Careers</span>
                <h3 className="news-card-title">Talent Search</h3>
                <p className="news-card-desc">
                  Time for a change? We are looking for individuals with experience and/or interest in the sauna and wellness industry and eagerness to grow with us in Cebu.
                </p>
                <a href="/careers" className="news-card-link">
                  Read more <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
