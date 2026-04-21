/**
 * cleanTableHTML.js
 * Cleans and formats WordPress/VC table HTML for clean rendering.
 *
 * Fixes vs. previous version:
 *  - colspan / rowspan are preserved (not stripped then mis-restored)
 *  - Multi-line header text is detected and split with <br> reliably
 *  - Uses a temporary DOM parser so column structure is never mangled
 *  - Produces minimal, readable output HTML
 */

// ─── Patterns that signal a natural line-break inside a <th> ─────────────────
// Each entry is checked against the full text content of the cell.
// If matched, everything after `splitText` will go on the next line.
const HEADER_SPLIT_RULES = [
  // "Size of Heater (mm) Length Width Height"  → split after "(mm)"
  { detect: /\(mm\)/i,   splitText: "(mm)" },

  // "Sauna Room min. (m3) max."  → split after "Room"
  { detect: /sauna\s+room/i, splitText: "Room" },

  // "Stones (kg)"  → split after "Stones"
  { detect: /stones?\s*\(kg\)/i, splitText: "Stones" },

  // "Minimum Safety Distances A | B | C | D"  → split after "Distances"
  { detect: /minimum\s+safety\s+distances/i, splitText: "Distances" },

  // "Heater | Tank | Control" headers separated by pipes/breaks - don't split single "kW" or "Tank"
  { detect: /\|/, splitText: "|" },

  // Generic: text that contains a newline or "\n" literal
  { detect: /\n/, splitText: "\n" },
];

/**
 * Given the raw innerHTML of a <th>, apply line-break rules
 * and return the cleaned innerHTML with <br> inserted where needed.
 */
function applyHeaderLineBreaks(rawInner) {
  // Decode any HTML entities for comparison, but work on the raw string
  const text = rawInner.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

  for (const rule of HEADER_SPLIT_RULES) {
    if (rule.detect.test(text)) {
      // Find the split point and insert <br> after it (case-insensitive for the split text)
      const regex = new RegExp(`(${rule.splitText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*`, 'i');
      const result = text.replace(regex, `$1<br>`);
      // Only return if we actually made a replacement (text changed)
      if (result !== text) {
        return result;
      }
    }
  }

  return text; // No rule matched — return plain text
}

/**
 * Parse the HTML string into a DOM Document so we can
 * manipulate it reliably without regex mis-firing on tag attributes.
 */
function parseHTML(htmlString) {
  return new DOMParser().parseFromString(htmlString, "text/html");
}

/**
 * Serialize a DOM Element back to an HTML string.
 */
function serializeElement(el) {
  const wrapper = document.createElement("div");
  wrapper.appendChild(el.cloneNode(true));
  return wrapper.innerHTML;
}

/**
 * Produce a clean, minimal <table> element from a source table element.
 * - Strips all classes, ids, styles, data-* attributes
 * - Keeps colspan / rowspan
 * - Applies <br> line-break rules to <th> text
 */
function buildCleanTable(sourceTable) {
  const table   = document.createElement("table");
  const rows    = sourceTable.querySelectorAll("tr");

  // Detect if first row contains <th> elements → use <thead>
  let bodyStartIndex = 0;
  const firstRow = rows[0];
  const hasThead = firstRow && firstRow.querySelector("th");

  let thead = null;
  let tbody = document.createElement("tbody");

  if (hasThead) {
    thead = document.createElement("thead");
    const headerTr = document.createElement("tr");

    firstRow.querySelectorAll("th, td").forEach(cell => {
      const th = document.createElement("th");

      // Preserve colspan / rowspan only
      if (cell.getAttribute("colspan")) th.setAttribute("colspan", cell.getAttribute("colspan"));
      if (cell.getAttribute("rowspan")) th.setAttribute("rowspan", cell.getAttribute("rowspan"));

      th.innerHTML = applyHeaderLineBreaks(cell.innerHTML);
      headerTr.appendChild(th);
    });

    thead.appendChild(headerTr);
    table.appendChild(thead);
    bodyStartIndex = 1;
  }

  // Body rows
  for (let i = bodyStartIndex; i < rows.length; i++) {
    const sourceTr = rows[i];
    const tr = document.createElement("tr");

    sourceTr.querySelectorAll("td, th").forEach(cell => {
      const td = document.createElement("td");

      if (cell.getAttribute("colspan")) td.setAttribute("colspan", cell.getAttribute("colspan"));
      if (cell.getAttribute("rowspan")) td.setAttribute("rowspan", cell.getAttribute("rowspan"));

      // Plain text content for body cells (strip any stray tags)
      td.textContent = cell.textContent.trim();
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
}

/**
 * Format a DOM element's outer HTML with basic indentation for readability.
 */
function prettyPrintTable(tableEl) {
  let html = serializeElement(tableEl);

  // Insert newlines around block-level table tags for readability
  html = html
    .replace(/<(thead|tbody|tr)>/g,    "\n<$1>")
    .replace(/<\/(thead|tbody|tr)>/g,  "\n</$1>")
    .replace(/<(th|td)/g,              "\n  <$1")
    .replace(/<\/(th|td)>/g,           "</$1>")
    .replace(/\n{2,}/g,                "\n")   // collapse blank lines
    .trim();

  return html;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point.
 * Feed it the raw pasted HTML (full WordPress blob or just a table).
 * Returns clean, properly structured table HTML ready to paste into your editor.
 */
export function processPastedTableHTML(htmlString) {
  if (!htmlString) return "";

  // Parse into a real DOM so we can query safely
  const doc = parseHTML(htmlString);

  // Find all tables in the pasted content
  const tables = doc.querySelectorAll("table");

  if (!tables.length) {
    // No table found — strip WP wrapper noise and return plain text
    return doc.body.textContent.trim();
  }

  // Process each table found and join results
  const results = Array.from(tables).map(sourceTable => {
    const cleanTable = buildCleanTable(sourceTable);
    return prettyPrintTable(cleanTable);
  });

  return results.join("\n\n");
}

// Legacy named exports kept for any direct imports elsewhere
export { processPastedTableHTML as cleanTableHTML };