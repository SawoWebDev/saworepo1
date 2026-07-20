// Inline copy of Font Awesome Free "chevron-right" (CC BY 4.0 —
// https://fontawesome.com/license/free). Avoids pulling the @fortawesome/*
// React packages in for a single glyph.
export default function ChevronRight({ className = '', style, ...rest }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 512"
      fill="currentColor"
      className={className}
      style={{
        display: 'inline-block',
        height: '1em',
        width: '0.625em',
        verticalAlign: '-0.125em',
        overflow: 'visible',
        ...style,
      }}
      {...rest}
    >
      <path d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
    </svg>
  );
}
