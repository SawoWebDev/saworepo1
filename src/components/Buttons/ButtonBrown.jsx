import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const ButtonBrown = ({ text = "Click Here", href = "#", icon = true }) => {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded font-medium transition-all duration-300 border-4 border-transparent text-white"
      style={{
        backgroundColor: "#AF8564",
        fontFamily: "Montserrat, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#AF8564";
        e.currentTarget.style.borderColor = "#AF8564";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#AF8564";
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