// dateRange.js
// Shared date-range picker logic for Analytics.jsx and PageSEO.jsx — same
// options (7/30/90 days, this year, custom) and the same resolution into
// concrete { startDate, endDate } Date objects, so both pages' filters
// behave identically instead of drifting apart.
export const DATE_RANGE_OPTIONS = [
  { key: "7days", label: "Last 7 days" },
  { key: "30days", label: "Last 30 days" },
  { key: "90days", label: "Last 90 days" },
  { key: "thisyear", label: "This year" },
  { key: "custom", label: "Custom" },
];

// Returns { startDate, endDate } Date objects, or null if "custom" is
// selected but not fully picked yet (or start is after end) — callers
// should hold off fetching in that case.
export function resolveRange(dateRange, customStart, customEnd) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  if (dateRange === "thisyear") {
    return { startDate: new Date(endDate.getFullYear(), 0, 1), endDate };
  }
  if (dateRange === "custom") {
    if (!customStart || !customEnd) return null;
    const start = new Date(`${customStart}T00:00:00`);
    const end = new Date(`${customEnd}T23:59:59.999`);
    if (start > end) return null;
    return { startDate: start, endDate: end };
  }
  const days = { "7days": 7, "30days": 30, "90days": 90 }[dateRange] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate };
}
