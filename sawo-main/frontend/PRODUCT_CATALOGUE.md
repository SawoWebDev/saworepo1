# SAWO Product Catalogue — Master Reference

Snapshot of the live `/products` page structure (tabs → sidebar sections →
products, in on-page order) after the 2026-08-25 reorganization. Use this as
the source of truth for how products are grouped and ordered; regenerate it
from the live page if products are added/moved so it doesn't drift.

## Tabs (in order)

1. [Sauna Heaters](#1-sauna-heaters)
2. [Sauna Rooms](#2-sauna-rooms)
3. [Sauna Controls](#3-sauna-controls)
4. [Steam](#4-steam) *(sidebar: Steam Generators / Steam Controls / Steam Accessories)*
5. [Infrared](#5-infrared) *(sidebar: Sauna Rooms / Panels / Controls)*
6. [Heater Accessories](#6-heater-accessories)
7. [Sauna Accessories](#7-sauna-accessories)

Every tab now has the same left sidebar navigation pattern (previously only
Sauna Heaters and Sauna Rooms had one).

---

## 1. Sauna Heaters

Sidebar sections, classified **by CMS category only** (`product.categories`),
same precedence order as the admin CMS's own `getHeaterSubcategory()`
(`/admin/products`): Wall-Mounted → Tower → Stone → Floor → Combi →
Dragonfire. "Wall" appearing in a product's own name (SAWO30 Wall, Tower
Wall, Aries Wall, Heaterking Wall) is a **Tower-family shape variant**
(flush-to-wall design) — not a genuine wall-mounted (hanging) heater — so
name/type is never used to classify; only the CMS category is. Within
Tower, brands are ordered SAWO30 → Tower → Aries → Cubos → Heaterking →
Phoenix → Fiberjungle, matching the dedicated `/sauna/heaters/tower` page,
so **SAWO30 shows first**.

### Wall-Mounted
*(genuine hanging wall-mount heaters — CMS category "Wall-Mounted")*
- Krios Ni2 / NS / NB
- Mini Combi NS / Fibercoated NS
- Mini NB / Fibercoated NB
- Mini X NS / Fibercoated NS / NB / Fibercoated NB
- Nordex Ni2 / Black Ni2 / NS / Black NS / NB / Black NB
- Nordex Combi NS / Black NS
- Nordex Mini Ni2 / Black Ni2 / NS / Black NS / NB / Black NB
- Nordex Mini Combi NS / Black NS
- Scandia Combi NS / Combi Fiber Coated NS / NS / Fibercoated NS / NB / Fibercoated NB
- Scandifire Black NS / Black NB / Red NS / Red NB

### Tower
*(CMS category "Towers" — includes all "Corner"/"Round"/"Wall" shape
variants of these brands; **SAWO30 first**)*
- **SAWO30** Corner Ni2 / Black Ni2 / NS / Black NS / NB / Black NB, Round Ni2 / Black Ni2 / NS / Black NS / NB / Black NB, **Wall NS / Wall Black NS** / Wall Ni2 / Wall Black Ni2 / Wall NB / Wall Black NB
- **Tower** Corner Ni2 / NS / NB / Ni, Round Ni2 / NS / NB / Ni, Wall Ni2 / NS / NB / Ni
- **Aries** Corner Ni2 / Black Ni2 / NS / Black NS / NB / Black NB, Round Ni2 / Black Ni2 / NS / Black NS / NB / Black NB, Wall Ni2 / Black Ni2 / NS / Black NS / NB / Black NB
- **Cubos** Ni2 / NS / NB
- **Heaterking** Corner NS / Round NS / Wall NS
- **Phoenix** Ni2 / NS
- **Fiberjungle** NS

### Stone
- Cumulus Ni2 / NS / NB
- Nimbus Combi NS
- Nimbus NS

### Floor
- Helius Mini NS
- Helius NS
- Nordex Floor NS / Black NS
- Nordex Pro Combi NS
- Nordex Pro NS
- Nordex S NS / Black NS / Combi NS / Combi Black NS
- Savonia Combi NS / Combi Fiber Coated NS / NS / Fiber Coated NS
- Taurus D NS

### Combi
- Taurus D Combi NS

*(Mini Combi, Nordex Combi, Nordex Mini Combi, and Scandia Combi are
double-tagged "Wall-Mounted" + "Combi" in the CMS — Wall-Mounted wins per
the admin's own precedence, so they show there instead, not here.)*

### Dragonfire
- Minidragon Black NS / Black NB / Red NS / Red NB

*(Fiberjungle and Heaterking are CMS category "Towers", not "Dragonfire" —
despite the marketing name, they show under Tower, not here.)*

---

## 2. Sauna Rooms

*(Infrared rooms have been pulled out into their own top-level tab — see §5.)*

### Standard
Standard Sauna Room: 1214, 1215, 1414, 1415, 1515, 1515L, 1419, 1420, 1519,
1519L, 1520, 1520L, 1522, 1522L, 1919, 1919L, 1920, 1920L, 1922L, 1922MS,
1922MD, 2020, 2020L, 2022, 2022L, 2022MD, 2222L, 2222MD

### Glass Front
Glass Front Sauna Room: 1414, 1415, 1419, 1419MS, 1515, 1519, 1519MS, 1420,
1420MS, 1520, 1520MS, 1522, 1522MS, 1919, 1919MS, 1919MRL, 1920, 1920MS,
1920MRL, 1922, 1922MS, 1922MRL, 2020, 2020MS, 2020MRL, 2022L, 2022MD, 2222L,
2222MD

### Compact
*(new 2026-08-25, room_type `compact` — plug-and-play, single-config, no
door-side variants, cedar only)*
1. Compact Sauna Room 1310MS — 1 Person, 0.95×1.27×2.12m
2. Compact Sauna Room 1313MS — 2 Person, 1.27×1.27×2.12m

---

## 3. Sauna Controls

Sidebar order is fixed as: Coming Soon → Saunova Series → Innova Series →
Control Spare Parts → Interface Holder → Sensor. (Internally, products are
*matched* into these groups in a different, more specific-first order so
shared parts like the RJ12 cable don't get stolen by the "Saunova"/"Innova"
brand groups just because their name mentions both brands — see code comment
in `AllProducts.jsx`.)

### Coming Soon
1. SAWO Sense *(SEN-UI)*
2. Saunova 2.0 PLUS *(SAU-UI-V2-P)*

### Saunova Series
1. Saunova 2.0 *(SAU-UI-V2)*
2. Saunova 2.0 Built-In *(SAU-B-V2)*
3. Saunova 2.0 Power Controller *(SAU-PC-V2)*
4. Saunova 2.0 Contactor Unit *(SAU-PS-V2)*
5. Saunova Simple *(SAU-UI-S)*

### Innova Series
1. Innova Classic 2.0 *(INC-S-V2)*
2. Innova Classic 2.0 Built-In *(INC-B-V2)*
3. Innova 2.0 Power Controller *(INP-C)*
4. Innova 2.0 Contactor Unit *(INP-S)*
5. Innova Stainless Steel Touch *(INT-S-SST)*
6. Innova Classic *(INC-S)*
7. Innova Classic Built-In *(INC-B)*

### Control Spare Parts
1. Innova & Saunova 2.0 Spare Rj12 – Cables
2. Innova Light Extension Module
3. Silicon Wire

### Interface Holder
1. Rectangular Interface Holder for 2.0 Controls
2. Oval Interface Holder for Innova Classic Control
3. Rectangular Interface Holder for Innova Classic Control

### Sensor
1. Additional Humidity and Temperature Sensor *(INN-HUM)*
2. Additional Second Temperature Sensor *(INN-BTEMP)*
3. Temperature Sensor with Fuse *(INN-FTEMP)*

---

## 4. Steam

Tab label is "Steam" (shortened from "Steam Generators"); one tab, three
sidebar sections.

### Steam Generators
- STE Steam Generator
- STN Steam Generator
- STN-S Steam Generator

### Steam Controls
- Steam 2.0
- Steam Stainless Touch Control
- Steam STE

### Steam Accessories
- Aroma Pump
- Demand Button
- Installation Stand
- Steam Door
- Steam Head Cover
- Venturi Pipe L-shape
- Venturi Pipe Straight
- Aroma, Fan and Dimmer Functions
- Autodrain
- Electronics Compartment
- RJ12 Cable
- Steam Head
- Temperature Sensor with Fuse

---

## 5. Infrared

Standalone tab (previously just a sub-section under Sauna Rooms), now with
its own 3-section sidebar mirroring the header's Infrared dropdown (Sauna
Rooms / Panels / Controls).

### Sauna Rooms
*(from the sauna-rooms data source, filtered to `room_type: infrared`)*
- Infrared Sauna Room 0908-IR-D
- Infrared Sauna Room 1111-IR-D

### Panels
*(same slug allowlist/order as the dedicated `/infrared/panels` page)*
1. Infrared Panels
2. Infrared Backrest
3. Interface Holder

### Controls
*(same slug allowlist/order as the dedicated `/infrared/controls` page)*
1. Infrared 2.0 User Interface
2. Infrared 2.0 Power Controller
3. Infrared 2.0 Built-In Control

---

## 6. Heater Accessories

Sidebar order: Heater Guards → Collars → Cozy Tanks → Safety Accessories →
Sauna Stones.

### Heater Guards
Heater Guard – Aries Corner, Aries Round, Aries Wall, Cubos Corner, Cubos
Middle, Cubos Wall, Heaterking Round W12/W2/W4/W6/W9, Helius, Krios Wall,
Nordex Pro, Nordex Pro Combi, Nordex S, Nordex S Combi, Nordex Wall, Phoenix,
SAWO30 Corner, SAWO30 Round, SAWO30 Wall, Taurus, Tower Corner, Tower Round,
Tower Wall

### Collars
Material variants (Wooden / Stainless) are now paired side by side per
model, Wooden before Stainless:

- Integration Collar – Corner (Wooden)
- **Integration Collar – Cubos Corner (Wooden)**
- **Integration Collar – Cubos Corner (Stainless)**
- Integration Collar – Cubos Middle (Wooden)
- Integration Collar – Cubos Middle (Stainless)
- Integration Collar – Cubos Wall (Wooden)
- Integration Collar – Cubos Wall (Stainless)
- Integration Collar – Phoenix (Stainless)
- Integration Collar – Round (Wooden)
- Integration Collar – Round (Stainless)
- Integration Collar – Round V2 (Stainless)
- Integration Collar – SAWO30 Corner (Stainless)
- Integration Collar – SAWO30 Wall (Stainless)
- Integration Collar – Tower Corner (Stainless)
- Integration Collar – Tower Wall (Stainless)
- Integration Collar – Wall (Wooden)

*(Entries with only one material listed simply don't have a second variant
in the catalogue yet.)*

### Cozy Tanks
- Cozy Tank (0.3L)
- Cozy Tank (0.6L)
- Cozy Tank (1.3L)

### Safety Accessories
- Emergency Stop Button Switch (ESTOP)
- Helius Heater Hood
- Safety Switch for Heaters

### Sauna Stones
- Decorative Sauna Stones White Quartz Rounded (10kg)
- Sauna Stones Olivine Diabase Rounded (20kg)

---

## 7. Sauna Accessories

*(Renamed from the generic "Accessories" tab — this is the general sauna
accessories catalogue: pails, ladles, thermometers, lights, benches, doors,
Kivistone, etc. Same category set as the `/sauna-accessories` landing page's
sub-pages.)*

### Pails
Kanto, Lovi, Dragon Pail 4L/9L, Steamwater Pail 4L/9L, Usva, Stainless Steel
Pail with Curved Handle, Stainless Steel Pail with Wooden Handle, Wooden
Pail Rattan with Stainless Steel Insert, Wooden Pail Traditional, Wooden
Pail Rattan, Wooden Pail Classic, Wooden Pail Rattan 4L, Wooden Pail 18L,
Wooden Cover for 381, Wooden Pail 28L, Wooden Cover for 391, Wooden Pail
40L, Wooden Cover for 392

### Ladles
Wooden Ladle Puro 51cm/67cm/81cm, Wooden Ladle Standard 36cm/42cm/52cm/68cm,
Kanto Ladle, Dragon Ladle, Steamshot Ladle, Stainless Steel Ladle 40cm,
Stainless Steel Ladle Siro 46.5cm/70.5cm, Stainless Steel Ladle Usva 40cm,
Stainless Steel Ladle with Curved Handle

### Pail Shower
- Pail Shower

### Thermometers & Combined Meters
Loisto Square/Rounded Thermometer, Kanto Thermometer, Black Metal
Thermometer, Black Metal Thermo-Hygrometer, 1/2 Accent Stone Thermometer,
Cut Corner Square Thermometer, Square Thermometer, Octagon Thermometer,
Water Drop Thermometer, 1/2 Accent Stone Thermo-Hygrometer, 1/2 Accent
Stone Rectangle Thermo-Hygrometer, Accent Stone Vertical Thermo-Hygrometer,
Water Drop Thermo-Hygrometer, Octagon Thermo-Hygrometer, Square
Thermo-Hygrometer, Curved Square Thermo-Hygrometer, Basic Curved Rectangle
Thermo-Hygrometer, Rectangle Thermo-Hygrometer, Curved Rectangle
Thermo-Hygrometer, Cut Corner Rectangle Thermo-Hygrometer, Cut Corner
Vertical Rectangle Thermo-Hygrometer, Rounded Rectangle Thermo-Hygrometer

### Clocks & Timers
Loisto Clock Square, Loisto Wooden Clock Round, Wooden Pail Clock, Wooden
Pail Clock Small, Sand Timer 15min, Sand Timer Kanto 15min, Sand Timer Tag
15min

### Sauna Lights
Wooden Curve Light 240/364/614, Wooden Light Cover Square, Wooden Light
Cover Corner/Wall, Wooden Light Cover Wave, Himalayan Salt Wall Vertical
Tiles (+ Large), Himalayan Salt Wall Horizontal Tiles (+ Large)

### Headrest & Backrests
Wave Wooden Backrest, Wave Wooden Headrest, Halu Wooden Headrest, Halu
Anti-theft Headrest, Wooden Backrest, Wooden Backrest Slim

### Doors & Handles
Wooden Stripe Sauna Door (+ Wide), Wooden Reversible Sauna Door, Clear Glass
Reversible Sauna Door (+ Wide), Clear Glass Reversible Sauna Door with
Vertical Wooden Handle (Arc / Metal), Wooden Door with Clear Glass Window,
Wooden Wide Clear Window Sauna Door, Bronze Glass Reversible Sauna Door with
Arc/Metallic Handle, Bronze Glass Reversible Sauna Door Standard, Bronze
Glass Sauna Door Finland, Wooden Door with Bronze Glass Window, Wooden Sauna
Door with Window, Wooden Wide Bronze Window Sauna Door, Wooden Arc Door
Handle, Wooden Door Handle, Wooden Straight Door Handle with Metal Accent,
Wooden Door Handle Small/Big Round, Wooden Door Handle with Magnetic Lock,
Door Lock Magnet Round, Heavy-Duty

### Benches
Siro Sauna Bench, Siro Wide Sauna Bench 42cm, Siro Wide Sauna Bench, Sauna
Bench, Sauna Bench 2-Steps

### Hangers & Hook Racks
Wooden Hook Rack (3/4/5 Hooks), Wooden Curve Towel Hanger

### Floor Mat Tiles
Wooden Floor Mat Block, Wooden Floor Mat Corner Frame, Wooden Floor Mat
Sides

### Kivistone
Luxury Aroma Cup (ø50), Aroma Cup (ø50), Aroma Spirit Cup, Scent Warmer,
Wine Cooler Stone, Spa Stones Set, Cooler (1/2 hole), Cooler w/ 2/4 shot
glasses, Candle Holder Tower, Tower Set 3, Candle Holder Straight, Stone
Plate Small/Large, Soap Holder

### Ventilations & Miscellaneous Items
Ventilation Cover Circle, Ventilation Louver Circle (+ Black Option),
Ventilation Louver Square, Display Stand Wall 1/2/3, Sauna Signage,
Moisture Paper

---

## Notes on this reorganization (2026-08-25)

- **Tab order** changed to: Sauna Heaters → Sauna Rooms → Sauna Controls →
  Steam Generators → Infrared → Heater Accessories → Sauna Accessories.
- **Sidebar navigation** (previously only on Sauna Heaters/Sauna Rooms) was
  added to Sauna Controls, Steam Generators, and Heater Accessories.
- **Steam Generators + Steam Generator Controls** were merged into one
  "Steam Generators" tab with a 3-item sidebar (Generators / Controls /
  Accessories) instead of two separate flat tabs.
- **Infrared** was split out of the Sauna Rooms tab into its own top-level
  tab.
- **"Sauna Accessories"** now exists as an actual tab (renamed from the
  generic "Accessories" tab, moved to the end of the tab order) — closing
  the gap that was flagged ("there's no sauna accessories").
- ~~**Wall-mounted heater fix**: SAWO30 Wall heaters were mistakenly tagged
  with a "Towers" category in the CMS... section assignment now checks the
  product's name/type for "wall" first...~~ **Superseded, see the
  "Correction" entry below** — this initial fix was itself wrong.
- **Variant pairing**: same-model variants (control class Ni2/NS/NB, Black
  vs. plain, and now Wooden vs. Stainless material for collars) are grouped
  and ordered together automatically, so e.g. "SAWO30 Wall NS" sits directly
  beside "SAWO30 Wall Black NS" (both within the Tower section — see
  correction below), and "Integration Collar – Cubos Corner (Wooden)" sits
  directly beside "... (Stainless)".
- **Heater/Accessory leak fix**: Heater Guards and Integration Collars used
  to leak into the Sauna Heaters tab (many of their names contain "Wall",
  e.g. "Heater Guard – Aries Wall") because they weren't excluded from the
  heaters list. They're now correctly confined to the Heater Accessories
  tab only.

## Follow-up changes (2026-08-25, later)

- **Tab label**: "Steam Generators" tab shortened to just **"Steam"**.
- **Infrared tab expanded**: previously showed Infrared Sauna Rooms only.
  Now has a 3-section sidebar — Sauna Rooms / Panels / Controls — matching
  the header's Infrared dropdown and the dedicated `/infrared/panels` and
  `/infrared/controls` pages. Panels and Controls are selected by the same
  slug allowlists those two pages already used (`PANEL_SLUGS`/
  `CONTROL_SLUGS`, now exported from `InfraredPanels.jsx`/
  `InfraredControls.jsx` and imported into `AllProducts.jsx`) rather than by
  category, since every infrared product shares one CMS category
  ("Infrared") with nothing to distinguish panels from controls.

## Correction (2026-08-25, later still)

The earlier "Wall-mounted heater fix" above was wrong. "Wall" in a product's
own name (SAWO30 Wall, Tower Wall, Aries Wall, Heaterking Wall) is a
**Tower-family shape variant** — the heater's design just sits flush against
a wall — not a genuine wall-mounted (hanging) heater. Those are a
completely separate CMS category ("Wall-Mounted"/"Wall Mounted"), covering
only Krios, Mini, Mini X, Nordex, Nordex Combi, Nordex Mini, Nordex Mini
Combi, Scandia, Scandia Combi, and Scandifire.

- `classifyHeaterSection()` now classifies **by CMS category only**,
  matching the admin CMS's own `getHeaterSubcategory()` (`Administrator/Products.jsx`)
  precedence order exactly: Wall-Mounted → Tower → Stone → Floor → Combi →
  Dragonfire. Name/type substrings are never used.
- All "Wall" (and "Corner"/"Round") shape variants of SAWO30, Tower, Aries,
  and Heaterking now correctly land in the **Tower** section, not
  Wall-Mounted — see the corrected §1 above.
- Within Tower, brands are now ordered **SAWO30 first**, then Tower, Aries,
  Cubos, Heaterking, Phoenix, Fiberjungle — matching the dedicated
  `/sauna/heaters/tower` page's `FIXED_ORDER` (`prioritizeBrands()` in
  `AllProducts.jsx`, applied as a stable sort after the usual variant
  pairing, so each brand's own Ni2/NS/NB/Black grouping is preserved).
- **Product grid capped at 4 columns max** everywhere on `/products`
  (`.products-grid` base rule changed from `repeat(5, 1fr)` to
  `repeat(4, 1fr)`; the now-redundant 1400px breakpoint override was
  removed). Grid cards were later also enlarged (image area 200px→270px,
  gaps increased across all breakpoints, name text 0.78rem→0.9rem).

## New: Compact Sauna Rooms (2026-08-25)

Added as a real, Supabase-backed room type — previously "Compact Sauna
Room" only existed as hardcoded marketing content on `/sauna/rooms`
(`SaunaRoomViewer.jsx`/`SaunaRoomData.jsx`), with nothing behind it in the
`sauna_rooms` table, no CMS dropdown option, and no section on `/products`.

- Inserted 2 new rows into Supabase `sauna_rooms` (project `sawo-react`,
  `qsdfdfuooeythaioucpx`): **Compact Sauna Room 1310MS** (1 person,
  0.95×1.27×2.12m) and **1313MS** (2 person, 1.27×1.27×2.12m). Both
  `room_type: "compact"`, `size_category: "compact"`, cedar-only,
  `has_door_filter: false` with a single flat `configurations` entry per
  model (no RS/LS door variants) — modeled on the Infrared row shape, not
  Standard's. Images/specs sourced from the site's own existing marketing
  page data (`compactImageData`/`compactSizeData` in `SaunaRoomData.jsx`),
  so they're real, not placeholders.
- Mirrored the same 2 rows into the local snapshot
  `Administrator/Local/data/saunaroom-data.json`, since the individual room
  detail page (`DispSaunaRoom.jsx`) reads that static file directly instead
  of live Supabase — without this, the new rooms would show in the
  `/products` grid but 404 when clicked.
- Code changes to make "Compact" a real, selectable category everywhere:
  - `Administrator/SaunaRoomsCMS.jsx` — added `{ value: "compact", label:
    "Compact" }` to the `ROOM_TYPES` dropdown.
  - `AllProducts.jsx` — added a third `ROOM_SECTIONS` entry so Compact gets
    its own sidebar section on `/products` → Sauna Rooms, alongside
    Standard/Glass Front.
  - `IndividualDisplay/DispSaunaRoom.jsx` — added `compact` (and, in
    passing, the also-missing `standard`) to `ROOM_TYPE_LABELS`.
- **Caveat**: `useLocalSaunaRooms` caches Supabase reads in
  `localStorage` (`sawo_public_sauna_rooms_cache_v1`) for 24h. Anyone who
  browsed the site before this change may not see the new rooms until that
  cache expires or they clear site data / hard-refresh.
