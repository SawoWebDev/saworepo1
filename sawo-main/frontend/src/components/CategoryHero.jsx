import React from "react";
import HeroWave from "./HeroWave";
import { useHeroLoaded } from "../utils/useHeroLoaded";

// Shared category-page hero: full-bleed image + dark overlay + eyebrow/title/
// description + HeroWave. This is the pattern HeatersCatalog.jsx ("/sauna-heaters")
// established; pulled out so /products, /sauna/controls, /steam/generators, and
// /steam/controls all render the exact same hero instead of four near-copies.
export default function CategoryHero({ heroImg, eyebrow = "Premium Collection", title, description, children }) {
  const heroLoaded = useHeroLoaded(heroImg);

  return (
    <div style={{
      position: "relative", width: "100%", padding: "140px 60px 60px",
      textAlign: "center", overflow: "hidden", backgroundColor: "#241c17",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${heroImg})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{
          fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#e8c8ab", margin: "0 0 12px",
          fontFamily: "'Montserrat', sans-serif",
        }}>
          {eyebrow}
        </p>
        <h1 style={{
          fontSize: "2.4rem", fontWeight: 700, color: "#ffffff",
          margin: "0 0 16px", lineHeight: 1.2, fontFamily: "'Montserrat', sans-serif",
        }}>
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: "1rem", color: "rgba(255,255,255,0.88)",
            margin: "0 auto 12px", maxWidth: 700, lineHeight: 1.6, textAlign: "center",
            fontFamily: "'Montserrat', sans-serif",
          }}>
            {description}
          </p>
        )}
        {children}
      </div>

      <HeroWave />
    </div>
  );
}
