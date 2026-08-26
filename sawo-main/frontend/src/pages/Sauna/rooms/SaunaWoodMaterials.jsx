import React from "react";
import { MATS_ITEMS } from "./SaunaRoomData";
import { useLocaleT } from "../../../i18n/LocaleContext";

// MATS_ITEMS (SaunaRoomData.jsx) is plain English data keyed by wood name —
// same "component has t(), data file doesn't" split as SaunaRoomViewer's
// bench/title lookup. Only 3 wood types exist site-wide, so a small
// translated map here is simpler than restructuring the data file.
const WOOD_KEYS = { Cedar: "cedar", Aspen: "aspen", Pinaceae: "pinaceae" };

const SaunaWoodMaterials = ({ items = MATS_ITEMS, title, subtitle }) => {
  const t = useLocaleT("sauna");
  return (
    <div className="sawo-materials">
      <div className="sawo-materials-header">
        <div className="sawo-materials-title">{title ?? t("roomsPage.woodMaterials.title")}</div>
        <p>{subtitle ?? t("roomsPage.woodMaterials.subtitle")}</p>
      </div>
      <div className="sawo-materials-grid">
        {items.map((mat) => {
          const key = WOOD_KEYS[mat.name];
          return (
            <div key={mat.name} className="sawo-mat-card">
              <div className="sawo-mat-card-img">
                <img src={mat.image} alt={mat.alt} />
              </div>
              <div className="sawo-mat-card-body">
                <div className="sawo-mat-name">{key ? t(`roomsPage.woodMaterials.items.${key}.name`) : mat.name}</div>
                <p>{key ? t(`roomsPage.woodMaterials.items.${key}.description`) : mat.description}</p>
                <div className="wood-traits">
                  {(key ? t(`roomsPage.woodMaterials.items.${key}.traits`, { returnObjects: true }) : mat.traits).map((tr) => <span key={tr}>{tr}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SaunaWoodMaterials;
