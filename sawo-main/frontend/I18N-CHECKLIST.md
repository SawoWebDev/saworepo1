# i18n checklist — page-by-page status

Tracks translation progress per **route**, not per JSON file (see
`README-i18n.md` for the file-per-namespace mechanics this sits on top of).
Update this whenever a page moves between columns.

## Legend

- ✅ **Wired** — page reads copy via `t()`, English JSON written. **This is the
  "ready to translate" signal** — check this column before starting a new
  language on any page; a page with ✅ Wired can be translated into any
  locale immediately (add the JSON, no JSX changes needed). A page without
  it needs wiring work first (see "Not yet touched at all" below).
- ✅ **FI written** — Finnish translation exists in `locales/fi/`, key-parity
  validated (no missing keys, no blanks, placeholders match the English source).
- ✅ **Live** — listed in `translatedRoutes.js`'s `TRANSLATED_PATHS`, so the
  language switcher and hreflang actually offer it. Requires a **native-speaker
  review** first (see `README-i18n.md` step 9) — "FI written" alone does not
  mean reviewed.
- 🟡 Partial — some content on the page still hardcoded English.
- ⬜ Not started.

German (`de`) is not tracked per-page below — per the project's "Finnish
first, pilot before scale" approach, `de` only exists today for Home (`/`).
Add a `de` column here once German work actually starts.

Chinese (`zh`) is likewise not a full tracked column yet — noted inline in a
page's Notes cell only once that specific page gets a `zh` translation (see
`/sauna/rooms` below, added 2026-08-26 as the second zh page after Home).
Run `npm run i18n:manifest` for the authoritative up-to-date state of every
locale/page combination rather than trusting this file alone — it's a
narrative log, the manifest is the source of truth.

## Sauna section

