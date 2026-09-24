// Per-slug overrides for context-dependent HTML text nodes. The generic node "The" is
// translated "Der" (heaters are masculine: der Saunaofen); products with another grammatical
// gender need their own article.
export default {
  bySlug: {
    "steam-door": { The: "Die" }, // die Dampftür
    "venturi-pipe-l-shape": { The: "Das" }, // das Venturi-Rohr
    "venturi-pipe-straight": { The: "Das" },
  },
};
