// Fill engine for the Japanese (ja) product-translation push.
//
// Reads every `fill-ja-data-*.mjs` module next to this file (each default-exports
// a plain object: exact English string -> Japanese string), then walks the already
// extracted `<slug>.ja.packet.json` packets and replaces every prose string that has a
// dictionary entry. Strings with no entry are left as-is (English) and reported, so
// a batch is only "done" when the report is empty.
//
// Same idea as the fill-fi-*.mjs scripts, but generalized: instead of one hand-mapped
// script per templated category, one exact-English-string dictionary shared by the
// whole catalog (the catalog repeats near-verbatim feature bullets, headers, included
// items). Brand/model names that must stay English are mapped to themselves so every
// string is an explicit decision.
//
// Usage (from this directory):
//   node fill-ja-apply.mjs <slugs.txt | slug1,slug2,...>   fill + report missing
//   node fill-ja-apply.mjs --all                             every de packet on disk
//   add --write-nothing to only report
//
// HTML handling: `description` is mostly raw spec-table HTML. Only <th> text (and the
// label cells listed in CELL_LABELS) are translated; <td> data is never touched. Whole-
// string dictionary hits win over segment handling (for the few prose descriptions).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "product-i18n");
// Source packets (pristine, freshly extracted English). Defaults to DATA_DIR, but since a fill
// overwrites the packet, keep a pristine copy elsewhere and point JA_SRC at it to re-run
// the fill after editing the dictionary (idempotent that way).
const SRC_DIR = process.env.JA_SRC || DATA_DIR;

const norm = (s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);

// ── load dictionaries ────────────────────────────────────────────────────
const DICT = new Map();
const CELLS = new Map(); // <td> label cells + <th> segments live in the same files under `__cells`/`__th`
const TH = new Map();
const RULES = [];
// nameTokens: word/phrase -> German, used only for product `name`s built from known tokens
// ("Aries Corner Black NS" -> "Aries Eck Schwarz NS"). Brand words map to themselves; model
// codes (NB, NS, Ni2, W9, V2...) are kept automatically by CODE_TOKEN_RE. An unknown token
// makes the name "missing" so it is hand-mapped in `phrases` instead of guessed.
const TOKENS = new Map();
const CODE_TOKEN_RE = /^(?:[A-Z]{1,2}|Ni2?|[A-Za-z]{0,3}\d[\w.,\-\/]*|–|-|\/|&)$/;
function tokenName(name) {
  const toks = norm(name).split(" ");
  const out = [];
  for (let i = 0; i < toks.length; ) {
    let hit = null;
    for (let n = Math.min(3, toks.length - i); n >= 1; n--) {
      const phrase = toks.slice(i, i + n).join(" ");
      if (TOKENS.has(phrase)) {
        hit = [TOKENS.get(phrase), n];
        break;
      }
    }
    if (!hit && CODE_TOKEN_RE.test(toks[i])) hit = [toks[i], 1];
    if (!hit) return null;
    out.push(hit[0]);
    i += hit[1];
  }
  return out.join(" ");
}
// bySlug: { slug: { "English text node": "German" } } — overrides for context-dependent
// fragments (e.g. the article node "The " before a bolded product name: der/die/das).
const BY_SLUG = new Map();
let CURRENT_SLUG = null;
for (const f of fs.readdirSync(__dirname).filter((n) => /^fill-ja-data-.*\.mjs$/.test(n)).sort()) {
  const mod = (await import(new URL(f, import.meta.url))).default;
  for (const [k, v] of Object.entries(mod.phrases || {})) {
    if (DICT.has(norm(k)) && DICT.get(norm(k)) !== v) console.warn(`  (dup key, later file wins) ${f}: ${k}`);
    DICT.set(norm(k), v);
  }
  for (const [k, v] of Object.entries(mod.th || {})) TH.set(norm(k), v);
  for (const [k, v] of Object.entries(mod.cells || {})) CELLS.set(norm(k), v);
  for (const [slug, m] of Object.entries(mod.bySlug || {})) {
    const nm = {};
    for (const [k, v] of Object.entries(m)) nm[norm(k)] = v;
    BY_SLUG.set(slug, { ...(BY_SLUG.get(slug) || {}), ...nm });
  }
  for (const [k, v] of Object.entries(mod.nameTokens || {})) TOKENS.set(k, v);
  for (const r of mod.rules || []) RULES.push(r); // [regex, (match) => german] for templated strings
}

// ── HTML description translation ─────────────────────────────────────────
function translateDescription(html, missing) {
  const whole = DICT.get(norm(html));
  if (whole !== undefined) return whole;
  let out = "";
  let last = 0;
  const tagRe = /<(\/?)([a-zA-Z0-9]+)[^>]*>/g;
  const stack = [];
  let m;
  const flush = (text) => {
    // text sits between the previous tag and the next
    if (!text.trim()) return text;
    const inTh = stack.includes("th");
    const inTd = stack.includes("td");
    const lead = text.match(/^\s*/)[0];
    const trail = text.match(/\s*$/)[0];
    const core = norm(text);
    if (inTh) {
      const t = TH.get(core);
      if (t !== undefined) return lead + t + trail;
      if (/[A-Za-z]{3,}/.test(core)) missing.add(`th: ${core}`);
      return text;
    }
    if (inTd) {
      const t = CELLS.get(core);
      if (t !== undefined) return lead + t + trail;
      return text; // td data — never translated unless listed
    }
    let t = BY_SLUG.get(CURRENT_SLUG)?.[core] ?? TH.get(core) ?? CELLS.get(core) ?? DICT.get(core);
    // bolded product names inside prose ("Saunova 2.0 Contactor Unit") are built from name tokens
    if (t === undefined && core.length < 60 && !/[.!?]/.test(core)) t = tokenName(core) ?? undefined;
    if (t !== undefined) {
      // "" = a word with no Japanese counterpart (an English article like "The" before a bold name): drop it
      if (t === "") return "";
      // a translation that starts with punctuation or a particle ("は…", "、…", "。…") attaches to the previous
      // node without the English inter-word space
      const l = /^(?:[,.;:!?)\]-]|[、。]|[はがをのにでとも])/.test(t) ? "" : lead;
      return l + t + trail;
    }
    if (/[A-Za-z]{3,}/.test(core)) missing.add(`html-text: ${core}`);
    return text;
  };
  while ((m = tagRe.exec(html))) {
    out += flush(html.slice(last, m.index));
    out += m[0];
    last = m.index + m[0].length;
    const name = m[2].toLowerCase();
    if (m[1]) {
      const i = stack.lastIndexOf(name);
      if (i >= 0) stack.length = i;
    } else if (!/^(br|img|hr|input|meta|link)$/i.test(name) && !m[0].endsWith("/>")) stack.push(name);
  }
  out += flush(html.slice(last));
  return out;
}

