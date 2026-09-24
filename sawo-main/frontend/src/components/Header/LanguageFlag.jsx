// Inline SVG flags for every switcher locale — emoji flags don't render on
// Windows/some browsers, so these are drawn by hand.
import React from "react";

function FlagEn(props) {
  return (
    <svg viewBox="0 0 60 30" {...props}>
      <clipPath id="uk-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="uk-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#uk-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
function FlagFi(props) {
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="36" fill="#fff" />
      <rect x="16" width="10" height="36" fill="#003580" />
      <rect y="13" width="60" height="10" fill="#003580" />
    </svg>
  );
}
function FlagDe(props) {
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="12" y="0" fill="#000" />
      <rect width="60" height="12" y="12" fill="#DD0000" />
      <rect width="60" height="12" y="24" fill="#FFCE00" />
    </svg>
  );
}
function FlagZh(props) {
  // One large star + 4 small stars arced beside it, each small star angled
  // toward the large one — same simplified/hand-drawn approach as the other
  // flags here, not a pixel-accurate rendering.
  const star = "M25,1 31,17 48,17 35,28 40,44 25,35 10,44 15,28 2,17 19,17 Z";
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="36" fill="#DE2910" />
      <g fill="#FFDE00">
        <path d={star} transform="translate(2,2) scale(0.18)" />
        <path d={star} transform="translate(15,2) scale(0.09) rotate(23 25 22)" />
        <path d={star} transform="translate(19,6) scale(0.09) rotate(45 25 22)" />
        <path d={star} transform="translate(19,11) scale(0.09) rotate(70 25 22)" />
        <path d={star} transform="translate(15,15) scale(0.09) rotate(95 25 22)" />
      </g>
    </svg>
  );
}
function FlagJa(props) {
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="36" fill="#fff" />
      <circle cx="30" cy="18" r="10.8" fill="#BC002D" />
    </svg>
  );
}
function FlagFr(props) {
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="20" height="36" fill="#0055A4" />
      <rect x="20" width="20" height="36" fill="#fff" />
      <rect x="40" width="20" height="36" fill="#EF4135" />
    </svg>
  );
}
function FlagEs(props) {
  // Red / yellow (double height) / red, no coat of arms — same simplified
  // approach as the other flags.
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="36" fill="#AA151B" />
      <rect y="9" width="60" height="18" fill="#F1BF00" />
    </svg>
  );
}
function FlagTh(props) {
  // Red / white / blue (double height) / white / red.
  return (
    <svg viewBox="0 0 60 36" {...props}>
      <rect width="60" height="36" fill="#A51931" />
      <rect y="6" width="60" height="24" fill="#F4F5F8" />
      <rect y="12" width="60" height="12" fill="#2D2A4A" />
    </svg>
  );
}
const FLAGS = { en: FlagEn, fi: FlagFi, de: FlagDe, zh: FlagZh, ja: FlagJa, fr: FlagFr, es: FlagEs, th: FlagTh };

// Circular-frame flag for a locale code — shared by the public language
// switcher and the admin CMS's language list (Administrator/Settings.jsx) so
// both always draw the same flag. Wrap it in .header-lang-flag /
// .header-lang-flag-sm (Header.css) for the round frame, or size it yourself.
export default function LanguageFlag({ code, className }) {
  const Svg = FLAGS[code] || FlagEn;
  return <Svg className={className} preserveAspectRatio="xMidYMid slice" />;
}
