// sources.js
// Referrer/UTM → traffic-source resolution for the Plausible-style
// "Top Sources" card in Analytics.jsx. Pure data + pure functions.
//
// Icons are Font Awesome 6 classes (all.min.css including the brands set is
// already loaded via CDN in public/index.html) — no favicon service, so no
// third-party requests from the admin panel.

// [hostname regex, display name, FA icon class, channel]
const KNOWN_SOURCES = [
  [/(^|\.)google\./,                          "Google",      "fa-brands fa-google",           "Organic Search"],
  [/(^|\.)bing\.com$/,                        "Bing",        "fa-brands fa-microsoft",        "Organic Search"],
  [/(^|\.)duckduckgo\.com$/,                  "DuckDuckGo",  "fa-solid fa-magnifying-glass",  "Organic Search"],
  [/(^|\.)search\.yahoo\.|(^|\.)yahoo\.com$/, "Yahoo",       "fa-brands fa-yahoo",            "Organic Search"],
  [/(^|\.)yandex\./,                          "Yandex",      "fa-solid fa-magnifying-glass",  "Organic Search"],
  [/(^|\.)baidu\.com$/,                       "Baidu",       "fa-solid fa-magnifying-glass",  "Organic Search"],
  [/(^|\.)ecosia\.org$/,                      "Ecosia",      "fa-solid fa-magnifying-glass",  "Organic Search"],

  [/(^|\.)(facebook\.com|fb\.com|messenger\.com)$/, "Facebook", "fa-brands fa-facebook",      "Social"],
  [/(^|\.)instagram\.com$/,                   "Instagram",   "fa-brands fa-instagram",        "Social"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/,      "X (Twitter)", "fa-brands fa-x-twitter",        "Social"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/,         "LinkedIn",    "fa-brands fa-linkedin",         "Social"],
  [/(^|\.)reddit\.com$/,                      "Reddit",      "fa-brands fa-reddit-alien",     "Social"],
  [/(^|\.)(youtube\.com|youtu\.be)$/,         "YouTube",     "fa-brands fa-youtube",          "Social"],
  [/(^|\.)pinterest\./,                       "Pinterest",   "fa-brands fa-pinterest",        "Social"],
  [/(^|\.)tiktok\.com$/,                      "TikTok",      "fa-brands fa-tiktok",           "Social"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/,           "WhatsApp",    "fa-brands fa-whatsapp",         "Social"],
  [/(^|\.)(telegram\.org|t\.me)$/,            "Telegram",    "fa-brands fa-telegram",         "Social"],

  [/(^|\.)github\.com$/,                      "GitHub",      "fa-brands fa-github",           "Referral"],
];

const DIRECT = { name: "Direct / None", icon: "fa-solid fa-link-slash" };

function matchKnown(hostname) {
  for (const [re, name, icon, channel] of KNOWN_SOURCES) {
    if (re.test(hostname)) return { name, icon, channel };
  }
  return null;
}

// utm_source values are free text ("facebook", "Google", "newsletter") — try
// to line them up with a known source so they get the right icon/casing.
function matchUtmSource(utmSource) {
  const lower = utmSource.toLowerCase();
  for (const [, name, icon, channel] of KNOWN_SOURCES) {
    if (name.toLowerCase().replace(/\s*\(.*\)$/, "") === lower) return { name, icon, channel };
  }
  return null;
}

/**
 * Resolve a visit's display source. Precedence: utm_source > referrer > direct.
 * Returns { name, icon }.
 */
export function resolveSource({ referrer, utm_source }) {
  if (utm_source) {
    const known = matchUtmSource(utm_source);
    if (known) return { name: known.name, icon: known.icon };
    return { name: utm_source, icon: "fa-solid fa-link" };
  }
  if (referrer) {
    const known = matchKnown(referrer);
    if (known) return { name: known.name, icon: known.icon };
    return { name: referrer.replace(/^www\./, ""), icon: "fa-solid fa-link" };
  }
  return DIRECT;
}

/**
 * Resolve a visit's acquisition channel:
 * Direct | Organic Search | Social | Referral | Paid | Email.
 */
export function resolveChannel({ referrer, utm_source, utm_medium }) {
  if (utm_medium && /^(cpc|ppc|paid|display|banner|cpm)/i.test(utm_medium)) return "Paid";
  if ((utm_medium && /email/i.test(utm_medium)) || (utm_source && /email|newsletter/i.test(utm_source))) return "Email";

  const known =
    (referrer && matchKnown(referrer)) ||
    (utm_source && matchUtmSource(utm_source)) ||
    null;
  if (known) return known.channel;

  if (!referrer && !utm_source) return "Direct";
  return "Referral";
}
