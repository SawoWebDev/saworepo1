// lib/botPatterns.js
// Known crawler/bot User-Agent substrings, plus a generic catch-all.
// Used by /api/track/pageview to skip inserting rows for non-human traffic.

const KNOWN_BOTS = [
  "Googlebot",
  "Bingbot",
  "Slurp", // Yahoo
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Slackbot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
];

const KNOWN_BOTS_PATTERN = new RegExp(KNOWN_BOTS.join("|"), "i");
const GENERIC_BOT_PATTERN = /bot|spider|crawler/i;

export function isBot(userAgent) {
  if (!userAgent) return false;
  return KNOWN_BOTS_PATTERN.test(userAgent) || GENERIC_BOT_PATTERN.test(userAgent);
}
