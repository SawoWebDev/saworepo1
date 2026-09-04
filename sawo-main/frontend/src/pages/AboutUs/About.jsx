import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChevronRight from '../../components/icons/ChevronRight';
import menuPaths from '../../menuPaths';
import aboutusHero from '../../assets/About/aboutus-hero.webp';
import aboutusEmployee from '../../assets/About/aboutus-employee.webp';
import ISO9001 from '../../assets/About/aboutus-ISO-9001.webp';
import ISO14001 from '../../assets/About/aboutus-ISO-14001.webp';
import SaunaSupport from '../../assets/About/aboutus-Sauna-Support_LOGO-EN-sininen.webp';
import PEFC from '../../assets/About/aboutus-PEFC.png';
import LN1 from '../../assets/About/Latest News/LN1.webp';
import LN3 from '../../assets/About/Latest News/LN3.webp';
import LN4 from '../../assets/About/Latest News/LN4.webp';
import newsBg from '../../assets/Contacts-bg.webp';
import HeroWave from '../../components/HeroWave';
import SEO from '../../components/SEO';
import BrochureDropdownButton from '../../components/Buttons/BrochureDropdownButton';
import { useLocaleT, useLocalizedPath } from '../../i18n/LocaleContext';

const AboutUs = () => {
  const certRef = useRef(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const t = useLocaleT("about");
  const localize = useLocalizedPath();

  // Staggered "gleam" sweep across the ISO/Sauna-from-Finland badges once
  // they scroll into view — ported from the reference vanilla-JS snippet,
  // scoped to this component's container instead of a global querySelector.
  useEffect(() => {
    const container = certRef.current;
    if (!container) return undefined;

    const items = container.querySelectorAll('.certification-item');
    const gleamDuration = 1200;
    const stagger = 420;

    const runOnce = () => {
      items.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('gleam-active');
          setTimeout(() => item.classList.remove('gleam-active'), gleamDuration);
        }, index * stagger);
      });
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runOnce();
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path={localize("/about")}
        hreflangAlternates={{ en: "/about", zh: "/zh/about" }}
      />
      <style>{`

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
          justify-content: center;
          position: sticky;
          top: 80px;
        }

        /* ── CERTIFICATION RIBBON (ISO 9001 / ISO 14001 / Sauna from Finland) ── */
        .cert-ribbon {
          position: relative;
          background: linear-gradient(135deg, #346096 0%, #042349 100%);
          border-radius: 18px;
          box-shadow: 0 25px 60px rgba(4, 35, 73, 0.45);
        }
        .certifications-container-portrait {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 36px 32px;
        }
        .cert-link {
          display: block;
          width: 100%;
          max-width: 240px;
          text-decoration: none;
          color: inherit;
        }
        .certification-item {
          width: 100%;
          height: 230px;
          padding: 12px 16px;
          text-align: center;
          position: relative;
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          overflow: hidden;
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .certification-item:hover {
          transform: scale(1.03);
        }
        .cert-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 8px;
          position: relative;
          z-index: 1;
        }
        .cert-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 0;
          box-shadow: none;
        }
        .cert-caption {
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.85);
        }
        .cert-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
        }
        .cert-gleam {
          position: absolute;
          top: 0;
          left: -75%;
          width: 50%;
          height: 100%;
          background: linear-gradient(120deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0));
          transform: skewX(-20deg);
          pointer-events: none;
        }
        .certification-item.gleam-active .cert-gleam,
        .certification-item:hover .cert-gleam {
          animation: gleamMove 1.2s ease forwards;
        }
        @keyframes gleamMove {
          from { left: -75%; }
          to { left: 125%; }
        }

        /* ── INNOVATION SECTION ── */
        .innovation-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 30px;
          line-height: 1.3;
        }
        .innovation-title-main {
          display: block;
          color: #000;
        }
        .innovation-title-sub {
          display: block;
          color: #D32F2F;
          font-size: 0.72em;
          margin-top: 6px;
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
          display: inline;
        }
        .stat-number-value {
          color: #D32F2F;
        }
        .stat-number-suffix {
          color: #000;
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
          position: relative;
          background: #000 url(${newsBg}) center / cover no-repeat;
          padding: 80px 20px;
          margin-top: 80px;
        }
        .news-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
        }
        .news-container {
          position: relative;
          z-index: 1;
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
          .stat-item {
            white-space: normal;
          }
          .about-stats {
            gap: 32px;
          }
        }
        @media (max-width: 400px) {
          .certifications-container-portrait {
            padding: 28px 16px;
          }
          .stat-number {
            font-size: 1.6rem;
          }
        }
      `}</style>

      {/* ════════════════════════════
           HERO SECTION
      ════════════════════════════ */}
      <section className="about-hero">
        <img
          src={aboutusHero}
          alt={t("alt.office")}
          className="about-hero-img"
          onLoad={() => setHeroLoaded(true)}
          onError={() => setHeroLoaded(true)}
          style={{ opacity: heroLoaded ? 0.3 : 0, transition: "opacity 0.6s ease" }}
        />
        <div className="about-hero-overlay" />
        <div className="about-hero-content">
          <div className="about-hero-img-left">
            <img src={aboutusEmployee} alt={t("alt.team")} />
          </div>
          <div className="about-hero-text">
            <h1>{t("hero.title")}</h1>
            <p>{t("hero.subtitle")}</p>
            <p className="about-hero-desc">
              {t("hero.desc")}
            </p>
          </div>
        </div>
        <HeroWave />
      </section>

      {/* ════════════════════════════
           INNOVATION & TRADITION
      ════════════════════════════ */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-content">
            <h2 className="innovation-title">
              <span className="innovation-title-main">{t("innovation.titleMain")}</span>
              <span className="innovation-title-sub">{t("innovation.titleSub")}</span>
            </h2>
            <div className="about-text">
              <p dangerouslySetInnerHTML={{ __html: t("innovation.p1") }} />
              <p dangerouslySetInnerHTML={{ __html: t("innovation.p2") }} />
              <p dangerouslySetInnerHTML={{ __html: t("innovation.p3") }} />
              <p dangerouslySetInnerHTML={{ __html: t("innovation.p4") }} />
              <p dangerouslySetInnerHTML={{ __html: t("innovation.p5") }} />

              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-label">{t("innovation.stats.establishedLabel")}</div>
                  <div className="stat-number">
                    <span className="stat-number-value">{t("innovation.stats.establishedValue")}</span>{" "}
                    <span className="stat-number-suffix">{t("innovation.stats.establishedSuffix")}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t("innovation.stats.reachLabel")}</div>
                  <div className="stat-number">
                    <span className="stat-number-value">{t("innovation.stats.reachValue")}</span>{" "}
                    <span className="stat-number-suffix">{t("innovation.stats.reachSuffix")}</span>
                  </div>
                </div>
              </div>

              <Link to={localize(menuPaths.sauna.parent)} className="about-btn">
                {t("innovation.exploreBtn")}
                <ChevronRight />
              </Link>
            </div>
          </div>

          <div className="about-badges">
            <div className="cert-ribbon">
              <div className="certifications-container-portrait" ref={certRef}>
                <a className="cert-link" href="https://www.iso.org/standard/62085.html" target="_blank" rel="noopener noreferrer">
                  <div className="certification-item">
                    <div className="cert-icon">
                      <img src={ISO9001} alt="ISO 9001" />
                    </div>
                    <div className="cert-caption">{t("certs.iso9001.caption")}</div>
                    <div className="cert-label">{t("certs.iso9001.label")}</div>
                    <div className="cert-gleam" />
                  </div>
                </a>

                <a className="cert-link" href="https://www.iso.org/standard/60857.html" target="_blank" rel="noopener noreferrer">
                  <div className="certification-item">
                    <div className="cert-icon">
                      <img src={ISO14001} alt="ISO 14001" />
                    </div>
                    <div className="cert-caption">{t("certs.iso14001.caption")}</div>
                    <div className="cert-label">{t("certs.iso14001.label")}</div>
                    <div className="cert-gleam" />
                  </div>
                </a>

                <a className="cert-link" href="https://saunafromfinland.com/" target="_blank" rel="noopener noreferrer">
                  <div className="certification-item">
                    <div className="cert-icon">
                      <img src={SaunaSupport} alt="Sauna from Finland" />
                    </div>
                    <div className="cert-caption">{t("certs.saunaFromFinland.caption")}</div>
                    <div className="cert-label">{t("certs.saunaFromFinland.label")}</div>
                    <div className="cert-gleam" />
                  </div>
                </a>

                <a className="cert-link" href="https://www.pefc.org/" target="_blank" rel="noopener noreferrer">
                  <div className="certification-item">
                    <div className="cert-icon">
                      <img src={PEFC} alt="PEFC / 01-31-1332" />
                    </div>
                    <div className="cert-caption">{t("certs.pefc.caption")}</div>
                    <div className="cert-label">{t("certs.pefc.label")}</div>
                    <div className="cert-gleam" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
           LATEST NEWS
      ════════════════════════════ */}
      <section className="news-section">
        <div className="news-container">
          <h2 className="news-title">{t("news.title")}</h2>

          <div className="news-grid">
            {/* Card 1 */}
            <div className="news-card">
              <img
                src={LN1}
                alt={t("news.card1.alt")}
                className="news-card-img"
              />
              <div className="news-card-content">
                <span className="news-card-label">{t("news.card1.label")}</span>
                <h3 className="news-card-title">{t("news.card1.title")}</h3>
                <p className="news-card-desc">
                  {t("news.card1.desc")}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="news-card">
              <img
                src={LN4}
                alt={t("news.card2.alt")}
                className="news-card-img"
              />
              <div className="news-card-content">
                <span className="news-card-label">{t("news.card2.label")}</span>
                <h3 className="news-card-title">{t("news.card2.title")}</h3>
                <p className="news-card-desc">
                  {t("news.card2.desc")}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="news-card">
              <img
                src={LN3}
                alt={t("news.card3.alt")}
                className="news-card-img"
              />
              <div className="news-card-content">
                <span className="news-card-label">{t("news.card3.label")}</span>
                <h3 className="news-card-title">{t("news.card3.title")}</h3>
                <p className="news-card-desc">
                  {t("news.card3.desc")}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "48px" }}>
            <BrochureDropdownButton
              text={t("news.seeMore")}
              href={localize(menuPaths.about.news)}
              redirect
            />
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
