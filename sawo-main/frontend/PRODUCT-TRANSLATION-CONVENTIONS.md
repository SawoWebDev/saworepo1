# Product translation conventions (zh + fi)

Rules established while translating `product_translations` content into
Chinese (`zh`, complete site-wide as of 2026-09-03) and Finnish (`fi`,
in progress) across the Sauna Heaters batch and the site-wide
all-products push (see `I18N-CHECKLIST.md`'s "Product content" section
for the full narrative log). Read this before translating any new batch
of products — it exists so every session/agent makes the same calls
instead of re-deriving them, and so a spot-check across categories finds
consistent output. Most of the rules below were written during the zh
push and apply verbatim to `fi` too (prose-vs-data split, templated-
category fill-script pattern, source-bug-fixing rule) — locale-specific
notes are called out explicitly.

## Tooling

`src/Administrator/Local/scripts/product-i18n.js` — run from that
directory (needs `.env`/`.env.local` for Supabase creds, resolved
relative to the script).

```
node product-i18n.js pending <locale> [category]        # list slugs missing that locale
node product-i18n.js extract-many <locale> <slugs|->     # comma-separated, or - for stdin
#   ...hand-edit the written packets in Administrator/Local/data/product-i18n/...
node product-i18n.js apply-many <locale> <slugs|->        # same slug syntax

# single-product equivalents still work:
node product-i18n.js extract <slug> [locale]
node product-i18n.js apply <slug> <locale>
```

Typical batch:
```
node product-i18n.js pending zh "Doors & Handles" > /tmp/slugs.txt
tail -n +2 /tmp/slugs.txt | node product-i18n.js extract-many zh -
# translate the packets
tail -n +2 /tmp/slugs.txt | node product-i18n.js apply-many zh -
```

**Always run `pending` first, right before extracting** — don't reuse a
slug list from an earlier session/turn. Another batch (or another
parallel agent) may have already covered some of it.

