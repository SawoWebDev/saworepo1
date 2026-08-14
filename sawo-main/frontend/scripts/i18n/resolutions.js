/**
 * scripts/i18n/resolutions.js — hand-reviewed resolutions for every entry
 * scan-all.js flagged under needsReview, produced by reading each flagged
 * string's actual source context (file + line) and deciding: promote to
 * real translatable copy (reconstructing full sentences where inline
 * <b>/<strong> tags split them into fragments), or confirm as genuinely
 * non-copy with a documented reason.
 *
 * Each PROMOTED entry's `consumes` list names the exact (file, line, value)
 * triples from the ORIGINAL needsReview array that it resolves — so
 * apply-resolutions.js can remove precisely those entries and verify
 * nothing was missed, rather than matching loosely by file/line alone.
 *
 * Consumed by apply-resolutions.js — not meant to be run standalone.
 */

const PROMOTED = [
  {
    page: "aboutUsAbout", path: ["copy", "sawo_result_of_fusing_sauna_world"],
    value: "SAWO is a result from fusing the two words <b>Sa</b>una and <b>Wo</b>rld. It accurately reflects us as a comprehensive sauna provider. Meeting all your sauna needs, from heaters to door handles and louvers. Driven by a passion for sauna and guided by an innovative company culture, we have become one of the world's leading sauna product manufacturers, serving over 90 countries around the globe, and counting. Our offering ranges from sauna heaters, accessories, and control units to sauna rooms, steam generators, and infrared solutions.",
    note: "About.jsx:549 — reconstructed from fragments split by <b>Sa</b>/<b>Wo</b> (the SAWO/World wordplay). Translator note: this wordplay is English-specific (Sauna+World=SaWOrld) and likely can't be preserved literally in Finnish/German — translate the sentence meaning; the <b> tags can wrap different letters or be dropped if the wordplay doesn't carry over.",
    consumes: [
      { file: "pages/AboutUs/About.jsx", line: 549, value: "una and" },
      { file: "pages/AboutUs/About.jsx", line: 549, valuePrefix: "rld. It accurately reflects" },
    ],
  },
  {
    page: "aboutUsAbout", path: ["copy", "dedication_to_quality_sustainability"],
    value: "Our dedication to quality and sustainability is backed by internationally recognized certifications. We first obtained <b>ISO 9001 for Quality Management</b> in 2002 and <b>ISO 14001 for Environmental Management</b> in 2007, both of which were renewed in 2025 under the latest standards; <b>ISO 9001:2015</b> and <b>ISO 14001:2015</b>. Our <b>PEFC</b> certification further demonstrates our commitment to source from sustainably managed forests. These certifications guarantee that every single product meets the highest global benchmarks for safety, quality, and environmental responsibility.",
    note: "About.jsx:555 — reconstructed from fragments split by <b> tags around certification names. ISO/PEFC codes are standard designations, do not translate those tokens.",
    consumes: [
      { file: "pages/AboutUs/About.jsx", line: 555, value: "in 2002 and" },
      { file: "pages/AboutUs/About.jsx", line: 555, valuePrefix: "in 2007, both of which" },
      { file: "pages/AboutUs/About.jsx", line: 555, value: "and" },
      { file: "pages/AboutUs/About.jsx", line: 555, value: ". Our" },
      { file: "pages/AboutUs/About.jsx", line: 555, valuePrefix: "certification further demonstrates" },
    ],
  },
  {
    page: "aboutUsAbout", path: ["copy", "proud_ambassadors_sauna_from_finland"],
    value: "As proud ambassadors of Finnish sauna culture, we are also a member of <b>Sauna from Finland</b>, an association dedicated to promoting the authentic Finnish sauna experience around the world.",
    note: "About.jsx:558 — reconstructed, split by <b>Sauna from Finland</b>.",
    consumes: [{ file: "pages/AboutUs/About.jsx", line: 558, valuePrefix: ", an association dedicated" }],
  },
  {
    page: "aboutUsAbout", path: ["copy", "years_suffix"], value: "years",
    note: "About.jsx:566 — unit suffix label paired with a '30+' stat number, standalone real copy.",
    consumes: [{ file: "pages/AboutUs/About.jsx", line: 566, value: "years" }],
  },
  {
    page: "aboutUsAbout", path: ["copy", "countries_worldwide_suffix"], value: "countries worldwide",
    note: "About.jsx:573 — unit suffix label paired with a '90+' stat number, standalone real copy.",
    consumes: [{ file: "pages/AboutUs/About.jsx", line: 573, value: "countries worldwide" }],
  },

  {
    page: "careers", path: ["copy", "value_quality_innovation"],
    value: "Be part of a company that values <strong>quality, innovation, and customer satisfaction.</strong>",
    note: "Careers.jsx:533-534 — reconstructed, split by <strong>.",
    consumes: [{ file: "pages/Careers/Careers.jsx", line: 534, value: "quality, innovation, and customer satisfaction." }],
  },
  {
    page: "careers", path: ["copy", "diverse_team_finnish_filipino"],
    value: "Work with a diverse team of <strong>Finnish and Filipino professionals</strong> collaborating across global markets.",
    note: "Careers.jsx:546-548 — reconstructed, split by <strong>.",
    consumes: [{ file: "pages/Careers/Careers.jsx", line: 547, value: "collaborating across global markets." }],
  },
  {
    page: "careers", path: ["copy", "invest_in_employees"],
    value: "We invest in our employees through <strong>training, skill development, and career advancement</strong>.",
    note: "Careers.jsx:560-564 — reconstructed, split by <strong>.",
    consumes: [{ file: "pages/Careers/Careers.jsx", line: 561, value: "training, skill development, and career advancement" }],
  },
  {
    page: "careers", path: ["copy", "sawo_iso_certified"],
    value: "SAWO is <strong>ISO 9001 & ISO 14001 certified</strong>, ensuring a workplace focused on quality and sustainability.",
    note: "Careers.jsx:576-578 — reconstructed, split by <strong>. ISO codes not translated.",
    consumes: [{ file: "pages/Careers/Careers.jsx", line: 577, value: ", ensuring a workplace focused on quality and sustainability." }],
  },
  {
    page: "careers", path: ["copy", "why_work_for_sawo"], value: "Why Work for SAWO?",
    note: "Careers.jsx:521 — reconstructed; trailing '?' was a separate JSX text sibling after <span>SAWO</span>.",
    consumes: [{ file: "pages/Careers/Careers.jsx", line: 521, value: "?" }],
  },

  {
    page: "aboutUsSustainability", path: ["copy", "wellbeing_quote"],
    value: "Health and wellbeing is at the base of having a good life. Sustainability not only looks at the wellbeing of people, but also at the wellbeing of the Earth. At SAWO, <span className=\"unique-wellbeing-quote-highlight\">wellbeing is our business</span>. We make sure you are taken care of with a sauna. We also do our best to make sure the Earth is taken care of. <span className=\"unique-wellbeing-quote-highlight\">Wellbeing is Sustainability. Be well. Sauna well.</span>",
    note: "Sustainability.jsx:839-851 — reconstructed full pull-quote, split by two highlighted <span> segments.",
    consumes: [
      { file: "pages/AboutUs/Sustainability.jsx", line: 843, value: "wellbeing is our business" },
      { file: "pages/AboutUs/Sustainability.jsx", line: 845, valuePrefix: ". We make sure you are taken care" },
    ],
  },

  {
    page: "sitemap", path: ["copy", "need_help_contact_or_faq"],
    value: "Can't find what you're looking for? Visit our <a>contact page</a> or <a>FAQ section</a>.",
    note: "Sitemap.jsx:248-253 — reconstructed, split by two <a> links.",
    consumes: [
      { file: "pages/Sitemap.jsx", line: 250, value: "contact page" },
      { file: "pages/Sitemap.jsx", line: 250, value: "or" },
    ],
  },

  {
    page: "supportSaunaCalculator", path: ["copy", "unit_meters"], value: "m",
    note: "SaunaCalculator.jsx:69 — unit-of-measure suffix label.",
    consumes: [{ file: "pages/Support/SaunaCalculator.jsx", line: 69, value: "m" }],
  },
  {
    page: "supportSaunaCalculator", path: ["copy", "unit_kw"], value: "kW",
    note: "SaunaCalculator.jsx:104,640 — unit-of-measure suffix label (same value both locations).",
    consumes: [
      { file: "pages/Support/SaunaCalculator.jsx", line: 104, value: "kW" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 640, value: "kW" },
    ],
  },
  {
    page: "supportSaunaCalculator", path: ["copy", "unit_m3"], value: "m³",
    note: "SaunaCalculator.jsx:632,661 — unit-of-measure suffix label (same value both locations).",
    consumes: [
      { file: "pages/Support/SaunaCalculator.jsx", line: 632, value: "m³" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 661, value: "m³" },
    ],
  },
  {
    page: "supportSaunaCalculator", path: ["copy", "heaters_found_singular"], value: "heater found",
    note: "SaunaCalculator.jsx:653 — was a conditional 's' pluralization suffix ({count} heater{s} found); split into full singular/plural phrases since fi/de pluralization differs from English's simple 's' suffix.",
    consumes: [
      { file: "pages/Support/SaunaCalculator.jsx", line: 653, value: "heater" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 653, value: "s" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 653, value: "found" },
    ],
  },
  {
    page: "supportSaunaCalculator", path: ["copy", "heaters_found_plural"], value: "heaters found",
    note: "SaunaCalculator.jsx:653 — plural counterpart of heaters_found_singular (see its consumes list).",
    consumes: [],
  },
  {
    page: "supportSaunaCalculator", path: ["copy", "showing_compatible_heaters"],
    value: "Showing heaters compatible with <strong>{kw} kW</strong> for a <strong>{volume} m³</strong> sauna.",
    note: "SaunaCalculator.jsx:659-662 — reconstructed; {kw} and {volume} are placeholders for the dynamic matchKw/volume values, preserve exactly.",
    consumes: [
      { file: "pages/Support/SaunaCalculator.jsx", line: 660, value: "kW" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 660, value: "for a" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 661, value: "sauna." },
    ],
  },
  {
    page: "supportSaunaCalculator", path: ["copy", "no_heaters_found_for_rating"],
    value: "No heaters found for this power rating. Please <a>contact us</a> for advice.",
    note: "SaunaCalculator.jsx:678-682 — reconstructed, split by <a> link.",
    consumes: [
      { file: "pages/Support/SaunaCalculator.jsx", line: 680, value: "contact us" },
      { file: "pages/Support/SaunaCalculator.jsx", line: 680, value: "for advice." },
    ],
  },

  {
    page: "steam", path: ["copy", "steam_hero_title"], value: "STEAM",
    note: "Steam.jsx:88 — hero H1, real translatable heading (parallel to Sauna's 'FINNISH SAUNA' -> 'SUOMALAINEN SAUNA', matches home.json's already-translated steamHeading).",
    consumes: [{ file: "pages/Steam/Steam.jsx", line: 88, value: "STEAM" }],
  },
  {
    page: "supportFAQ", path: ["copy", "faq_hero_title"], value: "FAQ",
    note: "FAQ.jsx:408 — hero H1. 'FAQ' commonly stays as-is or becomes a native abbreviation (e.g. Finnish 'UKK') — translator's call.",
    consumes: [{ file: "pages/Support/FAQ.jsx", line: 408, value: "FAQ" }],
  },
  {
    page: "supportFAQ", path: ["alt", "faq_image_alt"], value: "FAQ",
    note: "FAQ.jsx:521 — image alt text, same word as the hero title but a separate use.",
    consumes: [{ file: "pages/Support/FAQ.jsx", line: 521, value: "FAQ" }],
  },
  {
    page: "notFound", path: ["copy", "faq_link_label"], value: "FAQ",
    note: "NotFound.jsx:97 — a real <Link>FAQ</Link> nav label in the 'Popular Sections' list, not noise.",
    consumes: [{ file: "pages/NotFound.jsx", line: 97, value: "FAQ" }],
  },

  {
    page: "saunaHeatersWallMounted", path: ["copy", "no_heaters_match_search"],
    value: "No heaters match \"<strong>{search}</strong>\"",
    note: "WallMounted.jsx:487 — reconstructed; {search} is the dynamic search-term placeholder, preserve exactly.",
    consumes: [{ file: "pages/Sauna/heaters/WallMounted.jsx", line: 487, value: "\"" }],
  },
  {
    page: "saunaSaunaControls", path: ["copy", "no_controls_match_search"],
    value: "No controls match \"<strong>{search}</strong>\"",
    note: "SaunaControls.jsx:424 — reconstructed; {search} is the dynamic search-term placeholder, preserve exactly.",
    consumes: [{ file: "pages/Sauna/SaunaControls.jsx", line: 424, value: "\"" }],
  },

  {
    shared: "headerSearchBar", path: ["copy", "faq_search_result_label"], value: "FAQ",
    note: "SearchBar.jsx:15 — a { name: \"FAQ\", path: ... } entry in PAGE_RESULTS (the site-search page-results list), same word as FAQ.jsx's own title/alt and NotFound.jsx's nav link, same treatment.",
    consumes: [{ file: "components/Header/SearchBar.jsx", line: 15, value: "FAQ" }],
  },
  {
    shared: "header", path: ["copy", "toggle_submenu_aria_label"],
    value: "{action} {itemName} submenu",
    note: "Header.jsx:788 and :843 — both are the exact same shape (aria-label={`${hovered ? \"Collapse\" : \"Expand\"} ${item.name} submenu`}, once for top-level nav items, once for second-level submenu items), consolidated into one template key. {action} is \"Collapse\"/\"Expand\" (already promoted separately, see header.aria-label.collapse/expand), {itemName} is the dynamic nav item's own name. Preserve both placeholders exactly; translate \"submenu\" in context (e.g. Finnish \"alavalikko\").",
    consumes: [
      { file: "components/Header/Header.jsx", line: 788, value: "submenu" },
      { file: "components/Header/Header.jsx", line: 843, value: "submenu" },
    ],
  },
];

