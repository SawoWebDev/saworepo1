# Brochure PDF links, by page

Tracks every `sawo.com/wp-content/uploads/...pdf` link referenced in `src/pages/**` and `src/components/**`,
so a PDF update means editing one known line per page instead of hunting for it.

Regenerate/verify with:
```
grep -rn "\.pdf" src --include=*.jsx
```

## Sauna / Accessories

| Page | File | Brochure link(s) |
|---|---|---|
| Sauna Accessories (landing) | `src/pages/Sauna/SaunaAccessories.jsx` | Sauna Lights `Sauna-Lights_RV15.pdf` (2026/07) · Accessory Sets `SAWO-Accessory-Set-Brochure-2026.pdf` (2026/07) · Accessories `SAWO-Sauna-Accessories-2026.pdf` (2026/07) · Curve LED Lights `Curve-LED-Lights-Flyer-for-USA-EU-2026.pdf` (2026/07) · Sauna Doors `SAWO-Sauna-Doors-2026.pdf` (2026/08) · Kivistone `Kivistone-Brochure_-2026.pdf` (2026/06) |
| Accessory Sets | `src/pages/Sauna/accessories/AccessorySets.jsx` | `SAWO-Accessory-Set-Brochure-2026.pdf` (2026/07) |
| Pails & Ladles | `src/pages/Sauna/accessories/PailsLadles.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) |
| Thermometers & Combined Meters | `src/pages/Sauna/accessories/Thermometers.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) |
| Clocks & Sandtimers | `src/pages/Sauna/accessories/ClocksSandtimers.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) |
| Sauna Lights & Covers | `src/pages/Sauna/accessories/SaunaLights.jsx` | `Sauna-Lights_RV15.pdf` (2026/07) |
| Headrests & Backrests | `src/pages/Sauna/accessories/HeadrestsBackrests.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) |
| Doors & Handles | `src/pages/Sauna/accessories/DoorsHandles.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) — *no dedicated doors PDF wired in here yet; consider switching to `SAWO-Sauna-Doors-2026.pdf`* |
| Benches & Floor Tiles | `src/pages/Sauna/accessories/BenchesFloorTiles.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) |
| Kivistone | `src/pages/Sauna/accessories/Kivistone.jsx` | `Kivistone-Brochure_-2026.pdf` (2026/06) |
| Ventilations & Add-Ons | `src/pages/Sauna/accessories/VentilationsAddOns.jsx` | `SAWO-Sauna-Accessories-2026.pdf` (2026/07) |

## Sauna / Rooms & Controls

| Page | File | Brochure link(s) |
|---|---|---|
| Sauna (hub) | `src/pages/Sauna/Sauna.jsx` | `SAWO-Product-Catalogue-2025-2026-web.pdf` (2025/12) |
| Sauna Heaters (hub) | `src/pages/Sauna/SaunaHeaters.jsx` | `SAWO-Product-Catalogue-2025-2026-web.pdf` (2025/12) |
| Sauna Controls | `src/pages/Sauna/SaunaControls.jsx` | `STP-INFACE-V2_En_2026.pdf` (2026/07) |
| Wood Panels & Timbers | `src/pages/Sauna/rooms/WoodPanelandTimbers.jsx` | `Panels-TimbersRV4_compressed.pdf` (2025/12) |

## Sauna Heater series pages

| Page | File | Brochure link(s) |
|---|---|---|
| Tower | `src/pages/Sauna/heaters/Tower.jsx` | `SAWO-Tower-Series-2026.pdf` (2026/07) |
| Stone | `src/pages/Sauna/heaters/Stone.jsx` | `Stone-Series-2026.pdf` (2026/07) |
| Wall-Mounted | `src/pages/Sauna/heaters/WallMounted.jsx` | `SAWO-Wall-Mounted-Series-2026.pdf` (2026/07) |
| Floor | `src/pages/Sauna/heaters/Floor.jsx` | `SAWO-Floor-Series-2026.pdf` (2026/07) |
| Combi | `src/pages/Sauna/heaters/Combi.jsx` | `SAWO-Combi-Series-2026.pdf` (2026/07) |
| Dragonfire | `src/pages/Sauna/heaters/Dragonfire.jsx` | `SAWO-Product-Catalogue-2025-2026-web.pdf` (2025/12) — *not a dedicated Dragonfire PDF* |

## Steam / Infrared

| Page | File | Brochure link(s) |
|---|---|---|
| Steam (hub) | `src/pages/Steam/Steam.jsx` | `SAWO-Steam-Sauna-2026.pdf` (2026/07) |
| Infrared (hub) | `src/pages/Infrared/Infrared.jsx` | `SAWO-Infrared-Brochure-2026-1.pdf` (2026/07) |
| Infrared Room | `src/pages/Infrared/InfraredRoom.jsx` | `SAWO-Infrared-Brochure-2026-1.pdf` (2026/07) |
| Infrared Saunas | `src/pages/Infrared/InfraredSaunas.jsx` | `SAWO-Infrared-Brochure-2026-1.pdf` (2026/07) |

## Site-wide / other

| Page | File | Brochure link(s) |
|---|---|---|
| Home hero | `src/pages/Home/Hero.jsx` | `SAWO-Product-Catalogue-2025.pdf` (2025/10) |
| Why Choose SAWO (component) | `src/components/WhyChooseSawo.jsx` | `SAWO-Product-Catalogue-2025-2026-web.pdf` (2025/12) |
| Heaters Catalog | `src/pages/HeatersCatalog.jsx` | `SAWO-Product-Catalogue-2025-2026-web.pdf` (2025/12) |
| Product Catalogue (support) | `src/pages/Support/ProductCatalogue.jsx` | `SAWO-Product-Catalogue-040526.pdf` (2026/05) |

---

**Note:** the Home hero, Why Choose SAWO, and Heaters Catalog pages all still point at the older
`SAWO-Product-Catalogue-2025-2026-web.pdf` / `-2025.pdf` catalogues rather than the newest
`SAWO-Product-Catalogue-040526.pdf` (2026/05) used on the Support page — worth aligning if a single
current catalogue PDF is the intent going forward.