`pending` only catches products with **no** translation row at all. It
misses a row that exists but has gone stale because the English source
changed after translation. Run
`node check-translation-staleness.mjs <locale>` (defaults to `zh`) for
that — it compares each product's live source hash against the
`source_field_hashes` stored on its row and reports both missing and
stale slugs (with the exact field paths that drifted). Worth running
before declaring any locale's push "done," and worth re-running later
if the English catalog keeps getting edited (found and fixed 3 stale
products on both `zh` and `fi` this way on 2026-09-04 — see
`I18N-CHECKLIST.md`'s "zh completeness audit" entry).

### Translation memory does a lot of the work automatically

`extract` looks up every prose string in `translation_memory` first
(exact match on trimmed/whitespace-collapsed text) — identical phrases
across products/categories come back pre-filled (`tmPrefilled` in the
packet), already correct, worth a quick sanity read but not a fresh
translation. `apply` writes every new (English, translated) pair back
into `translation_memory`, so it compounds — the more you translate, the
more the next batch pre-fills.

### Material/color variation names auto-fill too

Variation names are almost always `"<Material/Color> (<model code>)"`
(e.g. `"Cedar (513-D)"`) — the code is unique per product so TM's exact
match can never hit the *whole* string, even though "Cedar" repeats
constantly. `product-i18n.js` has a `MATERIAL_WORD_DICTIONARY` (zh) that
auto-translates just the word and leaves the code untouched —
`tmPrefilled` entries with `"via": "material-dictionary"` are these.
Current dictionary — zh: Cedar 雪松, Aspen 白杨, Hemlock 铁杉, Alder 桤木, Pine
松木, Spruce 云杉, Birch 桦木, Black 黑色, White 白色, Grey/Gray 灰色,
Silver 银色, Natural 原木色, Aluminum 铝合金, "Black Metal" 黑色金属.
fi (added 2026-09-03 for the fi push): Cedar Setri, Aspen Haapa, Hemlock
Hemlokki, Alder Leppä, Pine Mänty, Spruce Kuusi, Birch Koivu, Black
Musta, White Valkoinen, Grey/Gray Harmaa, Silver Hopea, Natural
Luonnonvärinen, Aluminum Alumiini, "Black Metal" Musta metalli.
**If you hit a material/color word not in
this list (either locale), add it to the dictionary in `product-i18n.js`
(search `MATERIAL_WORD_DICTIONARY`) instead of only hand-translating
that one packet** — it should get an entry so every future product
benefits.

## Naming conventions (what stays English vs. gets translated)

- **Heater brand/model names stay in English.** Cumulus, Nimbus, Aries,
  Nordex, SAWO30, Tower, Krios, Phoenix, Fiberjungle, Heaterking,
  Scandia, Scandifire, Mini, Mini X, Minidragon, Helius, Savonia,
  Taurus — these are marketing names, never translated. Only a
  descriptive suffix after the brand gets translated, e.g. "Aries
  Corner" → "Aries 转角式". `type` mirrors this — kept as the bare brand
  name (e.g. `"Cumulus"`, `"Nordex S"`), not translated.
- **Control-system product-line names stay English**: Innova, Saunova,
  SAWO Sense. Each is a standalone control-line name (like a heater
  brand), not a descriptive word — SAWO Sense in particular is its own
  single-SKU smart-control product, not a modifier on Innova/Saunova.
- **Other Finnish/marketing product-line names also stay English**:
  Halu, Loisto, Kanto, Puro, Usva, Siro, Steamshot, Steamwater, Lovi,
  Dragon, Signature (Dragonfire Series line names). Same treatment as
  heater brands — only the surrounding descriptive noun translates
  (e.g. "Halu Anti-theft Headrest" → "Halu 防盗头枕", "Stainless Steel
  Ladle Siro 46.5cm" → "Siro 不锈钢桑拿勺 46.5cm").
- **Purely generic/descriptive product names translate in full.**
  "Aroma Pump" → "香薰泵", "Wooden Backrest" → "木质靠背", "Wave Wooden
  Headrest" → "波浪形木质头枕". If there's no brand/line word in the
  name, there's nothing to preserve.
- **Model/version codes stay English**: NB, NS, Ni, Ni2, S, D, W2–W12,
  2.0, PLUS, STE, STN, RJ12, X.
- **"löyly"** (the Finnish word for sauna steam / the act of pouring
  water on hot stones) is kept untranslated in every ladle/pail
  short_description, matching how the English source itself treats it
  (no established Chinese equivalent exists in the site's copy — don't
  invent one).
- **`fi` equivalents of the position words in the zh table below**
  (confirmed via the already-applied `Kiuassuoja – <Brand> <Position>`
  rows, 2026-09-04): Corner → Kulma, Wall → Seinä, Round → Pyöreä.

### Descriptive words attached to a brand name DO get translated

This is the mistake found and fixed catalog-wide on 2026-09-04 (a
post-translation audit pass, after the site-wide `zh` push above was
already believed complete) — a brand/model word being kept English does
**not** mean every word next to it is also protected. Position,
color/finish, and plain feature nouns are ordinary translatable prose
even when they sit right next to "Nordex" or "Innova." Confirmed/fixed
words, safe to reuse verbatim:

| English (attached to a brand) | 中文 |
|---|---|
| Corner | 转角式 |
| Round | 圆柱式 |
| Wall | 壁挂式 |
| Middle | 居中式 |
| Floor | 落地式 |
| Black | 黑色 |
| Red | 红色 |
| Fibercoated / Fiber Coated | 纤维涂层 |
| Contactor Unit | 接触器组件 |
| Power Controller | 电源控制器 |
| Built-In | 内置版 |
| Stainless Steel Touch | 不锈钢触控款 |
| Simple | 简易款 |
| Tank | 水箱 |
| Steam (as in "Steam 2.0", "Steam STE") | 蒸汽 |
| Classic (as in "Innova Classic") | 经典款 |

Note "Steam 2.0" is the one entry here that reverses earlier guidance
in this file (a previous version of this doc listed "Steam 2.0" /
"Infrared 2.0" together as English-only model designations) —
"Infrared 2.0" is correct to keep English (no sibling product
translates "Infrared"), but "Steam" turned out to already be
translated on several sibling products (`steam-head` → 蒸汽头,
`steam-door` → 蒸汽门, `steam-stainless-touch-control` →
蒸汽不锈钢触控控制器) before "Steam 2.0"/"Steam STE" were fixed to
match. This is exactly why the precedent-check below matters more than
pattern-matching against this table alone — the table is a snapshot of
what's been *checked*, not a rule that any given English word is safe
by default.

### How to tell the difference when unsure

Don't guess from spelling or from how a similar-looking case was
handled elsewhere — **check whether the same word is already
translated for a sibling product in this catalog** before deciding.
This resolved every ambiguous case in the 2026-09-04 audit (the
`Classic` call was made only after finding `wooden-pail-classic` →
`经典木质水桶` already in the DB; the `Steam` call only after finding
`steam-head`/`steam-door` already translated). Quick check:

```sql
select pt.name from product_translations pt
where pt.locale = 'zh' and (pt.name ilike '%<word>%' or pt.name ilike '%<中文候选>%');
```

If the word shows up translated elsewhere with no exception noted, the
new product should match. If it shows up consistently English
elsewhere (e.g. "Combi", "Pro", brand names), it's a real model/brand
term — leave it.

### Full-catalog audit sweep — run this before declaring a locale "done"

A word-frequency sweep across every translated `name` catches anything
a per-batch review missed (this single query found the `Floor` miss
above, after the Corner/Round/Wall/Middle/Black/Red/Steam/Classic
misses had already been individually reported and fixed):

```sql
select word, count(*) c
from (
  select unnest(regexp_matches(name, '[A-Za-z][A-Za-z.]*', 'g')) as word
  from product_translations
  where locale = '<locale>'
) s
group by word
order by word;
```

Read the output token by token: anything not in this file's known
brand/model/code lists is a candidate miss — check it against the
sibling-product precedent method above, not by assumption, before
fixing it. Re-run per locale (this exact sweep has only been run for
`zh`, as of 2026-09-04 — run it for `fi` too once the `fi` push
reaches the same products, since `fi` inherited the same "Steam 2.0" /
"Innova Classic" / heater-guard position-word names and likely has the
identical gaps).

## Prose vs. data — what never gets translated

Never translate: image URLs, slugs, model codes (`STN-45-C1/3`,
`NIM-90NS-P`), physical dimensions, weights, kW numbers, the `Control`
column's mode names (`Built-in (8+4h)`, `Separate`), spec-table **row**
data of any kind. Only `<th>` header text / `spec_table_headers` /
prose fields (name, short_description, description's own prose,
features, variation names/descriptions/features, included-item
title/note) are prose. This is enforced structurally by
`product-i18n.js` — spec-table rows are never even included in the
packet — but when translating raw HTML `description` tables by hand,
translate `<th>` cells only and leave every `<td>` untouched.

Common header translations (reuse these exact strings for consistency —
they're also already in `translation_memory` from earlier batches, so
`extract` should pre-fill them on sight):

| English | 中文 |
|---|---|
| Heater Model | 加热器型号 |
| kW | kW (unchanged) |
| Sauna Room / min. (m³) max. | 桑拿房 / 最小 (m³) 最大 |
| Size of Heater (mm) / Length Width Height | 加热器尺寸 (mm) / 长 宽 高 |
| Stones (kg) | 桑拿石 (kg) |
| Control | 控制方式 |
| Minimum Safety Distances | 最小安全距离 |
| Specification | 规格 |
| Detail | 详情 |
| Code | 型号 |
| Size | 尺寸 |
| Use | 用途 |

Common feature-bullet patterns (zh):
- "Power range: X – Y kW" → "功率范围：X – Y kW" (note the space before
  `kW` even if the English source is missing it — this was a catalog-wide
  formatting fix, see `I18N-CHECKLIST.md`'s 2026-09-01 entry — and use
  the full-width `：` colon)
- "Available controls: X" → "可选控制方式：X"
- "Stainless-steel casing" / "Stainless steel casing" → "不锈钢外壳"
- "Built-in aroma cup(s)" → "内置香薰杯"
- "Adjustable legs" → "可调节支脚"
- "Automatic shut-off in case of overheating" → "过热自动关闭保护"

Common feature-bullet patterns (fi) — confirmed against `cumulus-nb`'s
already-applied `fi` row (from the original heaters pilot) rather than
invented fresh, so these are the actual established site phrasing, not
a guess:
- "Power range: X – Y kW" → "Tehoalue: X – Y kW" (kept the PERIOD
  decimal separator from the English source, not the Finnish-typical
  comma — this catalog keeps every spec number exactly as printed in
  English throughout, per the "don't reformat data" rule below; only
  the label word is translated)
- "Available controls: X" → "Saatavilla oleva ohjaus: X"
- "Stainless-steel casing" / "Stainless steel casing" → "Ruostumaton
  teräskuori"
- "Built-in aroma cup(s)" → "Sisäänrakennettu aromikuppi" (singular
  source) / "Sisäänrakennetut aromikupit" (plural source)
- spec-table 2-column header pair `["Specification", "Detail"]` →
  `["Ominaisuus", "Tiedot"]`

Heater spec-table header translations (fi) — confirmed against an
already-applied `fi` row (`cumulus-nb`) rather than guessed:

| English | Finnish |
|---|---|
| Heater Model | Lämmitinmalli |
| Sauna Room / min. (m³) max. | Saunahuone / min. (m³) maks. |
| Size of Heater (mm) / Length Width Height | Lämmittimen koko (mm) / Pituus Leveys Korkeus |
| Stones (kg) | Kivet (kg) |
| Control | Ohjaus |
| Minimum Safety Distances | Vähimmäisturvaetäisyydet |

## Category `type` field translations seen so far

Sauna Stones → 桑拿石, Ladles → 桑拿勺, Pails → 水桶, Clocks & Timers →
时钟与计时器, Headrest & Backrest → 头枕与靠背, Wooden Floor Mats → 木质地垫,
Accessory Sets → 配件套装, Cloth Hangers → 衣物挂架, Infrared Accessories
→ 红外线配件, Infrared Controls → 红外线控制器, Spare Parts → 备件,
Thermometers → 温度计 (used for hygrometer variants too — the individual
product `name`/`short_description` already says "温湿度计" where relevant,
the category `type` field stays the shorter 温度计), Benches → 长椅,
Doors & Handles → 门与拉手. If you hit a category not listed here,
translate it once and add it to this table.

`fi` category `type` field translations seen so far (each confirmed via
a live `product_translations` query, not guessed): Heater Guard →
Kiuassuoja (found already established in `translation_memory` from
`"Optional heater guard"` → `"Valinnainen kiuassuoja"` before the fi
Heater Guard batch started — worth checking `translation_memory` for an
existing `type` translation before coining one, the same way this was
found), Headrest & Backrest → Niskatuet ja selkänojat, Clocks & Timers →
Kellot ja ajastimet, Infrared Controls → Infrapunaohjaimet, Infrared
Accessories → Infrapunatarvikkeet, Ladles → Kauhat, Benches → Penkit,
Sauna Lights → Saunavalaisimet, Thermometers → Lämpömittarit, Safety
Switch → Turvakytkin, Heater Hood → Kiuaskupu (`helius-heater-hood`'s
live row — a single-product "category"), Ventilation & Miscellaneous →
Ilmanvaihto ja sekalaiset, Kivistone → Kivistone (kept untranslated,
same brand-name treatment as the `zh` row), Doors & Handles → Ovet ja
kahvat (coined 2026-09-04, matches the `doorsHandlesPage` hero copy
already established in `sauna.json`), Integration Collar → Kiuaskaulus
(coined 2026-09-04, modeled on the Heater Guard/Kiuassuoja compounding
style — `kiuas`+noun, and the same "keep `type` as the bare translated
term" convention — 0 `fi` rows existed for this category before that
batch), Pails → Pails (kept literal English per every existing `fi`
Pails row in `product_translations`, not translated — confirmed, not an
oversight). If you hit an `fi` category not listed here, check
`translation_memory` and live `product_translations` for an existing
translation before coining one, then add it to this list.

`fi` Doors & Handles sauna-door vocabulary (coined 2026-09-07 completing
the category's `fi` coverage — no prior `fi` full-door precedent existed,
only the door-*handle* products done 2026-09-04): "sauna door" →
"saunan ovi", "opening" → "aukko", "frame" → "karmi", "reversible for
left- or right-hand installation" → "kääntyvä, sopii sekä vasen- että
oikeakätiseen asennukseen", "clear glass sauna door" / "bronze glass
sauna door" → "kirkaslasinen saunan ovi" / "pronssilasinen saunan ovi"
(compound adjective), "fitted with a clear/bronze glass window" →
"jossa on kirkas/pronssinvärinen lasi-ikkuna" (used on solid-wood doors
that merely have a window, as opposed to all-glass doors). Reuses the
door-handle batch's comma-suffix pattern for descriptive variants (e.g.
"Puinen raidallinen saunan ovi, leveä" for a "Wide" striped-door
variant, same style as "Puinen ovenkahva, iso pyöreä").

`fi` Integration Collar material label "(Wooden)" → "(Puu)" (coined
2026-09-07; "(Stainless)" → "(Ruostumaton teräs)" was already
established 2026-09-04).

## Templated micro-categories — write a fill script, don't hand-edit JSON

Some categories are one product family repeated with only dimensions/
model codes changing (Thermometers' 13 shape names × hygrometer-or-not,
Benches' Siro/standard/2-step variants, Doors & Handles' glass-type ×
reversible × handle-style combinations). For these, don't open and edit
each `.zh.packet.json` by hand — write a short one-off Node script (see
the pattern used 2026-09-02 for exactly these three categories, described
in `I18N-CHECKLIST.md`) that:
1. Hand-maps each slug's English `name` to its Chinese translation (a
   plain object literal — safer than regex-parsing the name itself,
   since word order varies enough that parsing mistakes are easy to
   introduce and hard to spot).
