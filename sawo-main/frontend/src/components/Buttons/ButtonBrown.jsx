import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const ButtonBrown = ({ text = "Click Here", href = "#", icon = true }) => {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium transition-all duration-300 border-4 border-transparent text-white"
      style={{
        // #916e53 = 4.5:1-contrast variant of the #af8564 brand brown; white text
        // on the original fails WCAG AA (3.3:1) and Lighthouse color-contrast.
        backgroundColor: "#916e53",
        fontFamily: "Montserrat, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#916e53";
        e.currentTarget.style.borderColor = "#916e53";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#916e53";
        e.currentTarget.style.color = "#ffffff";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {text}

      {icon && <FontAwesomeIcon icon={faChevronRight} />}
    </a>
  );
};

export default ButtonBrown;