// (or a bare model code in parens, e.g. "(R-100)")
const MATERIAL_DONE_RE = /^((シダー|アスペン|ヘムロック|アルダー|パイン|スプルース|バーチ|ブラック|ホワイト|グレー|シルバー|ナチュラル|アルミニウム|ブラックメタル)( \(.+\))?|\([^\s()]+\))$/;

// ── packet walk ──────────────────────────────────────────────────────────
function tr(value, missing, label, { html = false } = {}) {
  if (typeof value !== "string" || !value.trim()) return value;
  if (html && /<[a-z]/i.test(value) && !DICT.has(norm(value))) {
    return translateDescription(value, missing);
  }
  const hit = DICT.get(norm(value));
  if (hit !== undefined) return hit;
  for (const [re, fn] of RULES) {
    const m = norm(value).match(re);
    if (m) return fn(m);
  }
  // already filled by extract via product-i18n.js MATERIAL_WORD_DICTIONARY ("シダー (513-D)")
  if (MATERIAL_DONE_RE.test(norm(value))) return value;
  if (label === "name" || label === "vname") {
    const t = tokenName(value);
    if (t) return t;
  }
  missing.add(`${label}: ${norm(value)}`);
  return value;
}

export function fillPacket(packet) {
  const missing = new Set();
  const F = packet.fields;
  CURRENT_SLUG = packet.slug;
  for (const k of ["name", "type"]) if (k in F) F[k] = tr(F[k], missing, k, {});
  if ("short_description" in F) F.short_description = tr(F.short_description, missing, "short_description", { html: true });
  if ("description" in F && F.description) F.description = tr(F.description, missing, "description", { html: true });
  if (Array.isArray(F.features)) F.features = F.features.map((s, i) => tr(s, missing, `features[${i}]`));
  if (Array.isArray(F.spec_table_headers)) F.spec_table_headers = F.spec_table_headers.map((s, i) => tr(s, missing, `hdr[${i}]`));
  if (Array.isArray(F.variations)) {
    for (const v of F.variations) {
      v.name = tr(v.name, missing, "vname");
      v.description = tr(v.description, missing, "vdesc", { html: true });
      if (Array.isArray(v.features)) v.features = v.features.map((s, i) => tr(s, missing, `vfeat[${i}]`));
      if (Array.isArray(v.spec_table_headers)) v.spec_table_headers = v.spec_table_headers.map((s, i) => tr(s, missing, `vhdr[${i}]`));
    }
  }
  if (Array.isArray(F.included_items)) {
    for (const it of F.included_items) {
      it.title = tr(it.title, missing, "ititle");
      it.note = tr(it.note, missing, "inote");
    }
  }
  return missing;
}

// ── CLI ──────────────────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const dry = args.includes("--write-nothing");
  const arg = args.find((a) => !a.startsWith("--"));
  let slugs;
  if (args.includes("--all")) {
    slugs = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".ja.packet.json")).map((f) => f.replace(".ja.packet.json", ""));
  } else if (arg && fs.existsSync(arg)) {
    slugs = fs.readFileSync(arg, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } else if (arg) {
    slugs = arg.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    console.error("usage: node fill-ja-apply.mjs <slugs.txt|a,b,c|--all> [--write-nothing]");
    process.exit(1);
  }
  const allMissing = new Map();
  let written = 0;
  for (const slug of slugs) {
    const file = path.join(DATA_DIR, `${slug}.ja.packet.json`);
    if (!fs.existsSync(file)) {
      console.error(`no packet: ${slug}`);
      continue;
    }
    const srcFile = path.join(SRC_DIR, `${slug}.ja.packet.json`);
    const packet = JSON.parse(fs.readFileSync(fs.existsSync(srcFile) ? srcFile : file, "utf8"));
    const missing = fillPacket(packet);
    if (!dry) {
      fs.writeFileSync(file, JSON.stringify(packet, null, 2), "utf8");
      written++;
    }
    for (const m of missing) {
      if (!allMissing.has(m)) allMissing.set(m, []);
      allMissing.get(m).push(slug);
    }
  }
  console.log(`${slugs.length} packet(s) processed${dry ? " (dry run)" : `, ${written} written`}; dictionary: ${DICT.size} phrases, ${TH.size} th, ${CELLS.size} cells`);
  console.log(`${allMissing.size} distinct string(s) still without a Japanese entry:`);
  for (const [m, s] of allMissing) console.log(`  [${s.length}x ${s[0]}] ${m}`);
}
