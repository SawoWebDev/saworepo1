import React from "react";

// onClick support (renders a <button> instead of an <a>) is additive: every
// existing caller passes href/download/target only, so they're unaffected.
// It exists for triggers that open something in-page (e.g. the flipbook
// catalogue viewer) rather than navigate to a file.
const ButtonClear = ({ text, href, download, target, onClick }) => {
  const commonProps = {
    className: "inline-flex items-center gap-2 px-8 py-3 border-2 rounded transition-all duration-300",
    style: {
      borderColor: "#ffffff",
      color: "#ffffff",
      fontFamily: "Montserrat, sans-serif",
      fontWeight: 400,
      fontSize: "14px",
      backgroundColor: "transparent",
      cursor: "pointer",
    },
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = "#ffffff";
      e.currentTarget.style.color = "#AF8564";
      e.currentTarget.style.borderColor = "#ffffff";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = "transparent";
      e.currentTarget.style.color = "#ffffff";
      e.currentTarget.style.borderColor = "#ffffff";
    },
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} {...commonProps}>
        {text}
      </button>
    );
  }

  return (
    <a href={href} download={download} target={target} rel="noopener noreferrer" {...commonProps}>
      {text}
    </a>
  );
};

export default ButtonClear;