| Route | Wired | FI written | Live | Notes |
|---|---|---|---|---|
| `/sauna` (hub) | ✅ | ✅ | ✅ | Pre-existing, reviewed, live under `/fi/sauna`. **ZH added 2026-08-31** — root `meta`/`hero`/`heaters`/`controls`/`accessories` keys (52/52 keys, 0 gap verified via key-diff and `npm run i18n:manifest`). Reachable via the language switcher pilot (`en/fi/zh`). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/sauna/heaters` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, why-choose, video section, 6 heater cards. Needs native review before going live. **ZH added 2026-08-31** — full `heatersPage` section (22/22 keys, 0 gap verified via key-diff). Reachable via the language switcher pilot (`en/fi/zh`). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/sauna/accessories` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, brochure dropdown, 10 category cards. Needs native review. **ZH added 2026-08-31** — full `accessoriesPage` section (31/31 keys, 0 gap verified via key-diff). Reachable via the language switcher pilot (`en/fi/zh`). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/sauna/controls` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, intro, search/filter chrome, precaution notice, why-choose, promo banner. Needs native review. **ZH added 2026-08-31** — full `controlsPage` section (20/20 keys, 0 gap verified via key-diff). Reachable via the language switcher pilot (`en/fi/zh`). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/sauna/rooms` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, 16-item Configurator, RoomViewer chrome, Features carousel (6 tabs incl. paragraphs/specs), ProductDetails (story sections, feature text, perf cards, spec accordion), Room panels (4 room-type descriptions/features), Wood Materials section, the shared `SaunaCalculatorCTA` ("Find Your Dream Sauna"), plus bench-type/room-title dedup. Needs native review before going live. **ZH added 2026-08-26** — full `roomsPage` section (163/163 keys, verified 0 gap vs. English source via key-diff), reachable via the language switcher pilot (`en/fi/zh`, see `languageSettings.js`'s `PILOT_ENABLED_LOCALES`). Not native-reviewed, not in `TRANSLATED_PATHS`. **Correction, 2026-08-26**: the "Done 2026-08-25" claim above was wrong for two spots — `SaunaConfigurator.jsx` (the 16-item configurator) had the translation JSON written but **zero actual `t()` wiring in the component**, so it silently rendered 100% English on every locale (title, step tabs/labels/headings, all 16 item name/tag/desc, nav buttons, sidebar, CTA — plus the same locale-dropping `menuPaths.contact` link bug fixed elsewhere). Separately, `SaunaRoomViewer.jsx`'s one-line room-type subtitle (`cfg.desc`, sourced from `ROOM_CONFIGS` in `SaunaRoomData.jsx` — a *different* hardcoded data shape from the already-fixed `SRD_PANELS`) was never wired at all. Both fixed now (see "Infra fixes" below); FI and ZH both updated with the missing `roomDescriptions` keys. |
| `/sauna/heaters/tower` | ✅ | ✅ | ⬜ | **Wired 2026-09-01** — `Tower.jsx` now calls `useLocaleT("sauna")`/`useLocaleT("common")`/`useLocalizedPath()` (following the `Stone.jsx` pattern): SEO title/description, hero title/subtitle/alt/explore-button, intro heading/desc, filter-pill "All"/group names + search placeholder/clear (via `common.json`'s `catalogFilter.*`), the second Round/Wall/Corner type-filter row (new `towerPage.types.*` keys — this page is the only heater page with a second filter row), empty state, product-card `<Link>`, "View All Heaters" link (locale-prefixed via `localize()`), Why-choose section, brochure link, and `PromoBanner` props. New `towerPage` namespace added to `sauna.json` for en+zh (`fi` intentionally left ⬜, out of scope for this pass). Zero hardcoded-English JSX hits on the audit regex. **Products (half-batch, per user request to split the 36-product remainder in two)**: this page pulls 7 product families (Tower/SAWO30/Aries/Cubos/Heaterking/Phoenix/Fiberjungle via the "Towers" category) — Aries (18) and Cubos (3) already had `zh` from Day 1. Translated the other half today: **Tower ×12** (corner/round/wall × nb/ni/ni2/ns), **Heaterking ×3** (corner/round/wall-ns), **Phoenix ×2** (ni2/ns), **Fiberjungle ×1** (ns) — 18/18 via `product-i18n.js extract/apply`. `name`/`type` follow the established Aries precedent (`Corner`→`转角式`, `Round`→`圆柱式`, `Wall`→`壁挂式`, brand name and NB/NS/Ni/Ni2 codes kept). Same HTML-baked-spec-table gotcha as Aries Corner (`description` has the whole `<table>` inline, not `spec_table`) — translated only `<th>` header cells (`Heater Model`→`加热器型号`, `Stones<br>(kg)`→`桑拿石<br>(kg)`, `Control`→`控制方式`, etc., reusing the exact Aries `zh` header wording for consistency), left every `<td>` model-code/kW/dimension row untouched. Verified via SQL: 18/18 have `product_translations` rows with `source_field_hashes` populated (10–12 fields each). Confirmed end-to-end on `/zh/products/tower-corner-nb` via Playwright — name, description, feature bullets, and spec-table headers all render in Chinese; model codes/dimensions/`Built-in (8+4h)` control-mode data correctly left in English. **Second half, same day (2026-09-01)**: user asked to also translate "Round/Wall/Corner colors" and finish the rest — extracted/translated/applied the remaining **SAWO30 ×18** products (corner/round/wall × plain/Black × nb/ni2/ns), completing all 7 product families shown on this page. `name`/`type` extend the same convention: `Black`→`黑色` (color descriptor), position words as before. Note SAWO30's spec-table headers have minor casing/punctuation drift from the Tower/Aries wording (`(KG)` vs `(kg)`, `min (m3) max` vs `min. (m3) max.`, `Size of heater` vs `Size of Heater`) — matched case-insensitively rather than normalizing the English source. `short_description` HTML structure varies more than Tower/Heaterking did (Round variants in particular mix `<p>`/`<span style="color:var(--text)...">` wrappers inconsistently product-to-product, apparently hand-edited over time) — handled with a per-slug (not per-shared-text) translation map instead of the dedup-by-exact-string approach used for the Tower batch, since exact-string reuse mostly missed here. Verified via SQL: 18/18 have `product_translations` rows with `source_field_hashes` populated (11 fields each). Confirmed end-to-end on `/zh/products/sawo30-round-black-ni2` via Playwright — name (`SAWO30 圆柱式 黑色 Ni2`), both description paragraphs, all 7 feature bullets, and the spec-table headers all render in Chinese; model codes/control-mode data untouched. Also visible in the "other heaters" carousel on that page: already-translated siblings (`Heaterking 圆柱式 NS`) render in Chinese next to still-English ones (`Phoenix NS`) from families not yet done — expected, not a bug. **All 36 of the original "products under `/sauna/heaters/tower`" remainder are now done in `zh`** (Tower ×12, Heaterking ×3, Phoenix ×2, Fiberjungle ×1, SAWO30 ×18) — combined with the pre-existing Aries ×18 and Cubos ×3, all 57 Towers-category products have `zh`. **`fi` pass, same day (2026-09-01), user asked to "continue the rest"**: added `towerPage` to `fi/sauna.json` (this page was the first heater sub-page — Stone/Wall-Mounted — to get `fi` copy; those two remain ⬜ for `fi`, out of scope here) and translated all 36 remaining products into `fi` via the same `product-i18n.js extract/apply` flow, reusing established fi vocabulary from the Aries/Cubos Day-1 batch (`Corner`→`Kulma`, `Round`→`Pyöreä`, `Wall`→`Seinä`, `Black`→`Musta`, header row `Heater Model`→`Lämmitinmalli` etc., `Available control:`→`Saatavilla oleva ohjaus:`, `Power range:`→`Tehoalue:` — all pulled from existing `translation_memory` rows rather than reinvented). Same two structural gotchas as the `zh` pass: SAWO30's spec-table header casing/punctuation drift (`(KG)` vs `(kg)`, `min (m3) max` vs `min. (m3) max.`) handled case-insensitively, and SAWO30 Round's inconsistent `<p>`/`<span style="color:var(--text)...">` HTML wrapping handled with a per-slug (not per-shared-text) translation map. Verified via SQL: 36/36 have `product_translations` rows with `source_field_hashes` populated. Confirmed end-to-end on `/fi/sauna/heaters/tower` (page chrome) and `/fi/products/sawo30-wall-black-ni2` (product — name, both description sentences, all 7 features, and spec-table headers all in Finnish; model codes/control-mode data untouched) via Playwright. **All 57 Towers-category products now have both `zh` and `fi`.** Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/sauna/heaters/wall-mounted` | ✅ | ⬜ | ⬜ | **Checklist correction, 2026-09-01**: this row said "not started" but `WallMounted.jsx` was already fully wired (`useLocaleT`/`useLocalizedPath`, `wallMountedPage` namespace complete in en+zh) — found while using this file as the wiring template for `/sauna/heaters/stone`. `fi` genuinely is missing (confirmed via `require()`). Not native-reviewed, not in `TRANSLATED_PATHS`. **Products, 2026-09-01**: all 37 Wall-Mounted category products (Krios ×3, Nordex family ×16 [core/Black/Combi/Mini/Mini Combi], Mini family ×4, Mini X ×4, Scandia family ×6, Scandifire ×4) translated to `zh` via `product-i18n.js`, verified via SQL — 37/37 have `product_translations` rows with `source_field_hashes` populated, zero unspaced `kW`/`kg` matches. Brand names (Nordex, Krios, Mini, Mini X, Scandia, Scandifire, Cubos-style precedent) kept untranslated; color/finish descriptors (Black→黑色, Fibercoated→纤维涂层, Red→红色) and mounting/model-line words (Aries-style "Corner"→"Kulma"/"转角式" precedent doesn't apply here — these are all flat brand+code names) translated where present. Confirmed end-to-end on `/zh/products/nordex-black-nb` via Playwright: description, features, spec-table headers, and the "other heaters" carousel (`Scandifire 黑色 NB` etc.) all render correctly. Full per-product checklist and family-by-family notes in the Sauna Heaters batch table below. |
| `/sauna/heaters/stone` | ✅ | ⬜ | ⬜ | **Wired 2026-09-01** — `Stone.jsx` now calls `useLocaleT("sauna")`/`useLocaleT("common")`/`useLocalizedPath()` (following the `WallMounted.jsx` pattern above): SEO title/description, hero title/subtitle/alt/explore-button, intro heading/desc, filter-pill "All" + search placeholder/clear/no-results/results-count (via `common.json`'s `catalogFilter.*`), empty state, product-card `<Link>`, "View All Heaters" link (now also correctly locale-prefixed — was a bare `menuPaths.heaters` before, same locale-dropping bug class documented elsewhere in this file), Why-choose section, brochure link (`common.json`'s `viewBrochure`), and `PromoBanner` props. New `stonePage` namespace added to `sauna.json` for en+zh (zh only, per this task's scope — `fi` intentionally left ⬜, falls back to English per-key, not a bug). Zero hardcoded-English hits on the audit regexes, `useLocaleT` count 3. `npm run i18n:manifest` confirms `sauna: zh translated`, 0 gap. `CI=true npx react-scripts build` compiled with zero errors. **Products**: of the 5 Stone-series products (Cumulus ×3, Nimbus ×2 — see the Sauna Heaters batch table below), Cumulus already had `zh` from Day 1; **Nimbus ×2 (`nimbus-ns`, `nimbus-combi-ns`) translated to `zh` today** via `product-i18n.js extract/apply`, verified via SQL — both have `product_translations` rows with `source_field_hashes` populated (6 and 8 fields respectively). Brand/model names (`Nimbus NS`, `Nimbus Combi NS`, `type: "Nimbus"`) kept untranslated, matching the Cumulus/Cubos precedent. Spec-table `<th>` headers translated, `<td>` data rows (model codes, kW, dimensions) left untouched, same prose/data split as every other product in this batch. **Source content bug found (not fixed, flagged only)**: `nimbus-combi-ns`'s English `description` table has a literal `"kW$1<br>Heater"` / `"kW$1<br>Tank"` artifact in the live `products` row itself (confirmed via direct Supabase query, not an extraction bug) — translated the intended meaning (`"kW<br>加热器"` / `"kW<br>水箱"`) rather than preserving the broken placeholder, same precedent as the Cumulus dangling-sentence bug from Day 1. Worth fixing in the English source directly; out of scope here. Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/sauna/heaters/floor` | ⬜ | ⬜ | ⬜ | |
| `/sauna/heaters/combi` | ⬜ | ⬜ | ⬜ | |
| `/sauna/heaters/dragonfire` | ⬜ | ⬜ | ⬜ | |
| `/sauna/accessories/accessory-sets` | ✅ | ⬜ | ⬜ | **Wired 2026-09-04** — `AccessorySets.jsx` now calls `useLocaleT("sauna")`/`useLocaleT("common")`/`useLocalizedPath()` (following the `Stone.jsx`/`SaunaAccessories.jsx` pattern): SEO title/description (+`hreflangAlternates`), hero title/subtitle/alt/brochure button, intro heading/desc, filter-pill label(s) (via a `groups` key map, falls back to the raw group name via i18next `defaultValue` so business-logic `FIXED_ORDER`/`GROUP_KEYWORDS` matching stays untouched) + search placeholder/clear/no-results/results-count (via `common.json`'s `catalogFilter.*`), empty/no-match states, product-card grid group headings, "View All Accessories" link (reused the existing `accessoriesPage.viewAll` key from `sauna.json` rather than duplicating it), `WhyChooseSawo` props, and `PromoBanner` props. New `accessorySetsPage` namespace added to `sauna.json` for en+zh (`fi` intentionally left ⬜, out of scope for this pass). Zero hardcoded-English hits on the audit regexes. Split out of the old `/sauna/accessories/*` catch-all row — see the row below for what's still untouched. |
| `/sauna/accessories/benches-floor-tiles` | ✅ | ⬜ | ⬜ | **Wired 2026-09-04** — `BenchesFloorTiles.jsx`, same pattern/scope as `accessory-sets` above. New `benchesFloorTilesPage` namespace in `sauna.json` (en+zh only). Group filter pills (Benches/Wooden Floor Mats/Cloth Hangers) translated via the same `groups` key-map + `defaultValue` fallback approach. Zero hardcoded-English hits on the audit regexes. |
| `/sauna/accessories/clocks-sandtimers` | ✅ | ⬜ | ⬜ | **Wired 2026-09-04** — `ClocksSandtimers.jsx`, same pattern/scope as `accessory-sets` above. New `clocksSandtimersPage` namespace in `sauna.json` (en+zh only). Group filter pills (Clocks/Sand Timers) translated via the same `groups` key-map + `defaultValue` fallback approach. Zero hardcoded-English hits on the audit regexes. |
| `/sauna/accessories/doors-handles` | ✅ | ⬜ | ⬜ | **Wired 2026-09-04** — `DoorsHandles.jsx`, same pattern/scope as `accessory-sets` above. New `doorsHandlesPage` namespace in `sauna.json` (en+zh only). Group filter pills (Sauna Doors/Handles) translated via the same `groups` key-map + `defaultValue` fallback approach — the underlying `GROUP_KEYWORDS`/name-matching logic (which relies on the untranslated English "Door"/"Door Handle" substrings) was left completely untouched, only the *displayed* pill/heading text goes through `t()`. Zero hardcoded-English hits on the audit regexes. |
| `/sauna/accessories/headrests-backrests` | ✅ | ⬜ | ⬜ | **Wired 2026-09-04** — `HeadrestsBackrests.jsx`, same pattern/scope as `accessory-sets` above. New `headrestsBackrestsPage` namespace in `sauna.json` (en+zh only). Group filter pills (Headrests/Backrests) translated via the same `groups` key-map + `defaultValue` fallback approach. Zero hardcoded-English hits on the audit regexes. `CI=true npx react-scripts build` confirmed zero errors after all 5 of these pages were wired together. `npm run i18n:manifest` confirms `sauna: zh translated`, 0 gap (fi shows more keys behind source than before, expected — these 5 pages' `fi` strings were intentionally not added). |
| `/sauna/accessories/*` (remaining 5 category pages: pails-ladles, thermometers, lights-covers, kivistone, ventilations-add-ons) | ⬜ | ⬜ | ⬜ | All still fully hardcoded English. Being handled by another workstream in parallel with the 5 pages split out above — not touched here. |
| `/sauna/rooms/interior-designs` | ⬜ | ⬜ | ⬜ | |
| `/sauna/rooms/wood-panels-timbers` | ⬜ | ⬜ | ⬜ | |
| `/sauna-heaters` (all-heaters catalog) | ⬜ | ⬜ | ⬜ | `HeatersCatalog.jsx` — uses `CategoryHero`, no i18n wiring. |
| `/sauna-accessories` (all-accessories catalog) | ⬜ | ⬜ | ⬜ | `AccessoriesCatalog.jsx`. |

## Steam section

| Route | Wired | FI written | Live | Notes |
|---|---|---|---|---|
| `/steam` (hub) | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, intro, brochure link, and all 3 group sections (Generators/Controls/Accessories: headings, view-all links, descriptions, loading/empty states, card fallback descriptions), CTA. Product content: translated all 15 remaining Steam Controls/Accessories products (name/description/features/specs) in `product_translations`; all 18 steam-category products now have `fi` rows. Needs native review before going live. **ZH added 2026-08-26** — full `hub` section (25/25 keys, 0 gap verified via key-diff). Pre-check per the new audit process: `Steam.jsx` confirmed properly wired (`useLocaleT` used, every visible string traced to a `t("hub....")` call, `PageCTA` receives translated props) before translating — no repeat of the Configurator gap found here. Reachable via the language switcher pilot (`en/fi/zh`). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/steam/generators` | ✅ | ✅ | ✅ | Pre-existing, reviewed, live under `/fi/steam/generators`. |
| `/steam/controls` | ✅ | ✅ | ⬜ | Wired 2026-08-31 — `SteamControls.jsx`/`ProductCard` now call `useLocaleT("steam")`/`useLocalizedPath()`: SEO title/description, `CategoryHero` title/description, intro heading/desc, loading/empty states, precaution-notice tab+text, CTA, and the product-card `<Link>` all go through `t()`/`localize()`. New `controls` namespace (`meta`, `hero`, `intro`, `loading`, `empty`, `notice`, `cta`) added to `steam.json` for en/fi/zh — fi and zh both full, 0 gap (key-diff verified via `npm run i18n:manifest`, only the pre-existing `generators` zh gap remains, see note below). Underlying product data already translated (2026-08-25/26). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/steam/accessories` | ✅ | ✅ | ⬜ | Wired 2026-08-31 — `SteamAccessories.jsx` now calls `useLocaleT("steam")`/`useLocalizedPath()`: SEO title/description, hero title/subtitle, intro heading/desc, loading/empty states, card fallback description, CTA, and the product-card `<Link>` all go through `t()`/`localize()`. New `accessories` namespace (`meta`, `hero`, `intro`, `loading`, `empty`, `fallbackDesc`, `cta`) added to `steam.json` for en/fi/zh — fi and zh both full, 0 gap. Underlying product data already translated (2026-08-25/26). Not native-reviewed, not in `TRANSLATED_PATHS`. |

## Product content (Supabase `product_translations`)

Per-product translation status (name/description/features/specs/variations/
included items) is tracked live in the **Translation CMS**
(`/admin/translations` — see its Products tab for the full product × locale
grid), not exhaustively re-listed here — that page reads `source_field_hashes`
freshness data directly from Supabase, so it's always current; this file
would just go stale. Noteworthy events only:

### Sauna Heaters batch — 5-day schedule (started 2026-09-01)

119 products qualify as "Sauna Heaters" — filtered the same way
`HeatersCatalog.jsx`/`isHeaterProduct()` does: `categories` contains
`wall-mounted`/`floor`/`combi`/`dragonfire`/`tower`/`stone`, excluding
accessory-like categories and the "Sauna Stones" name collision (published,
visible, not deleted). Batched by base heater model (not alphabetically) so
translation-memory reuse is maximal within a day — the first finish/control
variant of each model gets fresh translation, siblings mostly auto-fill from
TM and just need a review pass. `fi` and `zh` are both done per product
before moving to the next, so a day's row is either fully done or not
started (no split-locale state to track separately). Update the ✅/⬜ cells
below as each product is applied — this table is the source of truth for
"what's left," `/admin/translations` is the source of truth for "is it
still fresh" (source_field_hashes-based, flags a product the moment its
English content changes — see `README-i18n.md`'s Product content section
for the extract/apply mechanics and the `variations` vs
`heating_element_groups` gotcha).

**Ordering decision (2026-09-01): `zh` first, `fi` second, not interleaved
per-product.** Originally planned as fi+zh together per product before
moving on; switched because Finnish (Latin script) blends into a page on a
visual skim, so a stray untranslated English sentence is easy to miss —
Chinese makes the translated/untranslated boundary visually unmistakable
(this is exactly how the earlier zh audit caught real bugs — canonical
tags, hreflang, the `ProductPageRouter` redirect — that a Finnish-only pass
risked missing). So each day's batch now does `zh` for every product first,
then comes back for `fi` as the mop-up pass. `aries-corner-black-nb` was
done both-together before this decision (kept, not redone); `fi` for the
next few Aries Corner variants was done ahead of `zh` for the same reason —
kept rather than discarded, `zh` for those is being caught up now.

**Day 1 — Aries, Cubos, Cumulus (24 products)**

| Slug | fi | zh |
|---|---|---|
| aries-corner-black-nb | ✅ | ✅ |
| aries-corner-black-ni2 | ✅ | ✅ |
| aries-corner-black-ns | ✅ | ✅ |
| aries-corner-nb | ✅ | ✅ |
| aries-corner-ni2 | ✅ | ✅ |
| aries-corner-ns | ✅ | ✅ |
| aries-round-black-nb | ✅ | ✅ |
| aries-round-black-ni2 | ✅ | ✅ |
| aries-round-black-ns | ✅ | ✅ |
| aries-round-nb | ✅ | ✅ |
| aries-round-ni2 | ✅ | ✅ |
| aries-round-ns | ✅ | ✅ |
| aries-wall-black-nb | ✅ | ✅ |
| aries-wall-black-ni2 | ✅ | ✅ |
| aries-wall-black-ns | ✅ | ✅ |
| aries-wall-nb | ✅ | ✅ |
| aries-wall-ni2 | ✅ | ✅ |
| aries-wall-ns | ✅ | ✅ |
| cubos-nb | ✅ | ✅ |
| cubos-ni2 | ✅ | ✅ |
| cubos-ns | ✅ | ✅ |
| cumulus-nb | ✅ | ✅ |
| cumulus-ni2 | ✅ | ✅ |
| cumulus-ns | ✅ | ✅ |

**Day 2 — Nordex family (24 products)**

| Slug | fi | zh |
|---|---|---|
| nordex-black-nb | ⬜ | ✅ |
| nordex-black-ni2 | ⬜ | ✅ |
| nordex-black-ns | ⬜ | ✅ |
| nordex-nb | ⬜ | ✅ |
| nordex-ni2 | ⬜ | ✅ |
| nordex-ns | ⬜ | ✅ |
| nordex-combi-black-ns | ⬜ | ✅ |
| nordex-combi-ns | ⬜ | ✅ |
| nordex-floor-black-ns | ⬜ | ⬜ |
| nordex-floor-ns | ⬜ | ⬜ |
| nordex-mini-black-nb | ⬜ | ✅ |
| nordex-mini-black-ni2 | ⬜ | ✅ |
| nordex-mini-black-ns | ⬜ | ✅ |
| nordex-mini-combi-black-ns | ⬜ | ✅ |
| nordex-mini-combi-ns | ⬜ | ✅ |
| nordex-mini-nb | ⬜ | ✅ |
| nordex-mini-ni2 | ⬜ | ✅ |
| nordex-mini-ns | ⬜ | ✅ |
| nordex-pro-combi-ns | ⬜ | ⬜ |
| nordex-pro-ns | ⬜ | ⬜ |
| nordex-s-black-ns | ⬜ | ⬜ |
| nordex-s-combi-black-ns | ⬜ | ⬜ |
| nordex-s-combi-ns | ⬜ | ⬜ |
| nordex-s-ns | ⬜ | ⬜ |

**Day 3 — SAWO30, Krios, Phoenix, Fiberjungle (24 products)**

| Slug | fi | zh |
|---|---|---|
| sawo30-corner-black-nb | ✅ | ✅ |
| sawo30-corner-black-ni2 | ✅ | ✅ |
| sawo30-corner-black-ns | ✅ | ✅ |
| sawo30-corner-nb | ✅ | ✅ |
| sawo30-corner-ni2 | ✅ | ✅ |
| sawo30-corner-ns | ✅ | ✅ |
| sawo30-round-black-nb | ✅ | ✅ |
| sawo30-round-black-ni2 | ✅ | ✅ |
| sawo30-round-black-ns | ✅ | ✅ |
| sawo30-round-nb | ✅ | ✅ |
| sawo30-round-ni2 | ✅ | ✅ |
| sawo30-round-ns | ✅ | ✅ |
| sawo30-wall-black-nb | ✅ | ✅ |
| sawo30-wall-black-ni2 | ✅ | ✅ |
| sawo30-wall-black-ns | ✅ | ✅ |
| sawo30-wall-nb | ✅ | ✅ |
| sawo30-wall-ni2 | ✅ | ✅ |
| sawo30-wall-ns | ✅ | ✅ |
| krios-nb | ⬜ | ✅ |
| krios-ni2 | ⬜ | ✅ |
| krios-ns | ⬜ | ✅ |
| phoenix-ni2 | ✅ | ✅ |
| phoenix-ns | ✅ | ✅ |
| fiberjungle-ns | ✅ | ✅ |

**Day 4 — Tower, Scandia, Scandifire, Heaterking (25 products)**

| Slug | fi | zh |
|---|---|---|
| tower-corner-nb | ✅ | ✅ |
| tower-corner-ni | ✅ | ✅ |
| tower-corner-ni2 | ✅ | ✅ |
| tower-corner-ns | ✅ | ✅ |
| tower-round-nb | ✅ | ✅ |
| tower-round-ni | ✅ | ✅ |
| tower-round-ni2 | ✅ | ✅ |
| tower-round-ns | ✅ | ✅ |
| tower-wall-nb | ✅ | ✅ |
| tower-wall-ni | ✅ | ✅ |
| tower-wall-ni2 | ✅ | ✅ |
| tower-wall-ns | ✅ | ✅ |
| scandia-combi-fiber-coated-ns | ⬜ | ✅ |
| scandia-combi-ns | ⬜ | ✅ |
| scandia-fibercoated-nb | ⬜ | ✅ |
| scandia-fibercoated-ns | ⬜ | ✅ |
| scandia-nb | ⬜ | ✅ |
| scandia-ns | ⬜ | ✅ |
| scandifire-black-nb | ⬜ | ✅ |
| scandifire-black-ns | ⬜ | ✅ |
| scandifire-red-nb | ⬜ | ✅ |
| scandifire-red-ns | ⬜ | ✅ |
| heaterking-corner-ns | ✅ | ✅ |
| heaterking-round-ns | ✅ | ✅ |
| heaterking-wall-ns | ✅ | ✅ |

**Day 5 — Mini, Mini X, Minidragon, Nimbus, Helius, Savonia, Taurus (22 products)**

| Slug | fi | zh |
|---|---|---|
| mini-nb | ⬜ | ✅ |
| mini-fibercoated-nb | ⬜ | ✅ |
| mini-combi-ns | ⬜ | ✅ |
| mini-combi-fibercoated-ns | ⬜ | ✅ |
| mini-x-nb | ⬜ | ✅ |
| mini-x-ns | ⬜ | ✅ |
| mini-x-fibercoated-nb | ⬜ | ✅ |
| mini-x-fibercoated-ns | ⬜ | ✅ |
| minidragon-black-nb | ⬜ | ✅ |
| minidragon-black-ns | ⬜ | ✅ |
| minidragon-red-nb | ⬜ | ✅ |
| minidragon-red-ns | ⬜ | ✅ |
| nimbus-combi-ns | ⬜ | ✅ |
| nimbus-ns | ⬜ | ✅ |
| helius-mini-ns | ⬜ | ✅ |
| helius-ns | ⬜ | ✅ |
| savonia-combi-fiber-coated-ns | ⬜ | ✅ |
| savonia-combi-ns | ⬜ | ✅ |
| savonia-fiber-coated-ns | ⬜ | ✅ |
| savonia-ns | ⬜ | ✅ |
| taurus-d-combi-ns | ⬜ | ✅ |
| taurus-d-ns | ⬜ | ✅ |

**Progress log** (append one line per day as it's completed — narrative
detail like TM-prefill counts and any bugs found goes here, same style as
the Steam entries below):

- **2026-09-01 — Day 5 complete for `zh` (22/22 products, `fi` still ⬜)**:
  Mini (`mini-nb`, `mini-fibercoated-nb`, `mini-combi-ns`,
  `mini-combi-fibercoated-ns`), Mini X (`mini-x-nb`, `mini-x-ns`,
  `mini-x-fibercoated-nb`, `mini-x-fibercoated-ns`), Minidragon
  (`minidragon-black-nb`, `minidragon-black-ns`, `minidragon-red-nb`,
  `minidragon-red-ns`), Helius (`helius-mini-ns`, `helius-ns`), Savonia
  (`savonia-combi-fiber-coated-ns`, `savonia-combi-ns`,
  `savonia-fiber-coated-ns`, `savonia-ns`), and Taurus
  (`taurus-d-combi-ns`, `taurus-d-ns`) — done via `product-i18n.js
  extract/apply`, verified via SQL: all 22 have `product_translations` rows
  with `source_field_hashes` populated (Nimbus's 2 were done first, as part
  of the `/sauna/heaters/stone` pickup logged directly below). TM reuse was
  very strong within the Mini/Mini X families — both fully pre-filled
  (name/short_description/description/features, zero fresh translation
  needed) since near-identical Mini/Mini X copy had already been through
  `zh` translation memory from earlier sessions. Minidragon, Helius,
  Savonia, and Taurus needed fresh short_description + spec-table header
  translation each, following the established prose/data split (`<th>`
  headers translated, `<td>` rows — model codes, kW, dimensions — left
  untouched) and the brand-name-kept-untranslated convention (e.g.
  `Minidragon Black NB`, `type: "Minidragon"`) except where TM had already
  translated a descriptive suffix into the name itself (e.g. `Mini
  纤维涂层 NB`, `Savonia 纤维涂层 NS` — "Fibercoated"/"Fiber Coated" treated
  as a translatable descriptor, consistent with the Aries "Corner"
  precedent, not a brand word). **Two source-content typos found (not
  fixed, flagged only)**: `helius-mini-ns`'s `features[0]` had `"Power
  range: 2,0 – 3.0kW"` (European decimal comma) — corrected to `"2.0"` in
  the zh translation only, English source left as-is; several Savonia
  Combi/Taurus D Combi `features` used `"1,0kW"/"2,0kW"` for the same
  reason — same fix applied in translation only. `fi` intentionally left
  ⬜ for the whole batch — out of scope for this pass (user asked for
  `zh` specifically).
- **2026-09-01 — out-of-batch-order pickup, `/sauna/heaters/stone` requested
  directly**: user asked to translate the Stone heaters page and its
  products to `zh` specifically (not part of the sequential Day 1–5 batch
  order above). Wired `Stone.jsx` (page chrome) and translated its 2
  not-yet-done Nimbus products (`nimbus-ns`, `nimbus-combi-ns`) — see the
  `/sauna/heaters/stone` row above for full detail and the source-content
  `kW$1` bug found. Cumulus (the other Stone-series family) already had
  `zh` from Day 1. `fi` intentionally left for both the page and the two
  Nimbus products — out of scope for this pass, tracked as the usual ⬜.
- **2026-09-01**: Aries Corner (6/6 products) done in both `fi` and `zh` via
  `product-i18n.js`. Confirmed a real gotcha not previously documented:
  these products' spec table isn't in the `spec_table` field at all — the
  entire `<table>` (headers AND data rows) is baked as raw HTML directly
  into `description`. Handled per the existing prose/data split rule
  applied manually: translated only the `<th>` header cell text (e.g.
  "Heater Model" → "Lämmitinmalli" / "加热器型号"), left every `<td>` row
  cell (model codes, kW numbers, dimensions, "Built-in (8+4h)"-style
  control-mode names) untouched. TM reuse confirmed strong within a model
  family: after the first variant (`aries-corner-black-nb`), siblings
  pre-filled 6-9 of ~10 fields automatically, needing fresh translation
  only for `name`, the description table headers (re-typed per product
  since the HTML wrapper/whitespace differs slightly between rows, so exact
  TM string-match mostly misses on `description` even though the header
  wording is identical — `short_description` and `features` matched fine).
  Also adopted zh-first ordering starting here (see note above the Day 1
  table).
- **2026-09-01 — formatting fix, applied catalog-wide, not just today's
  batch**: numbers were rendering jammed against their unit (`"9.0kW"`,
  `"9kW"`) because the English source itself has no space there and the
  translation pipeline was mirroring it verbatim. Fixed via SQL across
  every `product_translations` row (`name`/`type`/`short_description`/
  `description`/`features`/`variations`, all locales) — this caught and
  fixed existing Steam Generators `zh` rows too (`"75.0kW"` → `"75.0 kW"`),
  not just Sauna Heaters. Also fixed `translation_memory.translated_text`
  so future `extract` pre-fills carry the space forward instead of
  reintroducing the bug. Verified zero remaining `\d(kW|kg)` matches
  anywhere in `product_translations`. New translations from here on are
  typed with the space from the start. The English source `products` table
  itself was deliberately left untouched — out of scope, a separate
  decision if wanted.
- **2026-09-01 — Day 1 complete (24/24 products, fi+zh, verified via SQL)**:
  Aries Corner/Round/Wall (18, detailed above), Cubos (3), Cumulus (3). All
  confirmed with `source_field_hashes` populated for both locales, zero
  remaining unspaced-unit matches. Cubos and Cumulus each turned out to be
  a single distinct model (not a mounting-position family like Aries), so
  `name`/`type` kept the brand name unchanged ("Cubos", "Cumulus") rather
  than translating a generic noun after it, unlike "Aries Corner" → "Aries
  Kulma" / "Aries 转角式".
  - **Source content bug found (not fixed, flagged only — out of scope for
    a translation pass)**: all 3 Cumulus products' English
    `short_description` has a dangling, grammatically broken sentence —
    `"...front. It comes The soapstone helps..."` (an orphaned "It comes"
    with no continuation). Translated the *intended* meaning coherently in
    both `fi`/`zh` rather than preserving the break (unlike the
    `venturi-pipe` spelling-typo case from the Steam batch, this isn't a
    reproducible spelling variant of a real word — a broken clause doesn't
    translate meaningfully word-for-word). Worth fixing in the English
    source directly at some point; flagging here rather than silently
    fixing it since it's outside this pass's scope.
  - **Second HTML-structure gotcha found**: `cumulus-ni2`'s spec table
    isn't a plain `<table>` like every other Aries/Cubos/Cumulus variant —
    it's wrapped in a legacy WordPress/Visual-Composer widget div stack
    (`wpb_row`/`vc_row`/`textwidget`/etc., `<th class="tg-s6z2">` cells).
    Same prose/data split applied (translate `<th>` text only), but large
    whole-string `old_string` replacements kept failing to match against
    this packet — worked around by editing each `<th>` text and the
    `short_description`/`name` fields as separate small, uniquely-anchored
    edits instead of one big block replace.

- **2026-08-25**: all 18 steam-category products (3 Steam Controls + 12
  Steam Accessories + 3 Steam Generators, the last already partially done)
  got `fi` rows via `product-i18n.js extract`/`apply`.
- **2026-08-26 — first `zh` product, as an architecture test**: `ste-steam-generator`
  (STE Steam Generator). Confirmed the pipeline built for the Translation
  CMS (see `TRANSLATION_CMS.txt`/the CMS plan) genuinely works end-to-end for
  a non-`fi` locale, not just in the CMS's own UI — used the CLI directly:
  `node product-i18n.js extract ste-steam-generator zh` →
  `node product-i18n.js apply ste-steam-generator zh`. Verified in Supabase:
  both `fi` and `zh` rows now exist with `source_field_hashes` populated
  (freshness tracking active from day one, not backfilled after the fact),
  and 28 distinct phrases were recorded into `translation_memory` for
  `zh` (was 0 before this — every zh product/page translation from here on
  reuses these for free). `useLocalProducts.js`'s `mergeTranslation()` is
  locale-generic (no `fi`-only special-casing anywhere), so this is live on
  `/zh/products/ste-steam-generator` immediately, no redeploy.
  - **Dictionary sharing across products, confirmed working**: translated
    `stn-steam-generator` (a sibling steam-generator product) into `zh`
    right after — `extract` auto-pre-filled **34 of ~45 fields** straight
    from the 28 phrases the STE translation had just seeded into
    `translation_memory` (variation names "2/3/6 Heating Elements," spec
    headers "Steam Generator Model"/"Weight (kg)"/"Control," repeated
    feature bullets, included-item titles). This is the same mechanism
    already used for `fi` (the original steam-category batch got "45
    field(s) pre-filled" per product for the same reason) — nothing new was
    built, just confirmed it compounds for `zh` too. Only genuinely new
    content (name, short_description, a few STN-specific features/included
    items) needed fresh translation. `zh` `translation_memory` is now at 42
    distinct phrases after 2 products — reuse gets stronger with every
    product translated in the same category, and it's automatic (no manual
    "check if this phrase exists" step, the CLI does the lookup on every
    `extract`).
  - **Important limit, clarified after a question**: translation memory only
    speeds up translating a product *once someone runs the pipeline for it*
    — it does not retroactively translate every product site-wide just
    because their English text overlaps with something already translated.
    `stn-s-steam-generator/zh` had no `product_translations` row at all
    (`locale: null` on lookup) even after STE/STN were done, purely because
    `extract`/`apply` hadn't been run for it yet — confirmed via SQL, then
    fixed: ran the pipeline, got 51/62 fields pre-filled from the by-then
    48-phrase `zh` TM, translated the rest, applied. `zh` TM is now at 48
    phrases after 3 steam-generator products.
  - **2026-08-26 — all 12 `/steam` products completed in `zh`**: after the
    3 Steam Generators (above), translated the remaining 2 Steam Controls
    (`steam-2-0`, `steam-stainless-touch-control`) and all 7 Steam
    Accessories (`aroma-pump`, `demand-button`, `installation-stand`,
    `steam-door`, `steam-head-cover`, `venturi-pipe-l-shape`,
    `venturi-pipe-straight`) — every product shown on `/steam`. Verified via
    SQL: 3/3 Generators, 2/2 Controls, 7/7 Accessories all have `zh` rows.
    `zh` `translation_memory` is now at 122 phrases. Note: Controls/
    Accessories share almost no phrase overlap with Generators (different
    feature vocabulary), so these came back with **0 fields pre-filled** on
    `extract` — TM reuse is strongest *within* a product sub-category
    (steam generator ↔ steam generator), not automatically across all of
    `/steam`. `venturi-pipe-straight` and `venturi-pipe-l-shape` are near-
    duplicates of each other, so most of the second one's fields were
    reused by hand from the first (same underlying mechanism, just applied
    manually since the two share nearly identical source text down to a
    typo — "hizzing" for "hissing" — preserved faithfully rather than
    silently corrected, per the pipeline's "translate what's there" rule).
  - **2026-08-26 — 5 more standalone "included item" products**: `rj12-cable`,
    `autodrain`, `steam-head`, `aroma-fan-and-dimmer-functions`,
    `electronics-compartment` — these are real, separate product pages
    (`type: null`, linked from the "included items" thumbnails on the steam
    generator pages), not just the inline `included_items` sub-fields
    already translated as part of those parent products. Extracted/applied
    all 5 to `zh`; `name` pre-filled from TM on 4/5 (title text was already
    identical to the parent products' included-item titles), `short_description`
    needed fresh translation on all 5 since the standalone-page wording
    differs slightly from the inline note text (no parentheses, full
    sentences).
  - **Real bug found and fixed while investigating a "zh page reverts to
    English" report**: `ProductPageRouter.jsx` (the component behind
    `/products/:slug`) redirects any accessory-category product to
    `/accessories/:slug` via `navigate()` — but that redirect was hardcoded
    to the bare English path, not wrapped in `localize()`. On a page like
    `/zh/products/aroma-pump`, the redirect fires the moment
    `useLocalProducts()` finishes loading and confirms the product is an
    accessory — which is exactly why it looked like "shows the zh
    translation for a while then returns to English": the brief window
    before products load renders fine (or a loading state), then the
    redirect silently drops the `/zh` prefix. Fixed in
    `ProductPageRouter.jsx`, and found the identical bug in one more place
    while sweeping for the same `navigate(\`/...\`)` pattern site-wide:
    `AccessoryCard.jsx`'s `goToProduct` (a shared card component used
    across accessory listing grids) had the same hardcoded, unlocalized
    `navigate()`. Both now use `useLocalizedPath()`. Every other
    `navigate(...)` hit in the same grep was confirmed admin-only
    (`/admin/...`, `/login`) — those are correctly locale-agnostic, not
    bugs.
  - **2026-08-26 — fixed the English-then-Chinese flash on every product
    page**: `useLocalProducts.js` fetches `product_translations` separately
    from the (cached) English product list, and that fetch was never
    reflected in the hook's `loading` flag — so every page painted the
    English product immediately (translations start at `{}`, `mergeTranslation`
    falls back to English when there's no entry yet), then re-rendered a
    moment later once the translation fetch resolved. Every consumer
    already gates its first paint on `loading` (`if (loading) return
    <SkeletonPage/>`, used by `DispProduct.jsx`/`DispAccessories.jsx`/every
    catalog grid), so the fix is one flag: added `translationsReady` state,
    folded into the returned `loading` (`loading: loading || !translationsReady`)
    — no per-page changes needed, every consumer's existing skeleton gate
    now automatically covers the translation fetch too. English visitors
    see zero change (`translationsReady` starts `true` for `locale==="en"`).
    Note this only fixes the *flash*, not the underlying re-fetch-on-every-
    navigation — `product_translations` still isn't cached the way the
    English product list is (still fetched fresh per page, per the comment
    already in that file), so a future speed optimization (client-side
    cache with a short TTL, similar to `PRODUCTS_CACHE_KEY`) is possible but
    wasn't done here — out of scope for a visual-flash fix.
  - **2026-08-26 — 5 more standalone "included item" products, and zh made
    genuinely SEO-discoverable**: translated `rj12-cable`, `autodrain`,
    `steam-head`, `aroma-fan-and-dimmer-functions`, `electronics-compartment`
    (separate product pages linked from the "included items" thumbnails on
    steam generator pages — not just the inline `included_items` sub-fields
    already translated as part of the parent products). That's 17 zh
    products total now.
    - Then, after spot-checking translation quality (user-reviewed via
      screenshots, confirmed natural/accurate), made the whole zh pilot
      actually discoverable to search engines — translated content existing
      is NOT the same thing as a search engine being told about it. Found
      three real gaps, all fixed:
      1. **Canonical tags were asserting the English URL on every locale
         page.** `DispProduct.jsx`/`DispAccessories.jsx` passed a bare
         `/products/${slug}` (no locale prefix) to `<SEO path=...>` — so a
         `/zh/products/...` page's own `<link rel="canonical">` pointed at
         the English URL, actively telling Google "index that one instead,
         this is a duplicate." Fixed: both now use `localize()`.
      2. **No hreflang alternates existed for individual product pages at
         all.** Added a new reviewed-locales allowlist,
         `src/i18n/seoProductLocales.js` (`PRODUCT_TRANSLATED_LOCALES`,
         `reviewedLocalesFor(slug)`) — same "reviewed, not just present in
         the DB" gating philosophy as `TRANSLATED_PATHS` in
         `translatedRoutes.js`, just keyed by product slug. Wired into both
         detail-page components.
      3. **Not in the sitemap.** `/steam` and `/sauna/rooms` added to
         `TRANSLATED_PATHS` (both here and the hand-kept-in-sync mirror in
         `scripts/generate-sitemap.js`) with `zh`; Home's `zh` was already
         translated and spot-checked but had never been flipped on either
         — added there too. Added a parallel `PRODUCT_TRANSLATED_LOCALES`
         mirror + `productAlternatesFor()` to the sitemap script so
         individual products get locale-variant `<url>` entries with
         `<xhtml:link rel="alternate">` tags, same as static routes already
         did. Regenerated `public/sitemap.xml` — verified 42
         `hreflang="zh"` tags total, matching the exact expected count
         (Home ×4 + `/steam` ×2 + `/sauna/rooms` ×2 + 17 products ×2).
    - **`sync.js` fixed properly, not worked around**: it was stale in two
      ways, not just the sitemap-blocking one. (1) Its own env loading used
      plain `dotenv.config()` (only reads `.env`), so `SUPABASE_SERVICE_ROLE_KEY`
      — which lives in `.env.local` — was never picked up; it couldn't
      even authenticate. (2) It still tried to re-download every product's
      images/PDFs from Supabase Storage bucket paths to a local
      `saworepo2/images`+`files` folder (a sibling repo) — dead code from
      before the move to Cloudflare Pages/R2: every product's image/file
      URL is already a live CDN URL (`saworepo1.pages.dev/media/...`),
      confirmed by querying live Supabase directly, and Supabase Storage
      buckets for this project were emptied 2026-08-20 (see memory
      `supabase-storage-winddown`) — so even with a valid path, every
      download would have failed. `saworepo2` itself has been discarded
      per the user, confirming there's no destination to repoint it to
      anyway. Rewrote `sync.js` to do only what's still needed — fetch
      products/categories/tags/meta from Supabase and write the JSON
      snapshots, nothing else — and fixed the env loading. Ran it: 380
      products / 17 categories / 724 tags synced in seconds, all 8
      previously-missing products confirmed present. Re-ran
      `generate-sitemap.js` (no manual patch needed this time) — 508 URLs,
      42 `hreflang="zh"` tags, matching the exact expected count.
      `public/sitemap.xml` served locally at `http://localhost:3001/sitemap.xml`.
  - **Script change**: `product-i18n.js extract` previously hardcoded
    `locale: "fi"` — the whole CLI was built during the Finnish-only pilot
    and never updated for the 7-locale expansion. Now accepts an optional
    locale argument (`extract <slug> [locale]`, defaults to `fi` for every
    existing call site/habit), matching `apply`, which already took one.
    Same script, same packet format, works for any of the 7
    `PRODUCT_TRANSLATION_LOCALES` now.

### Site-wide all-products `zh` batch (started 2026-09-02)

User asked to continue `zh` translation across **all** products, not just
the Sauna Heaters set above. Baseline check via SQL (published, visible,
not-deleted products): **380 total, 128 already had `zh`, 252 missing**
at the start of this batch. Unlike the Sauna Heaters batch, this spans
every category — mostly non-heater accessories that translation memory
hasn't touched before, so TM pre-fill is much weaker here (many products
extract with 0 pre-filled fields, vs. near-100% for repeat heater model
families). Working through it in smaller ad-hoc batches (not a fixed
5-day schedule like heaters) since category sizes vary wildly — tracked
here as flat progress-log entries rather than a per-day table. Remaining
category breakdown at batch start (excludes anything already counted in
the Sauna Heaters batch above): Sauna Accessories 50, Heater Accessories
46, Thermometers 26, Heater Guard 26, Doors & Handles 25, Sauna Controls
23, Pails 20, Kivistone 18, Integration Collar 16, Ladles 15, Ventilation
& Miscellaneous 12, Benches 11, Sauna Lights 11, Floor 8, Clocks & Timers
7, Infrared 6, Headrest & Backrest 6, Accessory Sets 4, Cloth Hangers 4,
Spare Parts 3, Humidifiers 3, Wooden Floor Mats 3, Combi 3, Sauna Stones
2, Steam Controls 1, Pail Shower 1 (a product can count in more than one
category, so this sums higher than 252).

**Naming convention note, established this session**: unlike heater model
names (Cumulus, Nimbus, Aries — proprietary marketing names kept in
English), generic accessory product names ARE fully translated (e.g.
"Aroma Pump" → "香薰泵", confirmed against an existing `zh` row from an
earlier session). Wood species in variation names are translated too
(Cedar → 雪松, Hemlock → 铁杉, Aspen → 白杨) while model codes in
parentheses stay untouched (e.g. "雪松 (595-D-CNR)"). Set/product-line
names that read as a brand (Signature, Dragon — tied to the Dragonfire
Series) were kept in English, same treatment as heater brand names,
since the surrounding descriptive text is what actually needed
translating.

**Batch 1 — 24 products (2026-09-02)**: picked from the smallest
remaining categories to make fast initial progress: Sauna Stones (2:
`sauna-stones-olivine-diabase-rounded-20kg`,
`decorative-sauna-stones-white-quartz-rounded-10kg`), Steam Controls (1:
`steam-ste`), Pail Shower (1: `pail-shower`), Combi (3, actually Nordex
heater-family products tagged with the "Combi" category —
`nordex-s-combi-ns`, `nordex-s-combi-black-ns`, `nordex-pro-combi-ns` —
these also count toward the still-unstarted Day 2/Nordex row of the
Sauna Heaters batch table above, not yet marked there since that table
tracks the full 24-product Nordex family as one day), Humidifiers (3
Cozy Tank sizes), Spare Parts (3), Wooden Floor Mats (3), Accessory Sets
(4: Traditional/Essential/Dragon/Signature), Cloth Hangers (4). All 24
done via `product-i18n.js extract/apply`, verified via SQL —
`product_translations` rows present with `source_field_hashes` populated
for every one. New `spec_table_headers` field type encountered for the
first time in this session (simple accessories use a 2-column
Specification/Detail table rather than the heaters' full HTML
`description` table) — translated `["Specification","Detail"]` →
`["规格","详情"]` consistently across all of them. Post-batch count:
**228 of 380 products still missing `zh`** (down from 252). Continuing
in further batches; check this section (or `/admin/translations`, the
live source of truth) before resuming to avoid re-doing a category.

**Batch 2 — 20 products (2026-09-02)**: Clocks & Timers (7, all done:
`loisto-wooden-clock-round`, `sand-timer-tag-15min`, `sand-timer-15min`,
`loisto-clock-square`, `sand-timer-kanto-15min`, `wooden-pail-clock`,
`wooden-pail-clock-small`), Headrest & Backrest (6, all done:
`halu-anti-theft-headrest`, `wooden-backrest`, `wooden-backrest-slim`,
`halu-wooden-headrest`, `wave-wooden-backrest`, `wave-wooden-headrest`),
Infrared (6, all done: `infrared-panels`, `infrared-backrest`,
`infrared-2-0-power-controller`, `infrared-2-0-built-in-control`,
`infrared-2-0-user-interface`, `interface-holder`), plus 1 Nordex
heater-family product picked up from the "Floor" category
(`nordex-floor-ns` — same Day 2/Nordex row as the 3 Combi variants in
Batch 1 above; the remaining Nordex Floor/S/Pro variants are still
untranslated). All 20 verified via SQL — `product_translations` rows
present with `source_field_hashes` populated. **Naming precedent
extended**: brand/model-line names that read as marketing names (Halu,
Loisto, Kanto — all Finnish product-line names, same treatment as
Signature/Dragon) kept in English with only the descriptive suffix
translated (e.g. "Halu Anti-theft Headrest" → "Halu 防盗头枕"); purely
descriptive names (Wave, Wooden Backrest) translated in full. "Infrared
2.0" kept untranslated as a model designation, same pattern as "Steam
2.0". Post-batch count: **208 of 380 products still missing `zh`** (down
from 228). Clocks & Timers, Headrest & Backrest, and Infrared categories
are now fully done for `zh`.

**Batch 3 — 15 products, Ladles category complete (2026-09-02)**: all 15
Ladles products done — `stainless-steel-ladle-with-curved-handle`,
`dragon-ladle`, `kanto-ladle`, `stainless-steel-ladle-40cm`,
`stainless-steel-ladle-siro-46-5cm`, `stainless-steel-ladle-siro-70-5cm`,
`stainless-steel-ladle-usva-40cm`, `steamshot-ladle`,
`wooden-ladle-puro-81cm`, `wooden-ladle-puro-51cm`,
`wooden-ladle-puro-67cm`, `wooden-ladle-standard-36cm`,
`wooden-ladle-standard-42cm`, `wooden-ladle-standard-52cm`,
`wooden-ladle-standard-68cm`. All verified via SQL. **Naming precedent
extended again**: product-line names for ladles (Siro, Usva, Kanto,
Puro, Steamshot — all Finnish/marketing names) kept in English with only
the descriptive noun translated (e.g. "Stainless Steel Ladle Siro
46.5cm" → "Siro 不锈钢桑拿勺 46.5cm"); the plain "Wooden Ladle Standard
_cm" line has no brand word so translated in full ("标准木质桑拿勺"). The
Finnish word "löyly" (sauna steam/the act of pouring water on hot
stones) was kept untranslated in every short_description, same as the
English source keeps it italicized/untranslated — no established
Chinese equivalent exists in the site's copy, so preserved rather than
inventing one. Post-batch count: **193 of 380 products still missing
`zh`** (down from 208). Ladles category is now fully done for `zh`.

**Source bug cleanup (2026-09-02)**: both previously-flagged-not-fixed
English source bugs are now fixed directly in the `products` table, per
user request. (1) `nimbus-combi-ns.description` — the `"kW$1<br>Heater"`
/ `"kW$1<br>Tank"` template artifact (2 occurrences) replaced with plain
`"kW"`. (2) `cumulus-nb`/`cumulus-ni2`/`cumulus-ns.short_description` —
the "wall-mounted with heater" double-word and orphaned "It comes"
clause fixed to read: "The Cumulus is an elegant minimalist wall-mounted
heater with stainless steel casing accented by a decorative Finnish
soapstone front. The soapstone helps to heat the stones faster and
store the heat longer. With a built-in aroma cup, the Cumulus is a
smart option for adding a touch of spa to sauna sessions through
aromatherapy." No translation content needed to change — both `zh`
translations (and Cumulus's existing `fi`) were already translated by
*intended* meaning per the original flagging note, so they already read
correctly. Re-ran `product-i18n.js apply` for all 4 products (zh) +
3 Cumulus (fi) with their existing packets, purely to refresh
`source_field_hashes` against the corrected English source — otherwise
`/admin/translations` would have flagged all of them "stale" the moment
the English changed, even though nothing was actually wrong. Verified
via SQL: neither bug string exists in the `products` table anymore.

### Tooling upgrade (2026-09-02) — read this before starting a new batch

User asked for the remaining-228-products pace to be sped up. Three
changes landed, all documented in full in the new
`PRODUCT-TRANSLATION-CONVENTIONS.md` (read that file before translating
anything — this entry is just the changelog pointer):

1. **`product-i18n.js` gained `pending`, `extract-many`, and
   `apply-many` commands.** `pending <locale> [category]` replaces the
   hand-written SQL query every batch used to start with. `extract-many`/
   `apply-many <locale> <slugs|->` loop the existing extract/apply logic
   over a whole slug list in one Node process (accepts a comma list or
   `-` for stdin, so `pending`'s output pipes straight in) instead of one
   process launch per product.
2. **A `MATERIAL_WORD_DICTIONARY` (zh) auto-translates variation names**
   shaped `"<Material/Color> (<model code>)"` — the single biggest
   source of repeated hand-translation, since the model code makes each
   full string unique to translation_memory's exact-match lookup even
   though the material word itself repeats constantly. Marked in a
   packet's `tmPrefilled` with `"via": "material-dictionary"`. Currently
   covers Cedar/Aspen/Hemlock/Alder/Pine/Spruce/Birch/Black/White/
   Grey/Silver/Natural/Aluminum/"Black Metal" — extend it in
   `product-i18n.js` (search `MATERIAL_WORD_DICTIONARY`) the moment a
   new one shows up rather than only hand-fixing that one packet.
3. **`PRODUCT-TRANSLATION-CONVENTIONS.md`** (new file, repo root)
   consolidates every naming rule from this log into one reference doc
   — which brand/product-line names stay English, common header/feature
   phrase translations, the prose-vs-data table-header rule, how to
   handle a templated micro-category with a one-off fill script instead
   of hand-editing JSON, and the source-bug-fixing rule. Point any new
   session or parallel agent at this file first.

Parallel-agent note: 3 agents were launched to translate Thermometers/
Doors & Handles/Benches concurrently as a first test of this approach.
All 3 were killed by a session interruption before finishing — they
had run `extract-many` (packets exist) but none had translated or
applied anything. Not a tooling failure, just bad timing; re-verified
via `pending` (all 3 categories still showed 100% missing) before
redoing the work directly rather than trusting the "launched" state.
Worth retrying agent parallelization once a session isn't expected to
be interrupted mid-run — the CLI tooling itself worked fine when driven
directly (see Batch 4 below, same categories, done in one session).

**Batch 4 — 65 products across 4 categories (2026-09-02)**: Pails ×3
(`dragon-pail-9l`, `usva`, `kanto` — done by hand while validating the
new CLI commands), **Thermometers, complete (26/26)**, **Benches,
complete (11/11)**, **Doors & Handles, complete (25/25)**. Thermometers/
Benches/Doors & Handles were each filled via a one-off Node fill script
per the new "templated micro-categories" convention (see
`PRODUCT-TRANSLATION-CONVENTIONS.md`) rather than hand-editing 62
packets individually — each script hand-maps `name` per slug and
derives `short_description` from the English source's own dimensions/
flags via regex, not from guessing. New `type` translations added:
Thermometers → 温度计, Benches → 长椅, Doors & Handles → 门与拉手, Pails →
水桶. All 65 verified via SQL (`product_translations` rows present,
`source_field_hashes` populated) and via `pending` reporting 0 for all
three categories. Post-batch count: **128 of 380 products still missing
`zh`** (down from 193).

**Batch 5 — Pails complete, 3 more parallel-agent attempts, Heater Guard
+ Sauna Lights complete (2026-09-02/03)**: **Pails, complete (20/20)**
— remaining 17 done directly (`wooden-pail-rattan-4l`,
`stainless-steel-pail-with-curved-handle`, `steamwater-pail-4l`,
`stainless-steel-pail-with-wooden-handle`, `steamwater-pail-9l`,
`wooden-cover-for-392`, `dragon-pail-4l`, `lovi`, `wooden-pail-28l`,
`wooden-pail-rattan`, `wooden-cover-for-381`, `wooden-cover-for-391`,
`wooden-pail-18l`, `wooden-pail-classic`,
`wooden-pail-rattan-with-stainless-steel-insert`,
`wooden-pail-traditional`, `wooden-pail-40l`) — `type` "Pails" already
pre-filled "水桶" from translation_memory, confirming TM reuse compounds
as intended. New brand-line names kept English: Lovi, Steamwater
(same treatment as Halu/Loisto/Kanto/Puro/Usva/Siro/Steamshot).

Two more rounds of parallel agents were tried on Sauna Accessories (~45),
Heater Accessories (~43), and Heater Guard (26) — **both rounds got
killed by session interruptions before translating anything**, same
failure mode as the first attempt logged above. Re-verified via
`pending` each time rather than trusting agent "launched" status.
**Heater Guard did leave behind 26 fully-extracted-but-untranslated
packets** (committed to the repo directly by the user in the interim,
commit `7598adff`) — picked those up and finished them rather than
re-extracting: **Heater Guard, complete (26/26)**, via the templated-
micro-category fill-script pattern (2-4 short_description variants
depending on wood-species wording and whether the product mentions
Cubos-specific install locations; spec_table_headers header dictionary
extended with Model→型号, Material→材质, Length/Width/Height/Depth
(mm)→长度/宽度/高度/深度 (mm)). New `type`: Heater Guard → 加热器护栏.
Also finished my own previously-stalled **Sauna Lights (11/11)** extract
(from the interruption right before the `main`-branch-merge request) —
Himalayan Salt Wall tiles + Wooden Light Covers + Wooden Curve Lights,
new `type`: Sauna Lights → 桑拿灯具.

**Lesson reinforced**: parallel background agents keep dying to session
interruptions before producing translated output (extraction survives,
translation+apply doesn't) — three separate attempts now. Prefer doing
batches directly (or via the fill-script pattern for templated
categories) over relying on parallel agents until this environment's
interruption behavior changes; if an agent's `extract-many` output is
found sitting untranslated on disk from a prior dead attempt, translate
and apply it directly rather than re-extracting.

Post-batch count: **75 of 381 products still missing `zh`** (down from
128; total product count ticked up by 1 between checks, unrelated to
this batch). Pails, Heater Guard, and Sauna Lights are now fully done
for `zh`. Remaining: Sauna Accessories (45), Heater Accessories (43),
Sauna Controls (20), Kivistone (18), Integration Collar (16),
Ventilation & Miscellaneous (13), Floor (4, leftover Nordex heater
variants — see Sauna Heaters batch Day 2 table above).

**Batch 6 — Sauna Accessories, Heater Accessories, Integration Collar
all complete (2026-09-03)**: the "45"/"43" remaining counts logged above
were stale — re-querying found only 19 products actually still missing
across these overlapping categories (a product counts once per category
it's tagged with, so a lot of the earlier count was double-counting
Integration Collar products also tagged Sauna Accessories/Heater
Accessories). All 19 done: 16 Integration Collar variants
(`integration-collar-{sawo30,tower}-{wall,corner}-stainless`,
`integration-collar-round-{v2-,}stainless`, `integration-collar-round-
wooden`, `integration-collar-phoenix-stainless`, `integration-collar-
cubos-{corner,middle,wall}-{stainless,wooden}`, `integration-collar-
{corner,wall}-wooden`) plus 3 standalone safety/hood products
(`safety-switch-for-heaters`, `helius-heater-hood`, `emergency-stop-
button-switch-estop`). New `type` translations: Integration Collar →
集成环, Safety Switch → 安全开关, Heater Hood → 加热器防护罩. Two short_description
templates cover 14/16 collar variants (a "stainless" boilerplate listing
material options, a shorter "Hemlock wood" boilerplate for the wooden
ones) — only the 3 standalone products needed fully custom translation.
Collar model-name translation followed the established brand-vs-generic
split: heater brand words kept English (SAWO30, Tower, Phoenix, Cubos),
generic shape words translated (Corner→转角式, Wall→壁挂式, Round→圆形,
Middle→居中式). 3 of the 19 `apply` calls hit a transient network error
on the first attempt (`fetch failed`, not a data problem) — retried
individually, all succeeded. Verified via SQL (19/19 present with
`source_field_hashes`) and `pending` (0 for both categories). Post-batch
count: **56 of 381 products still missing `zh`** (down from 75).
Remaining: Sauna Controls (20), Kivistone (18), Ventilation &
Miscellaneous (13), Floor (4, leftover Nordex), Wall-Mounted (1).

**Batch 7 — Sauna Controls complete (2026-09-03)**: all 20 remaining
Innova/Saunova/sensor/interface-holder products
(`innova-classic-2-0`, `saunova-simple`, `sawo-sense`,
`rectangular-interface-holder-for-2-0-controls`,
`optional-humidity-sensor-temperature-for-bench`,
`optional-second-temperature-sensor-for-bench`,
`innova-classic-built-in`, `saunova-2-0-power-controller`,
`saunova-2-0-contactor-unit`, `innova-classic-2-0-built-in`,
`innova-2-0-power-controller`, `innova-classic`,
`innova-stainless-steel-touch`, `innova-2-0-contactor-unit`,
`saunova-2-0-plus`, `rectangular-interface-holder-for-innova-classic-
control`, `oval-interface-holder-for-innova-classic-control`,
`saunova-2-0-built-in`, `saunova-2-0`, `temperature-sensor`).
**Not templated** — unlike recent batches, each product has genuinely
distinct technical content (feature lists, kW thresholds, model codes),
so every one was hand-translated individually rather than via a
fill-script, per the user's explicit "make sure translations are right"
request. All model codes (INN-IH23, SAU-PS-V2, INP-C, etc.), kW values,
and cable/wire lengths preserved exactly; only prose translated.
"Innova"/"Saunova" kept as English brand names throughout (including in
`type`, matching the heater-brand precedent) — `type` translated where
generic: Sensor → 传感器, Interface Holder → 界面支架 (already an
established translation, reused via TM), "Coming Soon" (sawo-sense's
placeholder type) → 即将推出. European-comma decimals in the English
source (`9,0kW`, `18,0kW` on `sawo-sense`/`saunova-2-0-plus`) corrected
to `9.0 kW`/`18.0 kW` in the translation only, consistent with the
established catalog-wide unit-spacing fix — English source left as-is.
**One flagged-not-fixed source bug** (translation preserved faithfully,
not fixed): `saunova-simple`'s dimensions feature reads `"(D)
137mm3"` in English, almost certainly a typo — the same-shape sibling
product `saunova-2-0` lists `"(D) 37mm"` for what looks like an
identical physical enclosure. Translated the label only, left the
number exactly as printed in English, per the "don't silently correct
data" rule. 1 of 20 `apply` calls hit a transient network error on
first attempt, succeeded on retry. Verified via SQL (20/20 present with
`source_field_hashes`) and `pending` (0 remaining). Post-batch count:
**36 of 381 products still missing `zh`** (down from 56). Remaining:
Kivistone (18), Ventilation & Miscellaneous (13), Floor (4, leftover
Nordex), Wall-Mounted (1).

**Batch 8 — Kivistone complete (2026-09-03)**: all 18 soapstone
accessory products (`candle-holder-tower-{r131,r132,r133}`,
`aroma-cup-50`, `aroma-spirit-cup`, `luxury-aroma-cup-50`,
`candle-holder-straight`, `cooler-{1,2}-hole`, `cooler-w-{2,4}-shot-
glasses`, `scent-warmer`, `tower-set-3`, `spa-stones-set`, `stone-plate-
{large,small}`, `soap-holder`, `wine-cooler-stone`) via the templated
fill-script pattern — one English short_description shape (`"The SAWO
X is a soapstone <descriptor> measuring <dims>, <weight>kg, part of the
Kivistone accessory line[, used for...]"`) covering all 18 with only
the descriptor noun, dims, weight, and an optional aroma/chilling-use
clause varying. **"Kivistone" itself kept untranslated** in both `type`
and every short_description — unlike the generic descriptive product
names (Candle Holder → 烛台, Cooler → 冷酒石, Aroma Cup → 香薰杯, etc., all
translated in full), Kivistone is the actual soapstone product-line
brand name used as a site navigation tab (see `products-page-reorg`
project memory), so it gets the same brand-name-stays-English treatment
as Cumulus/Nordex/Halu/etc. Heavy network flakiness during this batch —
6 of 18 `apply` calls failed on the first pass (`fetch failed`) and the
whole `apply-many` run itself timed out once; all recovered via
individual per-slug retries, no data lost. Verified via SQL/`pending`
(0 remaining). Post-batch count: **18 of 381 products still missing
`zh`** (down from 36) — only Ventilation & Miscellaneous (13), Floor (4,
leftover Nordex heaters), and Wall-Mounted (1) left.

**Batch 9 — SITE-WIDE `zh` PRODUCT TRANSLATION COMPLETE (2026-09-03)**:
finished the last 3 categories. Ventilation & Miscellaneous (13/13):
`sauna-signage`, `display-stand-wall-{1,2,3}`, `ventilation-cover-
circle-{641d,640mbr}`, `sauna-grille-622-d` (had no English
`short_description` to begin with — left `null`, correctly matching
source), `ventilation-louver-circle-{634d,631d}`,
`ventilation-louver-square`, `ventilation-louver-circle-with-black-
option-{639d,638d}`, `moisture-paper` — via a hand-written per-slug fill
script (13 genuinely distinct products, not a single repeatable
template, so no shared short_description string). New `type`:
Ventilation & Miscellaneous → 通风与杂项配件. One new material-dictionary-
style word found and translated inline (not worth adding to the shared
dictionary for a single occurrence): "Metallic Brown" → 金属棕色. Floor
(4/4): the last remaining Nordex heater-family stragglers
(`nordex-s-black-ns`, `nordex-pro-ns`, `nordex-floor-black-ns`,
`nordex-s-ns`) — mostly already TM-prefilled from the earlier Nordex/
Sauna Heaters batches, only spec-table headers and two Nordex-S-specific
features ("Overheat protection" → 过热保护, "Automatic shut-off for
safety" → 安全自动关闭功能) needed fresh translation; careful to preserve
`nordex-s-black-ns`'s different axis-label order ("Width Depth Height"
vs. the usual "Length Width Height") exactly as printed in the English
source. Wall-Mounted (0 remaining — was already fully done before this
batch started, the "1" in the running category count was double-counted
against Sauna Controls/other overlapping categories).

**Final SQL sweep found ONE straggler outside all category counts**:
`krios-ni2a` (Krios Ni2a, Wall-Mounted) — a heater variant not caught by
any `pending`-per-category query because of how it slipped through the
Kivistone/Sauna Controls-era category snapshots. Extracted, translated
(mostly TM-prefilled from the existing Krios family — only the spec-
table headers needed fresh translation), applied, and reverified.

**Verified via direct SQL query against every published+visible+not-
deleted product in the `products` table (not a per-category `pending`
sum, which can double-count or miss products spanning categories):
0 of 381 products now missing a `zh` `product_translations` row.**
`npm run i18n:manifest` clean, `CI=true npx react-scripts build`
compiles with zero errors. This closes out the "all products zh"
effort started in the "Site-wide all-products `zh` batch" section above
— every product in the live catalog now has a Chinese translation.
Still outstanding, out of scope for this effort and tracked separately:
`fi` coverage for everything translated during this zh-focused push
(most of it currently falls back to English for Finnish visitors — see
each batch's notes above for exactly which slugs/pages need `fi`),
native-speaker review before flipping anything into `TRANSLATED_PATHS`
to go live, and the page-level `sauna.json` `fi` staleness (28 keys
behind) flagged earlier in this file.

### Site-wide all-products `fi` push (started 2026-09-03)

With `zh` fully done, started the equivalent push for Finnish (`fi`).
Baseline: **303 of 381 products missing `fi`** — most of what got
translated to `zh` this week was never done in `fi` (only the original
Day 1 heaters pilot batch — Aries/Cubos/Cumulus — plus a handful of
others have `fi`). Same tooling, same batch approach as the `zh` push.

**Locale-specific setup**: extended `product-i18n.js`'s
`MATERIAL_WORD_DICTIONARY` to cover `fi` (Cedar→Setri, Aspen→Haapa,
Hemlock→Hemlokki, etc. — see `PRODUCT-TRANSLATION-CONVENTIONS.md` for
the full list), since it previously only had a `zh` entry and every `fi`
extract was getting 0 material-word pre-fills. Confirmed established
`fi` phrasing by reading an already-applied product
(`cumulus-nb`'s live `fi` row from the original pilot) rather than
inventing fresh wording — found "Tehoalue: X – Y kW" (Power range),
"Saatavilla oleva ohjaus: X" (Available controls), "Ruostumaton
teräskuori" (Stainless steel casing), "Sisäänrakennettu aromikuppi"
(Built-in aroma cup) already established; extended with "Ominaisuus"/
"Tiedot" for the `["Specification","Detail"]` 2-column spec-table header
pair (not previously translated for `fi` — the pilot batch used full
HTML description tables, not this simpler 2-column shape). Same
"don't reformat data" rule applies: kept the English source's PERIOD
decimal separator in kW/mm figures rather than switching to the
Finnish-typical comma, for consistency with every number elsewhere in
the catalog.

**Batch 1 — 22 products (2026-09-03)**: Pail Shower (1), Stones/Nimbus
(2: `nimbus-combi-ns`, `nimbus-ns`), Sauna Stones (2), Wooden Floor Mats
(3), Humidifiers (3: Cozy Tank sizes), Spare Parts (3), Cloth Hangers
(4), Accessory Sets (4). All hand-translated (too varied for a single
fill-script template at this small scale). Naming calls: "Traditional"
→ "Perinteinen" (plain descriptive word, translated); "Dragon",
"Essential", "Signature" kept in English — unlike `zh` where only
Dragon/Signature were kept English and Essential was translated,
for `fi` all three read naturally as English loanwords in Nordic retail
branding, so translating "Essential" into a literal Finnish word
("Olennainen") would have read worse, not better; this is a deliberate
per-locale judgment call, not a mechanical mirror of the zh precedent.
Verified via SQL (22/22 present with `source_field_hashes`). Post-batch
count: **281 of 381 products still missing `fi`** (down from 303).

**Batch 2 — 19 products (2026-09-03)**: Headrest & Backrest (6, all
done: `halu-anti-theft-headrest`, `halu-wooden-headrest`, `wave-wooden-
backrest`, `wave-wooden-headrest`, `wooden-backrest`, `wooden-backrest-
slim`), Clocks & Timers (7, all done: `loisto-clock-square`, `loisto-
wooden-clock-round`, `sand-timer-15min`, `sand-timer-kanto-15min`,
`sand-timer-tag-15min`, `wooden-pail-clock`, `wooden-pail-clock-small`),
Infrared (6, all done: `infrared-2-0-built-in-control`, `infrared-2-0-
power-controller`, `infrared-2-0-user-interface`, `infrared-backrest`,
`infrared-panels`, `interface-holder`). Confirmed the `fi` material
dictionary and "Ominaisuus"/"Tiedot" spec-header translation from
Batch 1 are now compounding through `translation_memory` exactly as
designed — every product in this batch had its `spec_table_headers`
and variation names fully pre-filled, only `name`/`short_description`/
`type` needed fresh translation. New `type` translations: Headrest &
Backrest → Niskatuet ja selkänojat, Clocks & Timers → Kellot ja
ajastimet, Infrared Controls → Infrapunaohjaimet, Infrared Accessories
→ Infrapunatarvikkeet. Verified via SQL/`apply-many` (19/19 applied).
Post-batch count: **262 of 381 products still missing `fi`** (down from
281).

**Batch 3 — 23 products, Ladles complete + Dragonfire complete
(2026-09-03)**: Ladles (15/15 — same slug list as the earlier `zh`
Ladles batch), all via a fill-script parsing dims/material from the
English source, mirroring the `zh` Ladles approach exactly but in
Finnish; new `type`: Ladles → Kauhat; "löyly" kept untranslated per the
existing rule. Dragonfire (8/8 — Minidragon ×4, Scandifire ×4): unlike
Ladles, this was **not zh-only prior art copied over** — confirmed
established `fi` phrasing already existed in `translation_memory` for
this heater family from the original Day 1 pilot (features like
"Tehoalue", "Junglefire-kuvioitu kuitupinnoite" pre-filled on
extraction), and confirmed the exact heater spec-table header
translations (Heater Model → Lämmitinmalli, Sauna Room → Saunahuone,
Size of Heater → Lämmittimen koko, Minimum Safety Distances →
Vähimmäisturvaetäisyydet) by reading `cumulus-nb`'s already-applied `fi`
row rather than guessing — now added to
`PRODUCT-TRANSLATION-CONVENTIONS.md`. Only `short_description` +
remaining feature bullets ("Wall mounted", "Can fit Nkg of stones",
etc.) needed fresh translation. **Same garbled-English source bug as
the zh pass** hit again on `minidragon-black-nb` ("is boasts a sleek,
compact design that fits seamlessly into suitable for... perfect for
sauna room") — translated the intended meaning coherently in `fi` too,
consistent with how it was handled in `zh`; not fixed in the English
source (already flagged, out of scope). Verified via SQL/`apply-many`
(23/23 applied). Post-batch count: **239 of 381 products still missing
`fi`** (down from 262).

**Batch 4 — 36 products, Combi complete + Benches complete + Sauna
Lights complete (2026-09-04)**: Combi heaters (14/14:
`savonia-combi-ns`, `mini-combi-ns`, `mini-combi-fibercoated-ns`,
`nordex-mini-combi-ns`, `nordex-combi-black-ns`, `nordex-s-combi-ns`,
`nordex-combi-ns`, `scandia-combi-fiber-coated-ns`,
`nordex-mini-combi-black-ns`, `scandia-combi-ns`,
`savonia-combi-fiber-coated-ns`, `nordex-s-combi-black-ns`,
`taurus-d-combi-ns`, `nordex-pro-combi-ns`) — hand-translated
short_description (all have distinct marketing copy, not a templated
category) plus the HTML `description` spec-table headers on all 14
(none had been touched by any prior pre-fill, since Combi is a new
category for this push); `type` stayed the bare brand name per
convention, unchanged. Benches (11/11) and Sauna Lights (11/11) via a
fill-script (`fill-fi-benches-lights.mjs`, same pattern as the zh
Thermometers/Doors script): Benches `type` → Penkit, Sauna Lights
`type` → Saunavalaisimet; Himalayan Salt Wall tile dims parsed from the
English "L/W/D" pattern, Wooden Light Cover / Curve Light dims parsed
generically. Verified via `apply-many` (31/36 succeeded first pass, 5
hit `fetch failed` network flakiness — same recurring issue as earlier
in the session — retried individually, 5/5 succeeded on retry, 36/36
total). Post-batch count: **203 of 380 products still missing `fi`**
(product total dropped 381→380 between checkpoints — one product was
removed from the catalog, not a translation regression).

### zh completeness audit (2026-09-04)

With the `zh` push having been declared complete on 2026-09-03, ran a
fuller audit before starting more `fi` work, since `pending` only
catches products with **no** translation row at all — it can't see a
row that exists but has gone stale because the English source changed
*after* translation. Wrote `check-translation-staleness.mjs` (kept
permanently in `scripts/`, not a scratch file — takes a locale arg,
defaults to `zh`) to compare each product's live English content hash
against the `source_field_hashes` stored on its translation row, using
the same `computeSourceFieldHashes`/`hashSourceValue` the apply step
itself uses, so "stale" here means exactly what the admin UI's own
staleness flag means.

Found real gaps `pending` had missed:
- **`krios-floor-ns`** — missing `zh` entirely (a product added after
  the original push finished). Translated fresh: name/type kept as
  "Krios"/"Krios Floor NS" (brand, per convention), short_description
  and the description table's headers translated.
- **`ste-steam-generator`** — `variations[0..2].spec_table_headers[3]`
  flagged stale (English source's column-3 header text had changed
  since translation), but TM already had the correct new zh string on
  re-extract, so no manual edit was needed — just re-`apply` to refresh
  the hash.
- **`steam-2-0`** — `features[0..3]` stale; the product had picked up
  new English feature bullets ("Suitable for STN Steam Generators",
  "Optional features Aroma, Fan and Dimmer", etc.) since its original
  zh translation. Translated the 2 genuinely-new bullets by hand
  (others were already zh from before and just needed the hash
  refresh).

All 3 fixed and re-applied. Re-ran the audit: **0 missing, 0 stale
across all 381 zh rows** — `zh` is now both complete and current, not
just complete-as-of-last-check.

Also ran the same audit against `fi` out of curiosity (not part of the
`fi` push itself, since `fi` is still mid-push and expected to have
many missing rows) — found the *same* `ste-steam-generator` /
`steam-2-0` staleness, plus a third, `steam-ste`, also stale on
`features[0..3]` for the identical reason (new English bullets added
after its original `fi` translation from the Day 1 pilot). Fixed and
re-applied all 3 for `fi` too, same approach.

**Lesson for future batches**: run
`node scripts/check-translation-staleness.mjs <locale>` periodically
(not just `pending`) — a locale can look "100% done" by the missing-row
count while quietly holding stale content from source edits made after
the fact. Cheap to run (one pass over all products), worth doing before
declaring any locale's push finished, and worth re-running occasionally
even after "finished" if the English catalog keeps getting edited.

## Home / global chrome

| Route / area | Wired | FI written | Live | Notes |
|---|---|---|---|---|
| `/` (Home) | ✅ | ✅ (fi, de, **zh**) | ✅ (fi + de) | zh added 2026-08-26 as a timing/quality pilot — reachable via the language switcher (not yet in `TRANSLATED_PATHS`, so no hreflang claim, and not native-reviewed). |
| Header / nav | ✅ | ✅ (fi, de, zh) | — | `nav.json`, shared chrome. |
| Footer | ✅ | ✅ (fi, de, zh) | — | `footer.json`, shared chrome. |
| `product.json` (individual product page copy) | ✅ | ✅ (fi, zh) | — | Feeds `DispProduct.jsx`; separate from the Supabase `product_translations` pilot (see README-i18n.md's "Product content" section). **2026-08-26**: found and fixed `DispAccessories.jsx` and `DispSaunaRoom.jsx` — the individual accessory-product and individual sauna-room detail templates — had **zero** i18n wiring at all (no `useLocaleT`, no `localize()`, unlike `DispProduct.jsx` which was already wired). Every "Resources"/"Specifications"/"Technical Data"/"You might also like"/"Related Products" label, the not-found fallback state, and internal `<Link>`s on those two templates rendered hardcoded English regardless of locale. Wired both to `product.json` (added `sections.technicalData`, `sections.infraredSpecifications`, `moreDetailsSoon`, `notFound.roomTitle/roomDescription/browseRooms`, `related.relatedRooms`) and fixed their locale-dropping links. `zh/product.json` created from scratch (didn't exist before today). Also fixed two misses inside `DispProduct.jsx` itself that an earlier hardcoded-string audit's regex didn't catch: the not-found `error` message was a raw English string that bypassed `t()` entirely when set, and "More details coming soon." was untranslated. **2026-09-01 — remaining `DispSaunaRoom.jsx` gap closed**: wired every label flagged above — `ROOM_TYPE_LABELS`/`SIZE_LABELS` (replaced with `roomTypeLabel()`/`sizeLabel()` helpers reading `product.json`'s new `roomTypes`/`sizeLabels` keys), "Available Door Positions" (`sections.doorPositions`), "Floor Plan" (`sections.floorPlan`, including the image `alt` text), "Bench Configuration" (`sections.benchConfiguration`, both the multi-config and single-config branches), "Details" (`sections.details`), "Description" (`sections.description`), the "Featured"/"Best Seller" badges (`badges.featured`/`badges.bestSeller`), the "Model {{code}} · SKU {{sku}}" line (`modelCode`/`skuCode`), every `StatChip` label (`stats.capacity/floorSize/height/woodType/voltage/panelWattage/totalPower/sessionTime`), the `ResourcesPanel`'s "N Documents"/"Click to expand"/"Click to collapse"/"PDF · Click to open" (`resourcesPanel.*`, with `{{count}}` interpolation), `FeatureTabs`' `Tab N` fallback title (`featureTabs.tabFallback`), and `RelatedRooms`' "More {type} Rooms" (`related.moreTypeRooms`, interpolated with the now-translated type label). Added all new keys to `en`/`fi`/`zh` `product.json`; `npm run i18n:manifest` confirms zero key gap in either locale. Verified via Playwright against two real rooms (`standard-sauna-room-1515` for badges/stats/door-options/bench-config/IR-specs, `compact-sauna-room-1310ms` for features/description) across `/`, `/fi`, `/zh` — every wired label renders translated (e.g. "SAATAVILLA OLEVAT OVIPAIKAT"/"可选门位" for door positions, "LAUDERAKENNE"/"座椅配置" for bench configuration). Door-option `label`/room `features`/`description` text itself is per-room Supabase-sourced content (English source, not translated) — unaffected by this pass, same as before. `DispSaunaRoom.jsx` still reads from a static JSON snapshot rather than live Supabase (see `sauna-rooms-data-sync-gotcha` note) — separate pre-existing issue, still not part of any i18n pass. |
| `common.json` (shared buttons/CTAs) | ✅ | ✅ (fi, de, zh) | — | Includes `catalogFilter.*`, `viewBrochure`, `saunaCalculatorCTA` — see "Home page's full translation dependency list" below for why this file matters more than it looks. |
| `seo.json` (site-wide Organization schema) | — | ✅ (fi, de, zh) | — | Not currently read via `useLocaleT` anywhere (checked 2026-08-26) — tracked for manifest completeness, not a live rendering dependency yet. |

### Home page's full translation dependency list (read this before translating Home into a new language)

Translating `home.json` alone is **not enough** to make the Home page fully
translated — it only covers the page's own copy (hero, the 5 sections). Header, footer, and every shared button/CTA on the page pull from separate
files that must *also* be translated, or they silently render in English
(i18n's fallback-to-source behavior masks this — nothing errors, it just
looks like "some stuff wasn't translated"). This is exactly what happened
with the first Chinese pass: Home content translated, but "Explore More,"
"Inquire Today," and "View Catalogue" stayed English because they live in
`common.json`, not `home.json`.

**Confirmed via `grep -rn 'useLocaleT(' src/pages/Home src/components/Header
src/components/Footer.jsx src/components/SaunaCalculatorCTA.jsx
src/components/PageCTA.jsx` — Home's complete dependency set is:**

| File | Covers |
|---|---|
| `home.json` | Hero, Section1–5 (carousel cards, heater grid, steam/rooms/infrared/controls grid, accessories, CTA) |
| `common.json` | "Explore More," "Inquire Today," "View Catalogue," "View Brochure," Previous/Next, the sauna-calculator CTA banner, `pageCTA` defaults, all 12 `wellnessBenefits` cards |
| `nav.json` | Header menu, dropdowns, search box |
| `footer.json` | Footer columns, office addresses, social links, copyright |

**Don't trust this list blindly for any page other than Home** — re-grep for
that specific page, since which shared components it pulls in isn't always
obvious from the page file alone. See `README-i18n.md`'s "Always check the
`shared` table too" note for the tooling fix that now catches this
automatically: `npm run i18n:manifest` prints a `shared` table alongside
`pages` — a shared namespace showing `stale`/`missing` there means **every**
page using it is incompletely translated, not just the one you're looking at.

## Infrared section

| Route | Wired | FI written | ZH written | Live | Notes |
|---|---|---|---|---|---|
| `/infrared` (hub) | ✅ | ✅ | ✅ | ⬜ | Done 2026-09-01. New `infrared.json` namespace (`hub`/`saunas`/`panels`/`controls`). Hero, sauna-room intro section, 3 accessory cards + alt text, 3 control cards + alt text, CTA. Benefits carousel (12 cards) translated by reusing `common.json`'s existing `wellnessBenefits` keys rather than duplicating that copy — same pattern as Home's Section3.jsx. All internal links (`/infrared/saunas`, `/products/:slug` x2) wrapped in `useLocalizedPath()`. Key-parity verified 57/57 across en/fi/zh, `npm run i18n:manifest` confirms `infrared: source/translated/translated`. Needs native review before going live. |
| `/infrared/saunas` | ✅ | ✅ | ✅ | ⬜ | Done 2026-09-01. Hero, brochure button + PDF item label. `SaunaRoomViewer`'s room title/description were **already wired** (reused from `sauna.json`'s `roomsPage.roomTitles/roomDescriptions.infrared` — fixed in an earlier session, see "Infra fixes (2026-08-26)"), so no work needed there. **Found and fixed a real gap in shared components while wiring this page**: `SaunaProductDetails` only auto-translates its `storySections`/`featureText`/`perfCards`/`accordionItems` props when the caller passes the *default* standard-sauna data (`isDerivedFromDefault` check) — since this page always passed its own `IR_SPD_*` data, none of those ever translated, and the `title` prop override bypassed translation entirely too. Fixed by building the translated versions directly from the new `infrared.json` `saunas.productDetails.*` keys and passing those instead of the raw `IR_SPD_*` imports (component itself untouched — this is caller-side, matches how `isDerivedFromDefault` was designed to be worked around). Same issue existed for `SaunaWoodMaterials`: its `WOOD_KEYS` lookup only maps Cedar/Aspen/Pinaceae, so the infrared page's Hemlock item was never translatable via that path — fixed by pre-merging translated `name`/`description`/`traits` from `infrared.json`'s `saunas.woodMaterials.items` onto the existing `IR_MATS_ITEMS` (keeping the untranslatable `image`/`alt` fields), rather than touching the shared `WOOD_KEYS` map. **Also found**: this page renders `<WellnessBenefits />` (the shared 12-card carousel) with no `cards` prop, i.e. the untranslated English default — same "component has i18n, page never passed it" bug class as the two above. Fixed by building the same `tc("wellnessBenefits.<key>...")`-based `cards` array Home's Section3.jsx already builds, and passing it in. Key-parity verified. Needs native review before going live. |
| `/infrared/panels` | ✅ | ✅ | ✅ | ⬜ | Done 2026-09-01. Uses the shared `ProductShowcase` component (unchanged) with all copy now passed as translated props (`infrared.json`'s `panels.*`) instead of hardcoded strings. `seoHreflangAlternates` wired. |
| `/infrared/controls` | ✅ | ✅ | ✅ | ⬜ | Done 2026-09-01. Same `ProductShowcase` pattern as `/infrared/panels`, using `infrared.json`'s `controls.*`. |

Audited per the "Infra fixes (2026-08-26)" process before calling any of the 4 pages done: the 3-word/2-word hardcoded-JSX-text regexes and the `alt|title|placeholder|aria-label="..."` attribute regex both returned zero hits across all 4 files after wiring, every internal `<Link to=...>` (4 call sites) is wrapped in `useLocalizedPath()`, and `useLocaleT` appears ≥2 times in every file. The three shared-component gaps found (`SaunaProductDetails`, `SaunaWoodMaterials`, `WellnessBenefits` all silently rendering English when a caller supplies non-default data/no `cards` prop) are exactly the "JSON is complete, component/page never reads it" failure mode this file has flagged twice before (`SaunaConfigurator.jsx`, `DispAccessories.jsx`/`DispSaunaRoom.jsx`) — worth grepping for the same pattern (`useLocaleT` count on a shared component that also accepts data via props) if a similar catalogue-style page shows up untranslated later.

## About / Support / Careers / News section (2026-09-04)

Session goal: continue the `zh` push into every page still on the "Not
yet touched at all" list below (this list itself was stale — see the
correction under Contact). All pages in this section were **wired from
scratch this session** — confirmed 0 `useLocaleT` hits before starting
each one (a couple, like Contact, turned out to already be partially
wired from an uncommitted working-tree state at session start; noted
per-row). `fi` was **not** touched for any of these — `zh`-only per this
session's request, `fi` remains ⬜ throughout. None are in
`TRANSLATED_PATHS` yet (needs native-speaker review first, same gate as
every other page in this file) — reachable at their `/zh/...` URL
directly, just not offered by the switcher/hreflang yet.

| Route | Wired | FI written | ZH written | Live | Notes |
|---|---|---|---|---|---|
| `/contact` | ✅ | ⬜ | ✅ | ⬜ | **Correction**: this page was NOT actually untouched — found already fully wired (196 `t()` call sites) in the working tree at session start (from an earlier uncommitted session), just missing `zh`. Committed the existing en wiring + `offices.list.*.role`/`categories`/`technicalSubjects`/`customerSubjects` roleKey/labelKey refactor, then added full `zh/contact.json` (184/184 countries translated, 0 key gap vs. en). Country `<option value>` stays the bare English `COUNTRIES` array (sent to Odoo/email backend) — only the *displayed* text is translated, confirmed via `t("countries", {returnObjects:true})` index-aligned lookup. |
| `/about` | ✅ | ⬜ | ✅ | ⬜ | `AboutUs/About.jsx` — hero, Innovation/Not-Limited-by-Borders section (5 paragraphs incl. inline `<b>` tags via `dangerouslySetInnerHTML`), 4 certification badges (ISO 9001/14001, Sauna from Finland, PEFC), Latest News preview cards (3). New `about.json` namespace. |
| `/about/news` | ✅ | ⬜ | ✅ | ⬜ | `AboutUs/LatestNews.jsx` — hero, 3 full articles (Exhibitions, Talent Search, Earthquake Relief in Cebu), partner logo alts, closing CTA. New `news.json` namespace. Fixed 2 locale-dropping links (`careers`/`contact` `<Link>`s) while wiring. |
| `/about/sustainability` | ✅ | ⬜ | ✅ | ⬜ | `AboutUs/Sustainability.jsx` — hero, Commitment section, 3 Eco-Friendly Practice cards, Energy-Smart Design (3 features + info banner), Waste Hierarchy (3-step EU 2018/851 breakdown), Sauna-is-Wellbeing quote block + closing CTA. New `sustainability.json` namespace. The falling-leaves canvas effect (`#leavesContainer` + its `useEffect`) is presentational/locale-agnostic, untouched. |
| `/careers` | ✅ | ⬜ | ✅ | ⬜ | `Careers/Careers.jsx` — hero, Join SAWO intro, all **10** Open Positions rows (title + badges + years-experience where applicable), We Are Hiring box (email/address), 4 department category cards, 4 Why-Work-for-SAWO benefit cards. New `careers.json` namespace. **Convention**: the Finnish job-title subtitles printed next to each English title (e.g. "Elektroniikkasuunnittelija") are kept as literal Finnish text in *both* `en` and `zh` — an existing bilingual-posting convention on this page, not a per-locale translation target. |
| `/support` (hub) | ✅ | ⬜ | ✅ | ⬜ | `Support/Support.jsx` — hero, 4 resource cards (FAQ/Calculator/Manuals/Catalogue), Technical Support contact box, bottom CTA. New `support.json` namespace, `hub` key. |
| `/support/faq` | ✅ | ⬜ | ✅ | ⬜ | `Support/FAQ.jsx` — hero, all **4 categories / ~15 Q&A pairs** (~4,000 words: Finnish Sauna, Building & Installation, Sauna Heater, Using Sauna), sidebar, bottom banner. Per-section data (previously hardcoded in JS as `faqSections`) was **moved entirely into `support.json`'s `faq.sections`** — only per-section `icon` stays in JS (`FAQ_SECTION_ICONS`, keyed by the same `id`). `support.json`, `faq` key. |
| `/support/sauna-calculator` | ✅ | ⬜ | ✅ | ⬜ | `Support/SaunaCalculator.jsx` — intro, dimension fields (width/height/depth/uninsulated + hints, metric vs. imperial), unit toggle, result bar, recommendation section using i18next's automatic `_one`/`_other` plural suffix for the heater-count badge (`t("calculator.reco.badge", {count})`). Fixed a locale-dropping `ProductCard` `<Link to={\`/products/${slug}\`}>`. `support.json`, `calculator` key. |
| `/support/manuals` | ✅ | ⬜ | ✅ | ⬜ | `Support/UserManuals.jsx` — hero, 5 category tabs, series sub-headings (moved `SERIES_LABELS`/`CATEGORY_TABS.label` out of JS into `manuals.tabs`/`manuals.seriesLabels`), search bar, empty/no-results states, PDF modal, product cards, bottom banner. Fixed 2 locale-dropping links (`ProductCard`'s product/room/accessory link, bottom-banner `/contact` link). `support.json`, `manuals` key. |
| `/support/catalogue` | ✅ | ⬜ | ✅ | ⬜ | `Support/ProductCatalogue.jsx` — header band, 8 category tabs, series sub-headings (same `CATALOGUE_TABS.label`/`SERIES_LABELS` → JSON move as manuals), empty state, product cards, bottom CTA. Fixed 2 locale-dropping links (`ProductCard`, bottom CTA). `support.json`, `catalogue` key. |

Every page above: audited with the standard process from "Infra fixes
(2026-08-26)" (3-word/2-word hardcoded-JSX-text regex + `alt|title|
placeholder|aria-label="..."` attribute regex, both zero real hits after
wiring; `grep -c useLocaleT` ≥2 in every file) and confirmed with
`CI=true npx react-scripts build` (zero errors) after every commit.

## Not yet touched at all

Privacy Policy, Sitemap. Neither has any `t()` wiring yet.

## Recommended next batch (updated 2026-09-04)

1. `fi` pass for everything in the "About / Support / Careers / News"
   section above — all 9 pages are `zh`-only right now, same as the
   pattern already run for products (`zh` first, `fi` mop-up second).
2. Privacy Policy, Sitemap — last two untouched pages.
3. Native-speaker review pass on everything marked "ZH written, not
   Live" across the whole file, then flip each path in
   `translatedRoutes.js`.

## Infra fixes (2026-09-01)

- **Real bug, not a translation gap: the Home hero's typewriter animation
  (`src/pages/Home/Hero.jsx`) stayed stuck in whatever locale it first
  mounted in, even after the rest of the page had switched.** Reported by
  the user via a screenshot of `/zh` — the hero `<h1>` ("体验……") was
  correctly Chinese, but the animated line beneath it kept typing English
  ("wellness with ancient tradition"). Root cause: switching language via
  the header dropdown is a **client-side route change** (`/` → `/zh`), and
  because `<Home>`/`<Hero>` is the same element type at the same position
  in the route tree for every locale, React Router does **not** remount
  it — only `useLocale()`'s context value updates, triggering a re-render.
  Every plain `t()`-driven render (the `<h1>`, the button, etc.) picks up
  the new locale immediately because it re-runs on every render. But the
  typewriter text is built once inside a `useEffect(..., [])` that reads
  `SENTENCES` (the translated array) into a closure and then drives a
  manual `setTimeout` char-by-char loop outside of React's render cycle —
  since the effect had an empty dependency array (deliberately, per its
  own comment, to avoid restarting the animation on unrelated re-renders),
  it never reran when the locale changed, so it kept animating the
  sentences captured at the *original* mount.
  - **Fix**: added `locale` (from `useLocale()`) to the effect's
    dependency array — `[locale]` instead of `[]` — so the whole
    type/delete loop restarts (with its own internal state reset, since
    `n`/`i`/`isTyping`/`spans` are all local to the effect body) exactly
    when the locale actually changes, and only then. Depending on
    `SENTENCES` itself would have been wrong — `tHome()` returns a new
    array reference on every render regardless of content, which would
    restart the animation on every unrelated re-render (e.g. the
    `heroLoaded` image-fade state changing).
  - **Why this class of bug is easy to miss**: a fresh page load to `/zh`
    never reproduces it — the component mounts fresh with the correct
    locale from the start, so the effect's closure is correct from
    `n = 0`. It only shows up when a visitor arrives on one locale and
    **switches** to another without a full page reload — exactly the
    header language switcher's normal behavior, and the most common real
    path a visitor actually takes. **Any other locale-derived value read
    once into a `useEffect`/`useRef`/imperative-DOM closure (not a plain
    `t()` call in JSX) is worth checking for the same pattern** — an
    effect with `[]` deps that captures translated text is a symptom, the
    fix is always the same shape: add the primitive that actually should
    invalidate it (`locale`, not the translated array/object itself) to
    the dependency list.
  - Verified with Playwright: loaded `/`, confirmed the typewriter showed
    an English sentence, clicked the header language switcher to 简体中文
    (a real client-side nav, not `page.goto("/zh")`), waited through a
    full type/pause/delete cycle, and confirmed the typewriter text turned
    Chinese without a page reload.

## Infra fixes (2026-08-31)

- **Wired `/steam/controls` and `/steam/accessories`** (`SteamControls.jsx`,
  `SteamAccessories.jsx`, both in `src/pages/Steam/`), following the exact
  pattern already used in `Steam.jsx`/`SteamGenerators.jsx` in the same
  folder: `useLocaleT("steam")` for all copy, `useLocalizedPath()` for the
  internal `<Link>`s (the product-card link in each page, plus
  `ProductCard`'s own `<Link>` in `SteamControls.jsx`). Added `controls` and
  `accessories` namespaces to `steam.json` for en/fi/zh (fi and zh both
  translated in full, not just en — this file previously had `hub` and
  `generators` only). Ran the audit process from the 2026-08-26 entry below
  before marking these wired: `grep -c useLocaleT` (2 in each file — import +
  call site), the 2-and-3-word hardcoded-JSX-text regexes (zero real hits —
  the only matches were CSS values like `translateY(-4px)` inside inline
  `style` ternaries, not text), the `alt|title|placeholder|aria-label`
  attribute regex (zero hits), and the `||\s*t\(` / `?\s*"` pattern check
  (only hit was the `... || t("accessories.fallbackDesc")` fallback chain
  itself, which is correct — not a leftover literal). `CI=true npx
  react-scripts build` compiled with zero errors afterward.
- **Follow-up, same day**: filled the `zh/steam.json` `generators` gap
  noted above — added the missing `generators` namespace (11 keys:
  `meta`, `hero`, `intro`, `loading`, `empty`, `cardEyebrow`,
  `cardFallbackDesc`, `cta`) to `zh/steam.json`, translated in full (not a
  copy of the `en` fallback). Verified via `npm run i18n:manifest`: `steam`
  now reports "translated" for `zh` with zero key gap.
- **Follow-up, same day**: closed the `/sauna` hub's `zh` gap (the manifest
  reported `sauna` as "stale (52 key(s) behind source)" for `zh` — the root
  `meta`/`hero`/`heaters`/`controls`/`accessories` keys that `Sauna.jsx`
  actually reads had never been translated into `zh`, unlike the
  `heatersPage`/`accessoriesPage`/`controlsPage`/`roomsPage` sub-page
  namespaces which were already done). Added all 52 keys, translated in
  full — reused the existing `zh` heater-item captions and accessory-item
  descriptions verbatim where the hub's copy is identical to the sub-page
  copy, translated the hub-only strings (meta, hero, section
  headings/intros, the three `controls.items` — Innova/Saunova/Control
  Accessories) fresh. Verified via `npm run i18n:manifest`: all 4 pages
  (`home`/`product`/`sauna`/`steam`) and all 4 shared namespaces now report
  "translated" for `zh` with zero remaining gaps. `CI=true npx
  react-scripts build` compiled with zero errors afterward.

## Infra fixes (2026-08-26)

- **A page can have complete, key-parity-correct translation JSON and still
  render 100% English, silently, if the component itself never calls
  `t()`.** This is exactly what happened to `SaunaConfigurator.jsx` — the
  JSON was right, `npm run i18n:manifest` reported the page as fully
  "translated," and the checklist above said "Done." None of that checks
  whether a component actually *reads* the JSON. **The manifest tool proves
  the JSON is complete; it does not prove a page is wired.** Two independent
  facts, both required, neither implies the other.
  - **Before marking any page "Wired ✅," grep it (and every component it
    renders) for hardcoded English JSX text that should have been `t()`:**
    `grep -noE '>[A-Z][a-z]+ [a-z]+ [a-z]+' path/to/*.jsx` (catches
    multi-word literal sentences sitting directly in JSX) and
    `grep -noE '(alt|title|placeholder|aria-label)="[A-Z][a-zA-Z ]{4,}"'`
    (catches hardcoded attributes). Zero hits doesn't guarantee full
    coverage, but a hit is a real, fast, cheap-to-check signal — this is how
    the Configurator bug above was actually found and confirmed fixed,
    and how every other "Wired ✅" page in this file was re-verified clean
    on 2026-08-26 (see the audit note under `/sauna/rooms`).
  - A second, weaker but useful check: `grep -c useLocaleT path/to/*.jsx`
    across every component a page renders. A properly wired file has at
    least 2 (the import + one `t(...)` call site) — a `0` on a component
    that's supposed to be translated is worth investigating immediately,
    the way it would have caught `SaunaConfigurator.jsx` on day one. This
    is exactly how `DispAccessories.jsx`/`DispSaunaRoom.jsx` were caught
    2026-08-26 — both had 0 `useLocaleT` occurrences despite being live,
    linked-to individual-product/room detail pages.
  - **The 3-word-minimum regex above has real blind spots — don't trust a
    clean scan as proof.** It missed "Technical Data" (2 words) in
    `DispProduct.jsx`, and it can never catch a hardcoded string sitting
    inside a JS variable rather than directly in JSX text — e.g.
    `const error = !loading && !product ? "Product not found." : null;`
    followed by `{error || t(...)}`, which silently shows the raw English
    string instead of the translated one whenever `error` is truthy. Two
    cheap follow-ups worth doing on any page before trusting it: rerun the
    regex without the 3-word floor (`grep -noE '>[A-Z][a-z]+ [a-z]+'`,
    accepting more noise), and grep for `||\s*t\(` / `? "` patterns — both
    are a tell that a literal string and a `t()` call are living side by
    side, which is usually a bug.
- **A page can have more than one hardcoded-English data source, and fixing
  one doesn't fix the others.** `/sauna/rooms` has at least three separate
  places English strings live: `sauna.json` (i18n catalogs), `SRD_PANELS` in
  `SaunaRoomData.jsx` (fixed 2026-08-25, see below), and `ROOM_CONFIGS`/
  `CONFIGURATOR_STEPS` in that same file (missed until 2026-08-26). Before
  calling a page done, identify **every** file it imports data from, not
  just the one JSON namespace — `grep -rn "from \"\./SaunaRoomData\"" .`
  (or the equivalent for any page-local data file) lists every consumer to
  check.

## Infra fixes (2026-08-25, apply to every page above and below)

- **Fixed a real bug**, not just a translation gap: `SaunaRoomDetails`'s
  "About This Room" panels (pill nav + description + feature list) were
  rendering in English on `/sauna/rooms` even though translated content
  existed. Root cause was a shared-component guard checking `props ===
  DEFAULT_ITEMS` — `SaunaRooms.jsx` passes `SRD_PANELS.filter(...)`, and
  `.filter()` returns a new array, so the check silently failed. Fixed, and
  extracted the correct (identity-based, filter-proof) version into
  `src/i18n/translateSharedItems.js`, used by every `pages/Sauna/rooms/*`
  component that takes an `items = DEFAULT` prop. Documented as a named
  gotcha in `README-i18n.md` under "Wiring a component that's shared across
  pages" — read that before adding a new shared-with-a-default component.
- **Language switcher no longer redirects to home.** It used to send you to
  `/fi`'s or `/de`'s home page instead of the equivalent path on any page
  not yet in `TRANSLATED_PATHS` (`HeaderLanguageSwitcher.jsx`'s old
  `isTranslated(...) ? basePath : "/"` fallback). Now it always mirrors the
  current path 1:1 in both directions — untranslated strings on a partially
  wired page fall back to English per-key (already how `i18n.js` works),
  which is a much smaller loss than losing your place entirely.
  `TRANSLATED_PATHS`/`isTranslated()` still exist for `<SEO
  hreflangAlternates>` gating (a separate, narrower question), just not for
  routing.

- **Internal links were dropping the locale prefix, site-wide — fixed on
  every page below.** `useLocalizedPath()`/`localize(path)`
  (`src/i18n/LocaleContext.js`) has existed since this was built
  specifically to keep internal `<Link>`/`<a>` navigation on `/fi`/`/de`
  instead of reverting to English on the next click — but it was only
  actually *used* in `Footer.jsx` and `Header.jsx`. Every other page,
  **including the two already-reviewed live pages** (`/fi/sauna`,
  `/fi/steam/generators`), built its internal links from a bare `menuPaths.x`
  or `` `/products/${slug}` `` with no `localize()` wrapper — so clicking any
  card or "View All" button from a Finnish page silently dropped the visitor
  back to English. This is what surfaced as "the STE Steam Generator card on
  `/fi/steam` goes to English." Audited every page/component in this
  checklist plus `Home/*` (`Sauna.jsx`, `SaunaHeaters.jsx`,
  `SaunaAccessories.jsx`, `SaunaControls.jsx`, `SaunaRooms.jsx` + its
  Configurator/RoomViewer, `Steam.jsx`, `SteamGenerators.jsx`,
  `SaunaCalculatorCTA`, `SaunaCallToAction`, `Home/Section1–5`) and wrapped
  every internal path in `localize()` — 40+ call sites fixed. **True URL
  translation (different slugs per locale, e.g. `/sauna/heaters` becoming a
  distinct Finnish path) does not exist in this codebase and wasn't added —
  the app's model is one canonical English slug set, mirrored under `/fi`
  and `/de` prefixes** (see `LocaleContext.js`'s and `translatedRoutes.js`'s
  own comments). If genuinely separate Finnish slugs are wanted later,
  that's a distinct, larger feature (routing table, redirects for old URLs,
  SEO/hreflang implications) — flag it explicitly if so, since it's not
  what today's fix did.

~~Known open item: `steam.json`'s uncommitted `hub` section~~ — resolved by
another session; `/steam` hub is now wired + translated (see Steam section
above).

- **`manifest.js` used to hide the exact bug the Chinese pilot just hit.**
  It filtered `common`/`footer`/`nav`/`seo` out of its printed report
  entirely, so a stale shared namespace never showed up in `npm run
  i18n:manifest` — only page-specific `.json` files did. This is how German
  Home ended up 12 keys behind in `common.json` (found and fixed
  2026-08-26, same day as the Chinese pilot) without ever showing as a
  problem in the tool meant to catch exactly that. Fixed: `manifest.js` now
  prints a second `shared` table alongside `pages`, so a stale/missing
  shared namespace is visible on every run, not just when someone happens to
  click the specific button in the specific language. Full writeup in
  `README-i18n.md` under `manifest.js`'s docs — read it before trusting an
  all-green `pages` table again.
- **Language switcher couldn't detect `/zh` pages at all** (separate bug
  from the redirect-to-home one fixed earlier) — `HeaderLanguageSwitcher.jsx`
  parsed the URL with a hardcoded `/^\/(fi|de)(\/.*)?$/` regex, so adding a
  new locale prefix elsewhere (`LOCALE_PREFIXES`) didn't teach the switcher
  about it. Now built from `LOCALE_PREFIXES` itself, so a future locale
  addition can't silently repeat this.
