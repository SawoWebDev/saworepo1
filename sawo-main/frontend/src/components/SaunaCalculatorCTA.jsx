import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../menuPaths";

// Sauna calculator CTA — replaced the "Find Your Dream Sauna" autoplaying
// configurator video that used to close out SaunaRoomViewer. Same heading,
// but it now points at a tool the visitor can actually use rather than a
// looping clip.
//
// Shared rather than pasted per page: /sauna/rooms and /infrared/room both
// render it, and the wellness carousel earlier in this project is the
// cautionary tale for what copy-per-page costs.
//
// The calculator link is internal (menuPaths.support.saunaCalculator), not
// the www.sawo.com URL from the original markup — that URL leaves this site
// for the old WordPress build, which is the thing being replaced.
const SaunaCalculatorCTA = ({
  title = "Find Your Dream Sauna",
  subtitle = "Enter your sauna room dimensions, width, height, and depth, and our calculator will instantly calculate your sauna volume and recommend the right heater power in kW.",
  buttonLabel = "Sauna Calculator",
  href = menuPaths.support.saunaCalculator,
  image = "https://www.sawo.com/wp-content/uploads/2026/05/CUB3-Ni2_InsideSaunaRoom-sauna-calculator.webp",
  imageAlt = "Inside a SAWO sauna room",
}) => (
  <div className="sawo-cta-section">
    <div className="sawo-cta-inner">
      <div className="sawo-cta-left">
        <div className="sawo-title">{title}</div>
        <div className="sawo-subtitle">{subtitle}</div>
        <Link className="sawo-cta-btn" to={href}>
          {buttonLabel}
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ verticalAlign: "middle", marginLeft: 6 }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
      <div className="sawo-cta-right">
        <img src={image} alt={imageAlt} loading="lazy" decoding="async" />
      </div>
    </div>

    <style jsx>{`
      .sawo-cta-section {
        background-color: #af8564;
        font-family: 'Montserrat', sans-serif;
      }
      .sawo-cta-inner {
        display: grid;
        grid-template-columns: 1fr 1fr;
        min-height: 340px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .sawo-cta-left {
        padding: 48px 52px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .sawo-cta-left .sawo-title {
        font-family: "Montserrat", sans-serif;
        font-size: 36px;
        font-weight: 400;
        color: #fff;
        margin-bottom: 16px;
        line-height: 1.2;
      }
      .sawo-cta-left .sawo-subtitle {
        font-size: 15px;
        color: rgba(255, 255, 255, 0.82);
        margin-bottom: 32px;
        line-height: 1.7;
      }
      .sawo-cta-btn {
        display: inline-block;
        align-self: flex-start;
        background-color: #fff;
        color: #af8564;
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-decoration: none;
        padding: 14px 32px;
        border: 3px solid #fff;
        transition: background-color 0.3s ease, color 0.3s ease;
        border-radius: 5px;
      }
      .sawo-cta-btn:hover {
        background-color: transparent;
        color: #fff;
      }
      .sawo-cta-right {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
      }
      .sawo-cta-right img {
        width: 100%;
        max-height: 300px;
        object-fit: cover;
        object-position: top center;
        display: block;
        border-radius: 6px;
      }
      @media (max-width: 900px) {
        .sawo-cta-inner {
          grid-template-columns: 1fr;
        }
        .sawo-cta-left {
          padding: 48px 36px;
        }
        .sawo-cta-left .sawo-title {
          font-size: 30px;
        }
        .sawo-cta-right {
          padding: 0 36px 48px;
        }
        .sawo-cta-right img {
          max-height: 240px;
        }
      }
      @media (max-width: 480px) {
        .sawo-cta-left {
          padding: 40px 24px;
        }
        .sawo-cta-left .sawo-title {
          font-size: 26px;
        }
        .sawo-cta-left .sawo-subtitle {
          font-size: 14px;
          margin-bottom: 28px;
        }
        .sawo-cta-btn {
          font-size: 12px;
          padding: 12px 24px;
        }
        .sawo-cta-right {
          padding: 0 24px 40px;
        }
      }
    `}</style>
  </div>
);

export default SaunaCalculatorCTA;
