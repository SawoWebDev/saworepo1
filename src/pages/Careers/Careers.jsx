// Careers.jsx

import React, { useEffect } from "react";
import heroBg from "../../assets/Careers/Hero.webp";
import joinImg from "../../assets/Careers/Join-img.webp";
import heaterImg from "../../assets/Careers/Heater.webp";
import img1 from "../../assets/Careers/img1.webp";
import img2 from "../../assets/Careers/img2.webp";
import img3 from "../../assets/Careers/img3.webp";
import img4 from "../../assets/Careers/img4.webp";

const Careers = () => {
  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <div className="relative">
      {/* HERO */}
      <section
        className="min-h-[95vh] flex flex-col justify-center items-center text-center px-6 md:px-20 relative"
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
            lineHeight: "1.2",
            maxWidth: "600px",
          }}
        >
          Join the SAWO Team
        </h1>

        <p
          className="text-white mt-4 hero-subtitle"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: "1.5",
            maxWidth: "600px",
          }}
        >
          Build Your Future with a Global Leader in Sauna Manufacturing
        </p>

        {/* Mobile font adjustments */}
        <style jsx>{`
          @media (max-width: 768px) {
            .hero-title {
              font-size: 28px !important;
            }
            .hero-subtitle {
              font-size: 16px !important;
            }
          }
        `}</style>
      </section>

      {/* Section 1: Join SAWO - Two Column Layout */}
      <section className="join-section py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Column - Image */}
            <div className="join-image-wrapper">
              <img
                src={joinImg}
                alt="Join SAWO Team"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Right Column - Text Content */}
            <div className="join-content">
              <p
                className="join-highlight mb-4"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1rem",
                  color: "#D32F2F",
                  fontWeight: 600,
                  lineHeight: "1.6",
                }}
              >
                We are looking for individuals with prior experience in the
                sauna industry.
              </p>
              <p
                className="join-description mb-4"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1rem",
                  color: "#333",
                  lineHeight: "1.8",
                }}
              >
                SAWO is a trusted name in sauna manufacturing, blending Finnish
                expertise with skilled craftsmanship based in Cebu, the
                Philippines. Our team takes pride in producing high-quality
                sauna heaters, accessories, and complete sauna solutions for the
                global market.
              </p>
              <p
                className="join-cta"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1rem",
                  color: "#333",
                  lineHeight: "1.8",
                }}
              >
                Do you want to work in the tropics? Join us and be part of an
                industry leader in sauna innovation!
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 768px) {
            .join-section .grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* Section 2: Two Column - Open Positions & We Are Hiring */}
      <section className="careers-main-section py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* LEFT COLUMN - Open Positions */}
            <div className="open-positions-column">
              <h2
                className="mb-6"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#000",
                }}
              >
                Open Positions
              </h2>
              <p
                className="mb-8"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "0.95rem",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                Explore exciting job openings in various departments:
              </p>

              <div className="positions-list space-y-4">
                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>Electrical Engineer</h3>
                    <p>
                      Cebu / <span className="badge-fulltime">Full-Time</span> /{" "}
                      <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>Production Supervisor, Woodworking</h3>
                    <p>
                      Pampanga/Cebu /{" "}
                      <span className="badge-fulltime">Full-Time</span> /{" "}
                      <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>Marketing Specialist</h3>
                    <p>
                      Pampanga/Cebu /{" "}
                      <span className="badge-fulltime">Full-Time</span> /{" "}
                      <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>Buyer / Logistics Specialist</h3>
                    <p>
                      Cebu / Logistics/Cebu /{" "}
                      <span className="badge-fulltime">Full-Time</span> /{" "}
                      <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>Process Engineer</h3>
                    <p>
                      Pampanga/Cebu /{" "}
                      <span className="badge-fulltime">Full-Time</span> /{" "}
                      <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>International Sales Manager</h3>
                    <p>
                      Pampanga/Myyrmäkkialue / Cebu /{" "}
                      <span className="badge-fulltime">Full-Time</span> /{" "}
                      <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>

                <div className="position-item">
                  <div className="position-icon-wrapper">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="position-info">
                    <h3>Odoo Software Developer</h3>
                    <p>
                      Cebu /{" "}
                      <span className="badge-fulltime">Full-Time(hybriid)</span>{" "}
                      / Cebu / <span className="badge-fulltime">Full-Time</span>{" "}
                      / <span className="badge-onsite">On-Site</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - We Are Hiring */}
            <div className="hiring-column">
              <div className="hiring-box sticky-hiring-box">
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "#000",
                  }}
                >
                  We Are <span style={{ color: "#D32F2F" }}>Hiring!</span>
                </h2>
                <p
                  className="mb-6"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "0.95rem",
                    color: "#333",
                    lineHeight: "1.6",
                  }}
                >
                  Be an industry leader that blends Finnish expertise with
                  world-class craftsmanship.
                </p>

                <div className="hiring-details mb-6">
                  <div className="hiring-detail-item">
                    <i className="fas fa-circle" style={{ fontSize: "6px" }}></i>
                    <span>
                      Send your resume to:{" "}
                      <strong style={{ color: "#D32F2F" }}>
                        reply@sawo.com
                      </strong>
                    </span>
                  </div>
                  <div className="hiring-detail-item">
                    <i className="fas fa-circle" style={{ fontSize: "6px" }}></i>
                    <span>
                      Location: SAWO Manufacturing, MEE2, Cebu, Philippines
                    </span>
                  </div>
                </div>

                <p
                  className="mb-8"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "1rem",
                    color: "#333",
                    fontWeight: 600,
                  }}
                >
                  Let's build something great together!
                </p>

                {/* Category Images Grid */}
                <div className="hiring-categories grid grid-cols-2 gap-4">
                  <div className="category-card">
                    <img src={img1} alt="Manufacturing & Production" />
                    <div className="category-overlay">
                      <h3>Manufacturing & Production</h3>
                    </div>
                  </div>
                  <div className="category-card">
                    <img src={img2} alt="Engineering & Design" />
                    <div className="category-overlay">
                      <h3>Engineering & Design</h3>
                    </div>
                  </div>
                  <div className="category-card">
                    <img src={img3} alt="Sales & Marketing" />
                    <div className="category-overlay">
                      <h3>Sales & Marketing</h3>
                    </div>
                  </div>
                  <div className="category-card">
                    <img src={img4} alt="Operations & Support" />
                    <div className="category-overlay">
                      <h3>Operations & Support</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx>{`
          .position-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .position-icon-wrapper {
            width: 40px;
            height: 40px;
            background: #e8e8e8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .position-icon-wrapper i {
            font-size: 1.5rem;
            color: #999;
          }
          .position-info h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: #000;
            margin-bottom: 4px;
          }
          .position-info p {
            font-family: "Montserrat", sans-serif;
            font-size: 0.85rem;
            color: #666;
            margin: 0;
          }
          .badge-fulltime,
          .badge-onsite {
            font-weight: 500;
          }
          .hiring-box {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 30px;
          }
          .sticky-hiring-box {
            position: sticky;
            top: 20px;
          }
          .hiring-detail-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            font-family: "Montserrat", sans-serif;
            font-size: 0.95rem;
            color: #333;
            line-height: 1.6;
          }
          .hiring-detail-item i {
            margin-top: 8px;
            color: #666;
          }
          .category-card {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            height: 140px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .category-card:hover {
            transform: scale(1.03);
          }
          .category-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .category-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.6);
            padding: 12px;
          }
          .category-overlay h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            color: white;
            margin: 0;
            text-align: center;
          }
          @media (max-width: 768px) {
            .careers-main-section .grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* Section 3: Why Work for SAWO - Full Width */}
      <section className="why-sawo-section py-20 px-6 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          {/* Image First */}
          <div className="why-image-wrapper mb-12 rounded-lg overflow-hidden shadow-lg">
            <img
              src={heaterImg}
              alt="SAWO Manufacturing"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Title */}
          <h2
            className="mb-12 text-center"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "#000",
            }}
          >
            Why Work for <span style={{ color: "#A67853" }}>SAWO</span>?
          </h2>

          {/* Benefits Cards */}
          <div className="why-benefits-list space-y-6">
            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-lightbulb"></i>
              </div>
              <div className="why-content">
                <h3>Innovative & Customer-Centric</h3>
                <p>
                  Be part of a company that values{" "}
                  <strong>quality, innovation, and customer satisfaction.</strong>
                </p>
              </div>
            </div>

            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-globe"></i>
              </div>
              <div className="why-content">
                <h3>International Exposure</h3>
                <p>
                  Work with a diverse team of{" "}
                  <strong>Finnish and Filipino professionals</strong>{" "}
                  collaborating across global markets.
                </p>
              </div>
            </div>

            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="why-content">
                <h3>Career Growth & Development</h3>
                <p>
                  We invest in our employees through{" "}
                  <strong>
                    training, skill development, and career advancement
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="why-benefit-card">
              <div className="why-icon-circle">
                <i className="fas fa-award"></i>
              </div>
              <div className="why-content">
                <h3>Commitment To Excellence</h3>
                <p>
                  SAWO is{" "}
                  <strong>ISO 9001 & ISO 14001 certified</strong>, ensuring a
                  workplace focused on quality and sustainability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx>{`
          .why-benefit-card {
            background: white;
            border-left: 4px solid #a67853;
            border-radius: 8px;
            padding: 25px;
            display: flex;
            align-items: flex-start;
            gap: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
          }
          .why-benefit-card:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }
          .why-icon-circle {
            width: 50px;
            height: 50px;
            background: #000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .why-icon-circle i {
            font-size: 1.3rem;
            color: white;
          }
          .why-content h3 {
            font-family: "Montserrat", sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            color: #000;
            margin-bottom: 8px;
          }
          .why-content p {
            font-family: "Montserrat", sans-serif;
            font-size: 0.95rem;
            color: #666;
            line-height: 1.6;
            margin: 0;
          }
          @media (max-width: 768px) {
            .why-benefit-card {
              flex-direction: column;
              text-align: center;
              align-items: center;
            }
          }
        `}</style>
      </section>

      {/* Styles required for leaves */}
      <style>{`
      `}</style>
    </div>
  );
};

export default Careers;