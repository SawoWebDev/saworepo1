import React from "react";
import { S3T_VIEWER_URL, S3T_MODEL_LABEL } from "./SaunaRoomData";

const Sauna3DTeaser = () => {
  const scrollToConfigurator = () => {
    document.getElementById("sawo-configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="sawo-3d-teaser">
      <div className="s3t-label">Interactive 3D Model</div>
      <div className="s3t-title">Explore Every Detail</div>
      <p className="s3t-subtitle">
        Rotate, zoom, and inspect every angle of our sauna before it ever arrives at your door.
      </p>

      <a className="sawo-3d-card" href={S3T_VIEWER_URL} target="_blank" rel="noopener noreferrer">
        <div className="s3t-preview">
          <div className="s3t-orbit s3t-orbit-1"></div>
          <div className="s3t-orbit s3t-orbit-2"></div>

          <div className="s3t-icon-wrap">
            <div className="s3t-icon-glow"></div>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="40,8 68,22 40,36 12,22" fill="#d4a96a" stroke="#af8564" strokeWidth="1"/>
              <polygon points="12,22 40,36 40,68 12,54" fill="#c49458" stroke="#af8564" strokeWidth="1"/>
              <polygon points="40,36 68,22 68,54 40,68" fill="#b8854e" stroke="#af8564" strokeWidth="1"/>
              <line x1="52" y1="35" x2="52" y2="60" stroke="#af8564" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="50" cy="48" r="1.5" fill="#af8564" opacity="0.8"/>
            </svg>
          </div>

          <div className="s3t-hover-overlay">
            <div className="s3t-hover-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Launch 3D Viewer
            </div>
          </div>
        </div>

        <div className="s3t-card-footer">
          <div className="s3t-hints">
            <span className="s3t-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
              </svg>
              Drag to Rotate
            </span>
            <span className="s3t-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
              Scroll to Zoom
            </span>
            <span className="s3t-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3"/>
              </svg>
              Double-tap to Focus
            </span>
          </div>
          <div className="s3t-model-label">{S3T_MODEL_LABEL}</div>
        </div>
      </a>

      <div className="s3t-cta-row">
        <a className="s3t-btn-primary" href={S3T_VIEWER_URL} target="_blank" rel="noopener noreferrer">
          Open 3D Viewer
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        <button className="s3t-btn-secondary" onClick={scrollToConfigurator}>
          Build Your Own
        </button>
      </div>
    </section>
  );
};

export default Sauna3DTeaser;
