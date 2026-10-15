import React from "react";
import { Link } from "react-router-dom";

// White button for dark/brown backgrounds.
// - Pass `to` for an in-app route (client-side navigation via <Link>), or
//   `href` for an external/download link. Same look and hover either way.
// - `solid` flips the states: white fill + brown text by default, clear
//   outline on hover (the default is clear, filling white on hover).
const FILLED = { backgroundColor: "#ffffff", color: "#AF8564", borderColor: "#ffffff" };
const CLEAR  = { backgroundColor: "transparent", color: "#ffffff", borderColor: "#ffffff" };

const ButtonClear = ({ text, href, to, download, target, solid = false }) => {
  const Tag = to ? Link : "a";
  const linkProps = to ? { to } : { href, download, target, rel: "noopener noreferrer" };
  const rest  = solid ? FILLED : CLEAR;
  const hover = solid ? CLEAR : FILLED;
  const apply = (el, s) => Object.assign(el.style, s);
  return (
    <Tag
      {...linkProps}
      className="inline-flex items-center gap-2 px-8 py-3 transition-all duration-300"
      style={{
        border: "3px solid #ffffff",
        borderRadius: "8px",
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 600,
        fontSize: "14px",
        ...rest,
      }}
      onMouseEnter={(e) => apply(e.currentTarget, hover)}
      onMouseLeave={(e) => apply(e.currentTarget, rest)}
    >
      {text}
    </Tag>
  );
};

export default ButtonClear;
