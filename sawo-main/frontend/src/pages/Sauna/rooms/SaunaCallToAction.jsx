import React from "react";
import menuPaths from "../../../menuPaths";
import ButtonBrown from "../../../components/Buttons/ButtonBrown";

const SaunaCallToAction = () => (
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
      <ButtonBrown text="Inquire Today" href={menuPaths.contact} />
    </div>
  </div>
);

export default SaunaCallToAction;
