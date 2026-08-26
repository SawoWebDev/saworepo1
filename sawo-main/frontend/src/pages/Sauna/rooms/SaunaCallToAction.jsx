import React from "react";
import menuPaths from "../../../menuPaths";
import ButtonBrown from "../../../components/Buttons/ButtonBrown";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

const SaunaCallToAction = () => {
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();
  return (
    <div className="sawo-cta">
      <div className="sawo-cta-container">
        <div className="sawo-cta-icon">
          <svg width="32" height="32" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="29" height="4" fill="white" rx="1" />
            <rect x="10" y="16" width="25" height="21" fill="white" rx="1" />
            <rect x="18" y="26" width="9" height="11" fill="#8b5e3c" rx="0.5" />
          </svg>
        </div>
        <div className="sawo-cta-label">{t("roomsPage.callToAction.label")}</div>
        <div className="sawo-cta-title">{t("roomsPage.callToAction.title")}</div>
        <div className="sawo-cta-description">{t("roomsPage.callToAction.description")}</div>
        <ButtonBrown text={tc("inquireToday")} href={localize(menuPaths.contact)} />
      </div>
    </div>
  );
};

export default SaunaCallToAction;