2. Derives the `short_description` from the **English short_description
   text** via a small set of regex extracts (dimensions, opening/frame
   sizes, reversible/fitted-with-window/striped flags) feeding a
   category-specific template string — not from the name, which is
   lossier.
3. Loops every slug, writes the updated packet JSON back with
   `fs.writeFileSync`, then hand-verify 3-4 packets read naturally
   before running `apply-many` on the whole batch.
This turns a 26-product category into ~10 minutes of scripting instead
of 26 rounds of read-JSON/hand-type-Chinese/write-JSON.

## Source content bugs

If you find a broken/garbled English sentence or a template artifact
(e.g. `nimbus-combi-ns` had a literal `"kW$1"` in its table headers,
`cumulus-*` had a dangling "It comes The soapstone..." clause — both
fixed 2026-09-02) while translating a product: **translate the intended
meaning coherently, don't preserve the break.** Then decide whether it's
worth fixing in the English source directly (usually yes, for anything
"$"-artifact or dangling-clause shaped, since it's a genuine content
bug, not a stylistic choice) — if you fix the English source after
already translating, **re-run `apply` for every locale that product
already has**, even with no packet changes, so `source_field_hashes`
gets refreshed against the corrected source. Otherwise `/admin/translations`
will falsely flag an already-correct translation as stale.

The one case that's the opposite — a typo that's part of an established
side-by-side pair (`venturi-pipe-straight`/`venturi-pipe-l-shape` share
the "hizzing" typo for "hissing") — was deliberately preserved rather
than silently corrected, per "translate what's there." Use judgment:
isolated garbled grammar (dangling clauses, template leakage) → fix the
intent; a spelling variant that reads as an actual (if wrong) word and
matches its sibling product → preserve it, flag it, don't silently
"fix" content that isn't this translation pass's job.

## After a batch

1. Verify via SQL/Node that every slug in the batch actually got a row
   with `source_field_hashes` populated (`apply` prints one line per
   product — sanity-check the count, but a real query is worth it before
   calling a batch done).
2. `npm run i18n:manifest` — confirms nothing about the page-level JSON
   namespaces broke (this only matters if you also touched a page's
   locale JSON, not for pure product-content batches).
3. Log the batch in `I18N-CHECKLIST.md`'s "Site-wide all-products `zh`
   batch" section (or add a new dated section if none exists yet for
   your batch) — slugs done, anything novel about the naming calls made,
   updated remaining-count. This file is what lets the next
   session/agent pick up without re-querying from scratch or repeating
   work.
