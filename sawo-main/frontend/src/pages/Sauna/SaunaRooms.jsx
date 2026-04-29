import React from "react";
import "./SaunaRooms.css";
import { MATS_ITEMS } from "./rooms/SaunaRoomData";
import SaunaRoomViewer    from "./rooms/SaunaRoomViewer";
import SaunaFeatures      from "./rooms/SaunaFeatures";
import SaunaProductDetails from "./rooms/SaunaProductDetails";
import SaunaRoomDetails   from "./rooms/SaunaRoomDetails";
import Sauna3DTeaser      from "./rooms/Sauna3DTeaser";
import SaunaConfigurator  from "./rooms/SaunaConfigurator";

const SaunaRooms = () => (
  <div>
    <SaunaRoomViewer />
    <SaunaFeatures />
    <SaunaProductDetails />
    <SaunaRoomDetails />
    <Sauna3DTeaser />

    {/* MATS — Choose Your Wood */}
    <div className="sawo-materials">
      <div className="sawo-materials-header">
        <div className="sawo-materials-title">Choose Your Wood</div>
        <p>Each wood type brings its own character, scent, and warmth to your sauna experience.</p>
      </div>
      <div className="sawo-materials-grid">
        {MATS_ITEMS.map((mat) => (
          <div key={mat.name} className="sawo-mat-card">
            <div className="sawo-mat-card-img">
              <img src={mat.image} alt={mat.alt} />
            </div>
            <div className="sawo-mat-card-body">
              <div className="sawo-mat-name">{mat.name}</div>
              <p>{mat.description}</p>
              <div className="wood-traits">
                {mat.traits.map((t) => <span key={t}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <SaunaConfigurator />

    {/* CTA */}
    <div className="sawo-cta">
      <div className="sawo-cta-container">
        <div className="sawo-cta-icon">
          <svg width="32" height="32" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="29" height="4" fill="white" rx="1" />
            <rect x="10" y="16" width="25" height="21" fill="white" rx="1" />
            <rect x="18" y="26" width="9" height="11" fill="#8b5e3c" rx="0.5" />
          </svg>
        </div>
        <div className="sawo-cta-label">Your Wellness Awaits</div>
        <div className="sawo-cta-title">Ready to Build Your Dream Sauna?</div>
        <div className="sawo-cta-description">
          Let our sauna specialists guide you through every step. From design consultation to installation support, we're here to bring the ultimate relaxation experience to your home.
        </div>
        <a href="https://www.sawo.com/contact/" className="sawo-cta-btn">
          <span className="sawo-cta-btn-content">
            Inquire Today
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  </div>
);

export default SaunaRooms;
