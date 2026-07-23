// src/Administrator/cmsSearch.js
// Builds the searchable index for the global CMS quick-nav search bar.
// Page-level entries are derived from NAV_ITEMS (single source of truth —
// see permissions.js) so they never drift out of sync with the sidebar.
// EXTRA_SEARCH_ENTRIES covers fine-grained sections *within* a page (e.g.
// "Top Pages" lives inside the Analytics page) — each needs a matching
// DOM id on the target page for the search bar's jump-to-section scroll.
import { NAV_ITEMS } from "./permissions";

const EXTRA_SEARCH_ENTRIES = [
  {
    label: "Top Pages",
    keywords: ["top pages", "most visited", "popular pages", "page views"],
    description: "See which pages get the most traffic — inside Analytics.",
    path: "/admin/analytics",
    anchor: "analytics-top-pages",
    section: "Analytics",
    cap: "page.analytics",
  },
  {
    label: "Top Countries",
    keywords: ["top countries", "visitor location", "geo", "country breakdown"],
    description: "See where your visitors come from — inside Analytics.",
    path: "/admin/analytics",
    anchor: "analytics-top-countries",
    section: "Analytics",
    cap: "page.analytics",
  },
  {
    label: "Traffic Over Time",
    keywords: ["daily traffic", "traffic chart", "sessions over time", "visitors chart"],
    description: "Daily visitor traffic chart — inside Analytics.",
    path: "/admin/analytics",
    anchor: "analytics-traffic-chart",
    section: "Analytics",
    cap: "page.analytics",
  },
];

export function buildSearchIndex() {
  const navEntries = NAV_ITEMS.map(item => ({
    label: item.label,
    keywords: [item.label.toLowerCase()],
    description: item.description,
    path: item.to,
    anchor: null,
    section: item.section,
    cap: item.cap,
  }));
  return [...navEntries, ...EXTRA_SEARCH_ENTRIES];
}
