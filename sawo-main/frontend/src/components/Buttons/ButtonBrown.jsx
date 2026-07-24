import React from "react";
import ChevronRight from "../icons/ChevronRight";

const ButtonBrown = ({ text = "Click Here", href = "#", icon = true }) => {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium transition-all duration-300 border-4 border-transparent text-white"
      style={{
        // Brand brown #af8564 — note: 3.3:1 contrast with white text, below
        // WCAG AA's 4.5:1 (was #916e53, a 4.5:1 variant, before this test).
        backgroundColor: "#af8564",
        fontFamily: "Montserrat, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#af8564";
        e.currentTarget.style.borderColor = "#af8564";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#af8564";
        e.currentTarget.style.color = "#ffffff";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {text}

      {icon && <ChevronRight />}
    </a>
  );
};

export default ButtonBrown;