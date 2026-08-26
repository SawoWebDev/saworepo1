import React, { useState, useCallback, useMemo } from "react";
import { SRD_PANELS, wrapIndex } from "./SaunaRoomData";
import { useLocaleT } from "../../../i18n/LocaleContext";
import { translateSharedItems } from "../../../i18n/translateSharedItems";

// Also rendered by /infrared/saunas with its own IR_ROOM_PANEL prop — see
// translateSharedItems.js for why this goes through that helper rather than
// a `panels === SRD_PANELS` check (SaunaRooms.jsx passes
// SRD_PANELS.filter(...), which broke that check on first ship).
const SRD_KEYS = ["standard", "glassfront", "infrared", "compact"];

const SaunaRoomDetails = ({ panels = SRD_PANELS, showNav = true }) => {
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const translatedPanels = useMemo(
    () => translateSharedItems(panels, SRD_PANELS, SRD_KEYS, (panel, key) => {
      const tr = t(`roomsPage.roomDetails.panels.${key}`, { returnObjects: true });
      return {
        ...panel,
        pill: t(`roomsPage.roomDetails.pills.${key}`),
        label: t("roomsPage.roomDetails.aboutThisRoom"),
        title: t(`roomsPage.roomTitles.${key}`),
        descriptions: tr.descriptions,
        features: tr.features,
      };
    }),
    [panels, t]
  );
  const [index, setIndex] = useState(0);

  const goTo = useCallback((idx) => {
    setIndex(wrapIndex(idx, panels.length));
  }, [panels.length]);

  return (
    <div className="srd">
      <div className="srd-inner">

        {showNav && (
        <div className="srd-nav">
          {panels.length > 1 && (
          <button className="srd-nav-arrow" onClick={() => goTo(index - 1)} aria-label={tc("previous")}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="#af8564" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          )}

          <div className="srd-nav-pills">
            {translatedPanels.map((panel, i) => (
              <button
                key={panel.pill}
                className={`srd-nav-pill${index === i ? " active" : ""}`}
                onClick={() => goTo(i)}
              >
                {panel.pill}
              </button>
            ))}
          </div>

          {panels.length > 1 && (
          <button className="srd-nav-arrow" onClick={() => goTo(index + 1)} aria-label={tc("next")}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="#af8564" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          )}
        </div>
        )}

        <div className="srd-panels">
          {translatedPanels.map((panel, i) => (
            <div key={panel.pill} className={`srd-panel${index === i ? " active" : ""}`}>
              <div>
                <div className="srd-label">{panel.label}</div>
                <div className="srd-title">{panel.title}</div>
                {panel.descriptions.map((d, j) => (
                  <p key={j} className="srd-desc">{d}</p>
                ))}
                <ul className="srd-features">
                  {panel.features.map((f) => (
                    <li key={f}>
                      <span className="ico">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" stroke="#fff" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`srd-img-wrap${panel.imgPosition ? ` srd-img-${panel.imgPosition}` : ""}`}>
                <img src={panel.image} alt={panel.imageAlt} />
              </div>
            </div>
          ))}
        </div>

        <div className="srd-counter">{index + 1} / {panels.length}</div>

      </div>
    </div>
  );
};

export default SaunaRoomDetails;
