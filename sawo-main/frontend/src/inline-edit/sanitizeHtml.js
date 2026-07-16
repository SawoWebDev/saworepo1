// src/inline-edit/sanitizeHtml.js
// Zero-dependency whitelist HTML sanitizer for rich-text fields (bold/italic/
// links only). Applied both when saving admin edits and when rendering stored
// `_html` values, so a value written any other way (direct SQL, a future
// editor) can't smuggle in a script/onclick. Not a general-purpose sanitizer —
// deliberately narrow to match the small set of formatting this feature needs.

const ALLOWED_TAGS = new Set(["B", "I", "EM", "STRONG", "A", "BR"]);
const ALLOWED_HREF = /^(https?:|mailto:|\/)/i;

function sanitizeInto(sourceNode, targetNode, doc) {
  for (const child of Array.from(sourceNode.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      targetNode.appendChild(doc.createTextNode(child.textContent));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    if (!ALLOWED_TAGS.has(child.tagName)) {
      // Unwrap disallowed elements: keep their sanitized text/children, drop the tag itself.
      sanitizeInto(child, targetNode, doc);
      continue;
    }

    const clean = doc.createElement(child.tagName.toLowerCase());
    if (child.tagName === "A") {
      const href = child.getAttribute("href") || "";
      if (ALLOWED_HREF.test(href)) {
        clean.setAttribute("href", href);
        clean.setAttribute("rel", "noopener noreferrer");
        clean.setAttribute("target", "_blank");
      }
    }
    sanitizeInto(child, clean, doc);
    targetNode.appendChild(clean);
  }
}

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${dirty}</div>`, "text/html");
  const source = doc.body.firstChild;
  const out = doc.createElement("div");
  sanitizeInto(source, out, doc);
  return out.innerHTML;
}
