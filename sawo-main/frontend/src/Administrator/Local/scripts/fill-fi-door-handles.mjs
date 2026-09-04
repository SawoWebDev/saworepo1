// One-off fill for 5 wooden door-handle products (fi). Base word "ovenkahva"
// confirmed against translation_memory's "Stainless-steel door handle set" ->
// "Ruostumattomasta teräksestä valmistettu ovenkahvasarja" precedent.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "product-i18n");

const ENTRIES = {
  "wooden-arc-door-handle": {
    name: "Puinen kaariovenkahva",
    short_description:
      "SAWO Puinen kaariovenkahva on puinen saunan ovenkahva, jossa on kaariprofiili, mitat 40 × 900mm, suunniteltu pysymään viileänä kosketettaessa saunan kuumuudessa.",
  },
  "wooden-door-handle": {
    name: "Puinen ovenkahva",
    short_description:
      "SAWO Puinen ovenkahva on puinen saunan ovenkahva, mitat 40 × 900mm, suunniteltu pysymään viileänä kosketettaessa saunan kuumuudessa.",
  },
  "wooden-door-handle-with-magnetic-lock": {
    name: "Puinen ovenkahva magneettilukolla",
    short_description:
      "SAWO Puinen ovenkahva magneettilukolla on puinen saunan ovenkahva, jossa on sisäänrakennettu magneettilukko, mitat 260 × 45mm, suunniteltu pysymään viileänä kosketettaessa saunan kuumuudessa.",
  },
  "wooden-door-handle-big-round": {
    name: "Puinen ovenkahva, iso pyöreä",
    short_description:
      "SAWO Puinen ovenkahva, iso pyöreä on puinen saunan ovenkahva, jossa on pyöreä profiili, mitat Ø90 x W50mm, suunniteltu pysymään viileänä kosketettaessa saunan kuumuudessa.",
  },
  "wooden-door-handle-small-round": {
    name: "Puinen ovenkahva, pieni pyöreä",
    short_description:
      "SAWO Puinen ovenkahva, pieni pyöreä on puinen saunan ovenkahva, jossa on pyöreä profiili, mitat Ø65 x W70mm, suunniteltu pysymään viileänä kosketettaessa saunan kuumuudessa.",
  },
};

const TYPE_FI = "Ovet ja kahvat";

let ok = 0;
for (const [slug, vals] of Object.entries(ENTRIES)) {
  const file = path.join(DATA_DIR, `${slug}.fi.packet.json`);
  const packet = JSON.parse(fs.readFileSync(file, "utf8"));
  packet.fields.name = vals.name;
  packet.fields.short_description = vals.short_description;
  packet.fields.type = TYPE_FI;
  fs.writeFileSync(file, JSON.stringify(packet, null, 2) + "\n", "utf8");
  console.log(`${slug}: ${vals.name}`);
  ok++;
}
console.log(`\nDone. ${ok}/${Object.keys(ENTRIES).length} packets filled.`);
