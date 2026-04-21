import React from "react";

const ButtonClear = ({ text, href, download }) => {
  return (
    <a
      href={href}
      download={download}
      rel="noopener"
      className="inline-flex items-center gap-2 px-8 py-3 border-2 rounded transition-all duration-300"
      style={{
        borderColor: "#ffffff",
        color: "#ffffff",
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 400,
        fontSize: "14px",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#ffffff";
        e.currentTarget.style.color = "#AF8564";
        e.currentTarget.style.borderColor = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#ffffff";
        e.currentTarget.style.borderColor = "#ffffff";
      }}
    >
      {text}
    </a>
  );
};

export default ButtonClear;