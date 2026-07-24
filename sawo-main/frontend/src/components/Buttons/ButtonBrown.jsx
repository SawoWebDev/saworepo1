import React from "react";
import ChevronRight from "../icons/ChevronRight";

const ButtonBrown = ({ text = "Click Here", href = "#", icon = true }) => {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium transition-all duration-300 border-4 border-transparent text-white"
      style={{
        // Same gradient/shadow as the header's Nav Style 2 active/hover pill
        // (Header.jsx) — kept byte-identical so every "brown pill" on the
        // site reads as the same element. Note: #af8564 is 3.3:1 contrast
        // with white text, below WCAG AA's 4.5:1 (this used to be #916e53,
        // a 4.5:1-contrast variant, before this request).
        background: "linear-gradient(135deg, #af8564 0%, #c9a97e 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(139,94,60,0.22)",
        fontFamily: "Montserrat, sans-serif",
      }}
      onMouseEnter={(e) => {
        // Darken the fill instead of clearing it — the old transparent-bg
        // hover put brown text on white (3.3:1, barely legible) plus a
        // visible border ring. Staying filled with white text keeps it
        // readable and removes the border entirely.
        e.currentTarget.style.background = "linear-gradient(135deg, #8f6c4d 0%, #a9835f 100%)";
        e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.25)";
        e.currentTarget.style.color = "#ffffff";
        e.currentTarget.style.borderColor = "transparent";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "linear-gradient(135deg, #af8564 0%, #c9a97e 100%)";
        e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(139,94,60,0.22)";
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