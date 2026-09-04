// One-off fill script for the Thermometers/Thermo-Hygrometer micro-category (fi),
// per PRODUCT-TRANSLATION-CONVENTIONS.md's "Templated micro-categories" pattern.
// Hand-maps each slug's English name to Finnish; derives short_description from
// the English source's own dimensions + accent-stone/black-metal flags via regex.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "product-i18n");

// Hand-mapped English name -> Finnish name (noun-shape words merge with the base
// word per the established `Loisto Square Thermometer` -> `Loisto Neliötermometri`
// precedent found in translation_memory; adjective-shape words stay separate,
// e.g. `Loisto Wooden Clock Round` style splits kept consistent with `pyöristetty`).
const NAME_MAP = {
  "square-thermometer": "Neliötermometri",
  "square-thermo-hygrometer": "Neliötermohygrometri",
  "rectangle-thermo-hygrometer": "Suorakaidetermohygrometri",
  "curved-square-thermo-hygrometer": "Kaareva neliötermohygrometri",
  "rounded-rectangle-thermo-hygrometer": "Pyöristetty suorakaidetermohygrometri",
  "curved-rectangle-thermo-hygrometer": "Kaareva suorakaidetermohygrometri",
  "basic-curved-rectangle-thermo-hygrometer": "Yksinkertainen kaareva suorakaidetermohygrometri",
  "cut-corner-square-thermometer": "Viistokulmainen neliötermometri",
  "cut-corner-rectangle-thermo-hygrometer": "Viistokulmainen suorakaidetermohygrometri",
  "cut-corner-vertical-rectangle-thermo-hygrometer": "Viistokulmainen pystysuorakaidetermohygrometri",
  "water-drop-thermometer": "Vesipisaratermometri",
  "water-drop-thermo-hygrometer": "Vesipisaratermohygrometri",
  "octagon-thermometer": "Kahdeksankulmiotermometri",
  "octagon-thermo-hygrometer": "Kahdeksankulmiotermohygrometri",
  "black-metal-thermometer": "Musta metallitermometri",
  "black-metal-thermo-hygrometer": "Musta metallitermohygrometri",
  "kanto-thermometer": "Kanto-termometri",
  "loisto-rounded-thermometer": "Loisto Pyöristetty termometri",
  "1-accent-stone-thermometer": "1 koristekivitermometri",
  "2-accent-stone-thermometer": "2 koristekivitermometri",
  "1-accent-stone-thermo-hygrometer": "1 koristekivitermohygrometri",
  "2-accent-stone-thermo-hygrometer": "2 koristekivitermohygrometri",
  "1-accent-stone-rectangle-thermo-hygrometer": "1 koristekivi, suorakaidetermohygrometri",
  "2-accent-stone-rectangle-thermo-hygrometer": "2 koristekivi, suorakaidetermohygrometri",
  "accent-stone-vertical-thermo-hygrometer": "Koristekivi, pystysuuntainen termohygrometri",
};

const slugs = Object.keys(NAME_MAP);
let ok = 0;

for (const slug of slugs) {
  const file = path.join(DATA_DIR, `${slug}.fi.packet.json`);
  const packet = JSON.parse(fs.readFileSync(file, "utf8"));
  const en = packet.fields.short_description;

  const dimMatch = en.match(/measuring\s+([\d.]+\s*×\s*[\d.]+)mm/);
  if (!dimMatch) throw new Error(`${slug}: could not parse dimensions from "${en}"`);
  const dims = dimMatch[1];

  const isHygrometer = /thermo-hygrometer/i.test(en);
  const isAccentStone = /accent stone sauna/i.test(en);
  const isBlackMetal = /black metal sauna/i.test(en);

  const name = NAME_MAP[slug];
  const baseNoun = isHygrometer ? "saunatermohygrometri" : "saunatermometri";
  const monitorClause = isHygrometer
    ? "käytetään saunan sisälämpötilan ja -kosteuden seurantaan"
    : "käytetään saunan sisälämpötilan seurantaan";

  let subject;
  if (isAccentStone) {
    subject = `koristekivinen ${baseNoun}`;
  } else if (isBlackMetal) {
    subject = `musta metallinen ${baseNoun}`;
  } else {
    subject = baseNoun;
  }

  const short_description = `SAWO ${name} on ${subject}, mitat ${dims}mm, ${monitorClause}.`;

  packet.fields.name = name;
  packet.fields.short_description = short_description;
  packet.fields.type = "Lämpömittarit";

  fs.writeFileSync(file, JSON.stringify(packet, null, 2) + "\n", "utf8");
  console.log(`${slug}: ${name} || ${short_description}`);
  ok++;
}

console.log(`\nDone. ${ok}/${slugs.length} packets filled.`);
