// Shared "View All Heaters" CTA banner — identical block used at the same
// spot on every heater series page (WallMounted, Floor, Combi, Tower,
// Stone, Dragonfire), right before the "Why Choose SAWO" section. Kept as
// one component (not copy-pasted 6x) so a future style change only needs
// one edit, same reasoning as the *Groups.js grouping utils.
import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../../menuPaths";

export default function ViewAllHeatersBanner() {
  return (
    <section className="wm-viewall-banner">
      <div className="wm-viewall-content">
        <h2 className="wm-viewall-title">Looking for something different?</h2>
        <p className="wm-viewall-sub">Check out our other heaters — browse the full SAWO heater range.</p>
        <Link to={menuPaths.heaters} className="wm-viewall-btn">VIEW ALL HEATERS</Link>
      </div>
    </section>
  );
}