// Shared across all 10 accessory-category pages + UserManuals.jsx —
// identical string, consolidated into common.json's convention instead of
// being duplicated 11 times.
const PROMOTED_SHARED = [
  {
    path: ["common", "no_products_match_search"],
    value: "No products match \"<strong>{search}</strong>\"",
    note: "Identical across AccessorySets/BenchesFloorTiles/ClocksSandtimers/DoorsHandles/HeadrestsBackrests/Kivistone/PailsLadles/SaunaLights/Thermometers/VentilationsAddOns/UserManuals — consolidated to one shared key rather than duplicated 11 times. {search} is the dynamic search-term placeholder, preserve exactly.",
    consumes: [
      { file: "pages/Sauna/accessories/AccessorySets.jsx", line: 190, value: "\"" },
      { file: "pages/Sauna/accessories/BenchesFloorTiles.jsx", line: 192, value: "\"" },
      { file: "pages/Sauna/accessories/ClocksSandtimers.jsx", line: 191, value: "\"" },
      { file: "pages/Sauna/accessories/DoorsHandles.jsx", line: 191, value: "\"" },
      { file: "pages/Sauna/accessories/HeadrestsBackrests.jsx", line: 191, value: "\"" },
      { file: "pages/Sauna/accessories/Kivistone.jsx", line: 190, value: "\"" },
      { file: "pages/Sauna/accessories/PailsLadles.jsx", line: 275, value: "\"" },
      { file: "pages/Sauna/accessories/SaunaLights.jsx", line: 191, value: "\"" },
      { file: "pages/Sauna/accessories/Thermometers.jsx", line: 192, value: "\"" },
      { file: "pages/Sauna/accessories/VentilationsAddOns.jsx", line: 192, value: "\"" },
      { file: "pages/Support/UserManuals.jsx", line: 539, value: "\"" },
    ],
  },
];

