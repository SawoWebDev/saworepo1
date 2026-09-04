// One-off fill for the 15 misc small-accessory products in this batch
// (candle holders, coolers, aroma cups, Kivistone-family items, sauna
// signage, and the "usva" pail). Hand-translated per product — too varied
// for a single template beyond the shared Kivistone sentence shape.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "product-i18n");

const ENTRIES = {
  "candle-holder-tower-r131": {
    name: "Kynttilänpidike Torni",
    short_description:
      "SAWO Kynttilänpidike Torni on vuolukivinen kynttilänpidike, mitat 60 × 60 × 60mm, 0.6kg, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
  "candle-holder-tower-r132": {
    name: "Kynttilänpidike Torni",
    short_description:
      "SAWO Kynttilänpidike Torni on vuolukivinen kynttilänpidike, mitat 60 × 60 × 90mm, 0.9kg, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
  "candle-holder-tower-r133": {
    name: "Kynttilänpidike Torni",
    short_description:
      "SAWO Kynttilänpidike Torni on vuolukivinen kynttilänpidike, mitat 60 × 60 × 120mm, 1.2kg, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
  "candle-holder-straight": {
    name: "Kynttilänpidike Suora",
    short_description:
      "SAWO Kynttilänpidike Suora on vuolukivinen kynttilänpidike, mitat 265 × 60 × 30mm, 1.3kg, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
  usva: {
    name: "Usva",
    short_description:
      "SAWO Usva on ämpäri, jonka tilavuus on 5L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen.",
    type: "Pails",
  },
  "aroma-cup-50": {
    name: "Aromikuppi (ø)50",
    short_description:
      "SAWO Aromikuppi (ø)50 on vuolukivinen aromikuppi, mitat 50 × 50 × 60mm, 0.3kg, osa Kivistone-tarvikesarjaa, käytetään aromiveden säilyttämiseen kiuaskiville kaatamista varten.",
    type: "Kivistone",
  },
  "luxury-aroma-cup-50": {
    name: "Luksusaromikuppi (ø)50",
    short_description:
      "SAWO Luksusaromikuppi (ø)50 on vuolukivinen aromikuppi, mitat 50 × 50 × 50mm, 0.2kg, osa Kivistone-tarvikesarjaa, käytetään aromiveden säilyttämiseen kiuaskiville kaatamista varten.",
    type: "Kivistone",
  },
  "aroma-spirit-cup": {
    name: "Aromikuppi Spirit",
    short_description:
      "SAWO Aromikuppi Spirit on vuolukivinen aromikuppi, mitat 75 × 75 × 120mm, 0.7kg, osa Kivistone-tarvikesarjaa, käytetään aromiveden säilyttämiseen kiuaskiville kaatamista varten.",
    type: "Kivistone",
  },
  "sauna-signage": {
    name: "Saunakyltti",
    short_description:
      "SAWO Saunakyltti, mitat 150 × 80mm, käytetään saunahuoneen merkitsemiseen tai tunnistamiseen.",
    type: "Ilmanvaihto ja sekalaiset",
  },
  "cooler-1-hole": {
    name: "Viilennin (1 reikä)",
    short_description:
      "SAWO Viilennin (1 reikä) on vuolukivinen viilennin, mitat 100 × 100 × 75mm, 1.3kg, osa Kivistone-tarvikesarjaa, käytetään juomien viilentämiseen saunan oleskelutilassa.",
    type: "Kivistone",
  },
  "cooler-2-hole": {
    name: "Viilennin (2 reikää)",
    short_description:
      "SAWO Viilennin (2 reikää) on vuolukivinen viilennin, mitat 185 × 100 × 75mm, 4.1kg, osa Kivistone-tarvikesarjaa, käytetään juomien viilentämiseen saunan oleskelutilassa.",
    type: "Kivistone",
  },
  "cooler-w-4-shot-glasses": {
    name: "Viilennin, 4 paukkulasia",
    short_description:
      "SAWO Viilennin, 4 paukkulasia on vuolukivinen viilennin, mitat 190 × 120 × 70mm, 2.3kg, osa Kivistone-tarvikesarjaa, käytetään juomien viilentämiseen saunan oleskelutilassa.",
    type: "Kivistone",
  },
  "scent-warmer": {
    name: "Tuoksulämmitin",
    short_description:
      "SAWO Tuoksulämmitin on vuolukivinen tuoksulämmitin, mitat 75 × 75 × 80mm, 0.7kg, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
  "tower-set-3": {
    name: "Torni-sarja 3",
    short_description:
      "SAWO Torni-sarja 3 on vuolukivinen, tornin muotoinen tarvike, mitat 180 × 60 × 180mm, 1.8kg, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
  "spa-stones-set": {
    name: "Spa-kivisarja",
    short_description:
      "SAWO Spa-kivisarja on vuolukivestä ja setristä valmistettu spa-kivisarja, mitat 90 × 128 × 178mm, osa Kivistone-tarvikesarjaa.",
    type: "Kivistone",
  },
};

let ok = 0;
for (const [slug, vals] of Object.entries(ENTRIES)) {
  const file = path.join(DATA_DIR, `${slug}.fi.packet.json`);
  const packet = JSON.parse(fs.readFileSync(file, "utf8"));
  packet.fields.name = vals.name;
  packet.fields.short_description = vals.short_description;
  packet.fields.type = vals.type;
  fs.writeFileSync(file, JSON.stringify(packet, null, 2) + "\n", "utf8");
  console.log(`${slug}: ${vals.name}`);
  ok++;
}
console.log(`\nDone. ${ok}/${Object.keys(ENTRIES).length} packets filled.`);
