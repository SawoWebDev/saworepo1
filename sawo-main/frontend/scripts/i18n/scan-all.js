#!/usr/bin/env node
/**
 * scripts/i18n/scan-all.js — ONE-OFF, whole-codebase extraction into a
 * single ENG_translations.json master file. Different from extract.js
 * (which reads already-wired locales/en/<page>.json): this one parses raw
 * JSX source directly via @babel/parser + @babel/traverse, so it works on
 * pages that haven't been wired to t() calls yet. Read-only.
 *
 * Usage: node scripts/i18n/scan-all.js
 * Output: ../ENG_translations.json (repo root, next to frontend/)
 */
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const SRC = path.join(__dirname, "..", "..", "src");
const SCAN_DIRS = ["pages", "components", "layouts"];

// Attributes whose string value is user-facing copy — both real DOM
// attributes (alt, aria-label, placeholder, title) and the custom prop
// names this codebase uses for component-carried copy (text, label,
// heading, subtitle, etc. — same vocabulary as TEXT_FIELDS below, since a
// <Card subtitle="..."/> prop and a { subtitle: "..." } data field mean the
// same thing here).
const TEXT_ATTRS = new Set([
  "alt", "aria-label", "aria-description", "aria-valuetext", "placeholder", "title",
  "text", "label", "heading", "subheading", "subtitle", "caption", "description",
  "buttonText", "ctaText", "linkText", "errorText", "helperText", "tooltip",
]);
// Object-literal field names worth pulling out of data arrays like
// CAROUSEL_ITEMS = [{ title: "...", caption: "..." }, ...].
const TEXT_FIELDS = new Set([
  "title", "caption", "desc", "description", "label", "heading", "subheading",
  "subtitle", "text", "name", "body", "body1", "body2", "question", "answer",
  "quote", "tagline", "alt", "intro", "note", "message", "buttonText", "ctaText",
  "linkText", "errorText", "helperText", "tooltip", "placeholder",
]);
// Never treat these as copy even if string-valued. "name" is deliberately
// excluded from extraction (despite being in TEXT_FIELDS above) because in
// this codebase it's ambiguous — sometimes real copy, often a product/brand
// name or a form field's technical name — safer to leave it out than
// silently extract non-copy data as if it were translatable.
const NEVER_FIELDS = new Set([
  "href", "src", "icon", "key", "id", "path", "slug", "color", "img", "className",
  "group", "type", "code", "value", "name", "images", "image", "urls", "url",
  "thumbnail", "thumbnails", "sizes", "width", "height", "model", "modelCode",
  "sku", "productCode",
]);
// Function-call names whose string argument is user-facing copy — form
// validation/error messages, toasts, confirmations — none of which live in
// JSX at all, so the JSX-focused visitors above never see them.
const MESSAGE_CALL_PATTERN = /^(set\w*(Error|Errors|Message|Status|Success|Warning|Notice|Toast)\w*|show\w*Toast\w*|toast\w*|alert|confirm)$/i;
// A string-literal assignment/return "looks like a sentence" (see
// AssignmentExpression/ReturnStatement below) whenever it has a space and
// enough length — but CSS values assigned to style/animation variables
// (`el.style.transform = "translateY(-50%) scale(1.15)"`) satisfy that same
// shape. Reject anything that's actually CSS syntax before accepting it as
// a message.
const CSS_VALUE_PATTERN = /^(-?\d+(\.\d+)?(px|rem|em|%|vh|vw|s|ms)\b|rgba?\(|hsla?\(|#[0-9a-f]{3,8}\b|(translate|scale|rotate|skew|matrix)[XYZ]?\(|\d+px\s+(solid|dashed|dotted|none)\b)/i;
function looksLikeCssValue(val) {
  if (CSS_VALUE_PATTERN.test(val)) return true;
  // Multiple space-separated CSS-function/unit tokens in one string, e.g.
  // "0 14px 36px rgba(175,133,100,0.18)" or "2px solid #a67853".
  const tokens = val.split(/\s+/);
  const cssish = tokens.filter((t) => /^(-?\d+(\.\d+)?(px|rem|em|%)?|rgba?\([^)]*\)?|#[0-9a-f]{3,8}|solid|dashed|dotted|none|translateX?\(.*|translateY?\(.*|scale\(.*)$/i.test(t));
  return tokens.length > 1 && cssish.length === tokens.length;
}
// Top-level const names that hold internal product-matching/classification
// data (substring keyword lists like `{ "Taurus D Combi": ["Taurus D
// Combi", "TRDC-NS"] }` used with .includes()-style matching against real
// product names/model codes), not display copy — the whole variable is
// skipped, not descended into at all. Swapping these for translated text
// while the underlying product data stays in English would silently break
// the matching logic (category pages would just come up empty), which is a
// functional bug, not a translation-quality one — excluded categorically,
// not filtered leaf-by-leaf like TEXT_FIELDS/NEVER_FIELDS below.
const MATCHING_DATA_VAR_PATTERN = /_KEYWORDS$|^FIXED_ORDER$|_ORDER$/;
// Known brand/product/series names — exact-match strings routed to
// doNotTranslate instead of being extracted as copy.
const BRAND_NAMES = new Set([
  "SAWO", "Kivistone", "Dragonfire", "Saunova", "Innova", "Tower", "Stone", "Combi",
  "Floor", "Wall-Mounted", "Wall Mounted", "Tower Series", "Stone Series", "Combi Series",
  "Floor Series", "Wall-Mounted Series", "Wall Mounted Series", "Dragonfire Series",
  "Saunova Series", "Innova Series", "Saunova 2.0",
]);

function slug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .split("_")
    .filter(Boolean)
    .slice(0, 6)
    .join("_") || "text";
}

function cleanText(raw) {
  return raw.replace(/\s+/g, " ").trim();
}

// Inline formatting tags (<b>, <strong>, <a>, etc.) split a JSX text node's
// surrounding sentence into disconnected siblings — e.g. "fusing the two
// words " + <b>Sa</b> + "una and " + <b>Wo</b> + "rld. It accurately
// reflects..." (a wordplay on SAWO/World in About.jsx). Each fragment is
// real, verbatim source text, but translating "rld. It accurately
// reflects..." in isolation would be nonsense — flag rather than present as
// normal standalone copy. Heuristic: starts with a lowercase letter, or
// starts with punctuation (a leftover ". " from the previous sibling).
function looksLikeMidSentenceFragment(val) {
  return /^[a-z]/.test(val) || /^[.,;:'")\]]/.test(val);
}

function fileToPageSlug(relPath) {
  // pages/Sauna/heaters/Tower.jsx -> saunaHeatersTower
  // pages/Sauna/Sauna.jsx -> sauna
  // components/Header/Header.jsx -> header (shared)
  const parts = relPath.replace(/\.jsx$/, "").split(/[\\/]/);
  const top = parts[0]; // pages | components | layouts
  const rest = parts.slice(1);
  // Drop a trailing segment that duplicates its parent dir name (Sauna/Sauna.jsx -> Sauna)
  if (rest.length > 1 && rest[rest.length - 1].toLowerCase() === rest[rest.length - 2].toLowerCase()) {
    rest.pop();
  }
  const camel = rest
    .map((seg, i) => (i === 0 ? seg[0].toLowerCase() + seg.slice(1) : seg[0].toUpperCase() + seg.slice(1)))
    .join("");
  return { top, key: camel || rest.join("") };
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.name.endsWith(".jsx")) out.push(full);
  }
  return out;
}

// Deliberately StringLiteral only — NOT TemplateLiteral. Every
// TemplateLiteral in this codebase's JSX is either a <style>{`...`}</style>
// CSS-in-JS block or a genuinely dynamic string (interpolated values),
// neither of which is static translatable copy.
function isStringLiteralish(node) {
  return !!node && node.type === "StringLiteral";
}
function literalValue(node) {
  return node.type === "StringLiteral" ? node.value : null;
}
function isInsideStyleOrScript(p) {
  const jsxEl = p.findParent((path) => path.isJSXElement());
  if (!jsxEl) return false;
  const opening = jsxEl.node.openingElement;
  const name = opening && opening.name && opening.name.name;
  return name === "style" || name === "script";
}

function extractFile(absPath, relPath) {
  const code = fs.readFileSync(absPath, "utf8");
  let ast;
  try {
    ast = parser.parse(code, { sourceType: "module", plugins: ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator"] });
  } catch (err) {
    return { entries: [], errors: [{ file: relPath, error: err.message }] };
  }

  const entries = []; // { value, keyParts: [...], line }
  const seenVarNames = new Set();

  traverse(ast, {
    JSXText(p) {
      if (isInsideStyleOrScript(p)) return;
      const val = cleanText(p.node.value);
      if (!val) return;
      if (/^[\d\s.,:/%-]*$/.test(val)) return; // pure numbers/punctuation, not copy
      entries.push({
        value: val, keyParts: ["copy", slug(val)], line: p.node.loc?.start.line, kind: "jsxText",
        fragment: looksLikeMidSentenceFragment(val),
      });
    },
    JSXExpressionContainer(p) {
      if (isInsideStyleOrScript(p)) return;
      // JSXExpressionContainer is the AST node for BOTH `{expr}` as JSX
      // children (real visible text) AND `attr={expr}` attribute values
      // (routing fallbacks like `to={item.path || "#"}`, style values,
      // etc.) — without this guard, a literal used only as a non-text
      // attribute's fallback (e.g. that bare "#" href placeholder) gets
      // misread as visible copy. Only scan the JSX-children case here;
      // attribute values are handled separately by JSXAttribute below,
      // which already has its own TEXT_ATTRS allowlist.
      if (p.parentPath && p.parentPath.isJSXAttribute()) return;
      // Both branches of {cond ? "Yes" : "No"} and either side of
      // {cond && "text"} / {cond || "text"} are real, reachable copy — not
      // just the bare {"literal"} case.
      const literalsIn = (node) => {
        if (!node) return [];
        if (node.type === "StringLiteral") return [node];
        if (node.type === "ConditionalExpression") return [...literalsIn(node.consequent), ...literalsIn(node.alternate)];
        if (node.type === "LogicalExpression") return [...literalsIn(node.left), ...literalsIn(node.right)];
        return [];
      };
      for (const lit of literalsIn(p.node.expression)) {
        const val = cleanText(lit.value);
        if (!val) continue;
        entries.push({ value: val, keyParts: ["copy", slug(val)], line: p.node.loc?.start.line, kind: "jsxExpr" });
      }
    },
    JSXAttribute(p) {
      if (isInsideStyleOrScript(p)) return;
      const name = p.node.name.name;
      if (typeof name !== "string") return;

      // <SEO title="..." description="..."> is this page's own meta —
      // route to meta.title/meta.description (matches the convention
      // already used in locales/en/{home,sauna}.json) instead of the
      // generic attr bucket below.
      const opening = p.parentPath && p.parentPath.node; // JSXOpeningElement
      const elName = opening && opening.name && opening.name.name;
      const isSeoMeta = elName === "SEO" && (name === "title" || name === "description");

      if (!isSeoMeta && !TEXT_ATTRS.has(name)) return;
      const valNode = p.node.value;
      let raw = null;
      if (valNode && valNode.type === "StringLiteral") raw = valNode.value;
      else if (valNode && valNode.type === "JSXExpressionContainer" && isStringLiteralish(valNode.expression)) raw = literalValue(valNode.expression);
      if (raw == null) return;
      const val = cleanText(raw);
      if (!val) return;
      if (isSeoMeta) {
        entries.push({ value: val, keyParts: ["meta", name], line: p.node.loc?.start.line, kind: "seoMeta" });
      } else {
        entries.push({ value: val, keyParts: [name, slug(val)], line: p.node.loc?.start.line, kind: `attr:${name}` });
      }
    },
    CallExpression(p) {
      const callee = p.node.callee;
      const calleeName = callee.type === "Identifier" ? callee.name : callee.type === "MemberExpression" && callee.property.type === "Identifier" ? callee.property.name : null;
      if (!calleeName || !MESSAGE_CALL_PATTERN.test(calleeName)) return;
      for (const arg of p.node.arguments) {
        if (!isStringLiteralish(arg)) continue;
        const val = cleanText(literalValue(arg));
        if (!val || val.length < 3 || looksLikeCssValue(val)) continue;
        entries.push({ value: val, keyParts: ["messages", slug(val)], line: p.node.loc?.start.line, kind: `call:${calleeName}` });
      }
    },
    // Validation/error messages in this codebase are commonly built as
    // plain property assignment (e.g. `e.fname = "This field is required"`
    // in a hand-rolled form validator), not passed to a named function —
    // the CallExpression visitor above never sees them. Heuristic: any
    // string-literal assignment/return that "looks like a sentence" (has a
    // space, isn't a single config token) is almost certainly copy.
    AssignmentExpression(p) {
      if (!isStringLiteralish(p.node.right)) return;
      const val = cleanText(literalValue(p.node.right));
      if (!val || !val.includes(" ") || val.length < 8 || looksLikeCssValue(val)) return;
      entries.push({ value: val, keyParts: ["messages", slug(val)], line: p.node.loc?.start.line, kind: "assign" });
    },
    ReturnStatement(p) {
      if (!isStringLiteralish(p.node.argument)) return;
      const val = cleanText(literalValue(p.node.argument));
      if (!val || !val.includes(" ") || val.length < 8 || looksLikeCssValue(val)) return;
      entries.push({ value: val, keyParts: ["messages", slug(val)], line: p.node.loc?.start.line, kind: "return" });
    },
    VariableDeclarator(p) {
      if (!p.node.init || (p.node.init.type !== "ArrayExpression" && p.node.init.type !== "ObjectExpression")) return;
      const varName = p.node.id.name;
      if (!varName || seenVarNames.has(varName)) return;
      seenVarNames.add(varName);
      // Internal product-matching/classification data (GROUP_KEYWORDS,
      // FIXED_ORDER, etc.) — see MATCHING_DATA_VAR_PATTERN's comment.
      // Skipped entirely, not descended into.
      if (MATCHING_DATA_VAR_PATTERN.test(varName)) return;

      // Recursive: data arrays in this codebase nest arbitrarily deep —
      // FAQ.jsx's SECTIONS = [{ title, questions: [{ question, answer }] }],
      // PrivacyPolicy.jsx's SECTIONS = [{ title, content: ["...", "..."],
      // bullets: ["...", "..."], subsections: [{ subtitle, content: [...] }] }].
      // Walking only one level, or only handling arrays-of-objects, misses
      // both of those. keyPath mirrors the actual JS structure (varName.
      // index.fieldName.index...), always traceable back to source.
      const walk = (node, keyPath) => {
        if (!node) return;
        if (node.type === "ArrayExpression") {
          node.elements.forEach((el, i) => walk(el, [...keyPath, String(i)]));
          return;
        }
        if (node.type === "ObjectExpression") {
          for (const prop of node.properties) {
            if (prop.type !== "ObjectProperty") continue;
            const fieldName = prop.key && (prop.key.name || prop.key.value);
            if (!fieldName || NEVER_FIELDS.has(fieldName)) continue; // e.g. don't descend into images:[...url...]
            walk(prop.value, [...keyPath, fieldName]);
          }
          return;
        }
        if (isStringLiteralish(node)) {
          const lastKey = keyPath[keyPath.length - 1];
          // A numeric last segment means this literal is a bare array
          // element (e.g. content: ["...", "..."]), not itself a named
          // field — accept it unconditionally, since it only exists
          // because SOME enclosing field name already opted in. A
          // non-numeric last segment means it IS a field name — apply the
          // same TEXT_FIELDS/NEVER_FIELDS filter as before.
          const isArrayIndex = /^\d+$/.test(lastKey);
          if (!isArrayIndex && (!TEXT_FIELDS.has(lastKey) || NEVER_FIELDS.has(lastKey))) return;
          const val = cleanText(literalValue(node) || "");
          if (!val) return;
          entries.push({ value: val, keyParts: keyPath, line: node.loc?.start.line, kind: `field:${keyPath.join(".")}` });
        }
      };

      walk(p.node.init, [varName]);
    },
  });

  return { entries, errors: [] };
}

function main() {
  const allFiles = [];
  for (const d of SCAN_DIRS) {
    const abs = path.join(SRC, d);
    if (fs.existsSync(abs)) allFiles.push(...walkFiles(abs));
  }

  const result = { pages: {}, doNotTranslate: new Set(), needsReview: [], stats: { files: 0, strings: 0 } };
  const parseErrors = [];

  for (const abs of allFiles) {
    const relPath = path.relative(SRC, abs).replace(/\\/g, "/");
    const { top, key } = fileToPageSlug(relPath);
    const bucket = top === "pages" ? "pages" : "shared";
    result.stats.files++;

    const { entries, errors } = extractFile(abs, relPath);
    parseErrors.push(...errors);

    if (!result.pages[bucket]) result.pages[bucket] = {};
    if (!result.pages[bucket][key]) result.pages[bucket][key] = {};
    const target = result.pages[bucket][key];

    for (const e of entries) {
      if (BRAND_NAMES.has(e.value)) {
        result.doNotTranslate.add(e.value);
        continue;
      }
      if (e.value.length <= 1 || /^[A-Z0-9_-]{2,}$/.test(e.value) && e.value === e.value.toUpperCase() && e.value.split(" ").length === 1 && e.value.length < 6) {
        result.needsReview.push({ value: e.value, file: relPath, line: e.line, reason: "short/code-like token, unclear if copy" });
        continue;
      }
      if (e.fragment) {
        result.needsReview.push({
          value: e.value, file: relPath, line: e.line,
          reason: "likely a mid-sentence fragment — inline JSX formatting (e.g. <b>/<strong>) probably split a full sentence into disconnected pieces; open the file at this line and translate the WHOLE sentence in context, not this fragment alone",
        });
        continue;
      }
      // Build nested key path under target
      let node = target;
      const parts = e.keyParts;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (!node[k] || typeof node[k] !== "object") node[k] = {};
        node = node[k];
      }
      const leafKey = parts[parts.length - 1];
      if (node[leafKey] !== undefined && node[leafKey] !== e.value) {
        // Key collision with a different value — disambiguate.
        let n = 2;
        while (node[`${leafKey}_${n}`] !== undefined) n++;
        node[`${leafKey}_${n}`] = e.value;
      } else {
        node[leafKey] = e.value;
      }
      result.stats.strings++;
    }
  }

  result.doNotTranslate = [...result.doNotTranslate].sort();

  const outFile = path.join(__dirname, "..", "..", "..", "ENG_translations_RAW.json");
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");
  console.log(`scan-all: ${result.stats.files} files, ${result.stats.strings} strings, ${result.needsReview.length} needsReview, ${result.doNotTranslate.length} doNotTranslate`);
  if (parseErrors.length) {
    console.log(`${parseErrors.length} file(s) failed to parse:`);
    parseErrors.forEach((e) => console.log(`  ${e.file}: ${e.error}`));
  }
  console.log(`-> ${outFile}`);
}

main();
