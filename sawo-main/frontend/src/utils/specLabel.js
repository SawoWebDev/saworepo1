// Row labels in a product's spec table ("Size", "Product Code", ...) come
// straight from CMS data and are stored in English in every locale's
// product_translations row too (only the column headers get translated).
// Translate them at render time instead of rewriting the data: DispAccessories
// still matches the raw English "Capacity" label, and any table the CMS adds
// later with a label not listed here just falls through unchanged.
const SPEC_LABEL_KEYS = {
  "Size": "size",
  "Capacity": "capacity",
  "Opening Size": "openingSize",
  "Frame Size": "frameSize",
  "Weight": "weight",
  "Product Code": "productCode",
  "Set Codes": "setCodes",
  "Ducting Hole": "ductingHole",
  "Includes": "includes",
  "Thickness": "thickness",
  "Use": "use",
  "Material": "material",
  "Code": "code",
};

// `t` is useLocaleT("product"); only the first column holds row labels.
export function translateSpecLabel(t, value, colIndex) {
  if (colIndex !== 0 || typeof value !== "string") return value;
  const key = SPEC_LABEL_KEYS[value.trim()];
  return key ? t(`specLabels.${key}`, { defaultValue: value }) : value;
}

// Cells inside a translated description's HTML <table> (product_translations
// keeps values like "Separate" and controls-table row labels in English even
// though the header row is translated). Same reasoning as above: fix at
// render time, exact whole-cell matches only, so model codes / numbers /
// brand names are never touched.
const HTML_CELL_KEYS = {
  "Separate": "separate",
  "Built-in": "builtIn",
  "Max. Session Time": "maxSessionTime",
  "TECHNICAL DETAILS": "technicalDetails",
  "PRODUCT DIMENSIONS": "productDimensions",
  "Switching Capacity per phase": "switchingCapacityPerPhase",
  "Frequency": "frequency",
  "Temperature Range": "temperatureRange",
  "Rated Voltage": "ratedVoltage",
  "Suitable Heaters": "suitableHeaters",
  "Bench Combined Temperature-Humidity Sensor": "benchCombinedSensor",
  "Bench Temperature Sensor": "benchTemperatureSensor",
  "Fan": "fan",
  "Rating": "rating",
};

// `root` is a detached DOM node holding the description HTML.
export function translateHtmlTableCells(root, t) {
  root.querySelectorAll("td, th").forEach(cell => {
    if (cell.children.length) return;
    const key = HTML_CELL_KEYS[cell.textContent.trim()];
    if (key) cell.textContent = t(`tableCells.${key}`, { defaultValue: cell.textContent });
  });
}
