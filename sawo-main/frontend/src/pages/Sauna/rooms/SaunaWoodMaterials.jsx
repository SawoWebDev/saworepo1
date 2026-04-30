import React from "react";
import { MATS_ITEMS } from "./SaunaRoomData";

const SaunaWoodMaterials = () => (
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
);

export default SaunaWoodMaterials;
