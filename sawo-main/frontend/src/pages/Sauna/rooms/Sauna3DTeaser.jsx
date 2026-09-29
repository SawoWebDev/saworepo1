import React from "react";
import { Link } from "react-router-dom";
import { S3T_VIEWER_URL } from "./SaunaRoomData";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

const Sauna3DTeaser = () => {
  const t = useLocaleT("sauna");
  const localize = useLocalizedPath();
  const scrollToConfigurator = () => {
    document.getElementById("sawo-configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="sawo-3d-teaser">
      <div className="s3t-label">{t("roomsPage.teaser3d.label")}</div>
      <div className="s3t-title">{t("roomsPage.teaser3d.title")}</div>
      <p className="s3t-subtitle">{t("roomsPage.teaser3d.subtitle")}</p>

      <div className="s3t-cta-row">
        <Link className="s3t-btn-primary" to={localize(S3T_VIEWER_URL)}>
          {t("roomsPage.teaser3d.openViewer")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
        <button className="s3t-btn-secondary" onClick={scrollToConfigurator}>
          {t("roomsPage.teaser3d.buildYourOwn")}
        </button>
      </div>
    </section>
  );
};

export default Sauna3DTeaser;