// Confirmed EXCLUDED — not copy. Matched by predicate against each
// remaining (unconsumed) needsReview entry; first match wins. Every entry
// must match exactly one of these OR be in PROMOTED/PROMOTED_SHARED's
// consumes lists — apply-resolutions.js errors loudly if anything is left
// over unclassified.
const EXCLUDED_REASONS = [
  { match: (e) => ["→", "←", "‹", "›", "❮", "❯", "▶", "↻", "•", "»"].includes(e.value),
    reason: "Decorative navigation/UI glyph rendered as visible text (carousel arrows, pagination dot, play icon, reset icon), not translatable prose." },
  { match: (e) => e.value === "-" || e.value === "–",
    reason: "Fallback dash/placeholder character shown when a dynamic value is null/missing (e.g. `{value ?? \"-\"}`), not translatable text." },
  { match: (e) => e.value === "*",
    reason: "Required-field asterisk marker next to a form label (`<span class=\"ct-req\">*</span>`), universal symbol, not translatable text." },
  { match: (e) => e.value === "|",
    reason: "Visual separator character between adjacent links/items, not translatable text." },
  { match: (e) => e.value === "(" || e.value === ")",
    reason: "Punctuation wrapping a dynamic count/number (e.g. `({list.length})`), not itself translatable prose." },
  { match: (e) => e.value === "#",
    reason: "Placeholder href fallback value (routing/anchor target), not visible text." },
  { match: (e) => e.value === "\"",
    reason: "Bare quote-mark character — the sentence it belongs to was reconstructed and promoted separately (see PROMOTED / PROMOTED_SHARED)." },
  { match: (e) => e.value === "✖" || e.value === "+",
    reason: "Close/toggle icon glyph rendered as visible text (accordion +/− or dismiss ✖), not translatable prose." },
  { match: (e) => /^(https?:\/\/|www\.)/.test(e.value),
    reason: "A URL/domain shown as display text — URLs are never translated." },
  { match: (e) => /@sawo\.com$/.test(e.value),
    reason: "An email address — email addresses are never translated." },
  { match: (e) => e.file === "pages/Sauna/rooms/SaunaRoomData.jsx",
    reason: "Sauna room model/size code (e.g. \"1414\", \"1515L\") or door-option abbreviation (RS/LS/RL/LL/MS/MD) — a product identifier, not natural-language text." },
  { match: (e) => e.file === "pages/Sauna/rooms/WoodPanelandTimbers.jsx",
    reason: "Spec-table cell value — a numeric dimension (mm) or wood-profile code (e.g. \"STV\", \"STP\"), not translatable text. The table's own column headers (Profile/Width/Thickness/Length) ARE real copy, already present in the main tree." },
  { match: (e) => e.file === "pages/Sauna/heaters/Combi.jsx" || e.file === "pages/Sauna/heaters/WallMounted.jsx",
    reason: "Model-number prefix/code used to classify products into groups (e.g. \"NRNSC\", \"MNC\"), not translatable text." },
  { match: (e) => e.file === "pages/Sauna/SaunaControls.jsx",
    reason: "Internal product-code substring used for group-classification logic (GROUP_KEYWORDS), never rendered to a user, not translatable text." },
  { match: (e) => e.value === "PEFC",
    reason: "External certification body acronym (like ISO), a fixed designation — never translated. Appears inline (untranslated) within About.jsx's reconstructed certifications paragraph (see PROMOTED)." },
  { match: (e) => e.value === "www.pefc.org",
    reason: "A domain name used as display text — URLs/domains are never translated." },
  { match: (e) => e.value === "MEZ2",
    reason: "Internal facility/phase code label, not natural-language prose — flagged for the content owner to confirm whether this should ever have been a plain code versus descriptive text; not something a translator should render into another language regardless." },
];

module.exports = { PROMOTED, PROMOTED_SHARED, EXCLUDED_REASONS };
