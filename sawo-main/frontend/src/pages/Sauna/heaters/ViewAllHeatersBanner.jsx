// Shared "View All Heaters" CTA banner — identical block used at the same
// spot on every heater series page (WallMounted, Floor, Combi, Tower,
// Stone, Dragonfire), right before the "Why Choose SAWO" section. Kept as
// one component (not copy-pasted 6x) so a future style change only needs
// one edit, same reasoning as the *Groups.js grouping utils.
import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../../menuPaths";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

export default function ViewAllHeatersBanner() {
  const t = useLocaleT("sauna");
  const localize = useLocalizedPath();
  return (
    <section className="wm-viewall-banner">
      <div className="wm-viewall-content">
        <h2 className="wm-viewall-title">{t("heatersPage.viewAllTitle")}</h2>
        <p className="wm-viewall-sub">{t("heatersPage.viewAllSub")}</p>
        <Link to={localize(menuPaths.heaters)} className="wm-viewall-btn">{t("heatersPage.viewAll")}</Link>
      </div>
    </section>
  );
}
