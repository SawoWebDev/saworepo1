// One-off fill for 5 Integration Collar products (fi). Coined "Integration
// Collar" -> "Kiuaskaulus" (kiuas+kaulus, mirroring the sibling "Heater Guard"
// -> "Kiuassuoja" precedent's compounding style and bare-term `type` field).
// Position words (Corner/Wall/Round) confirmed from that same sibling
// category's already-applied fi rows (Kulma/Seinä/Pyöreä), not guessed.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "product-i18n");

const GENERIC_DESC =
  "Kiuaskaulus parantaa penkkiin asennettujen kiukaiden ulkonäköä antamalla niille saumattoman, sisäänrakennetun ilmeen. Kauluksia valmistetaan eri materiaaleista, jotka on valittu huolella täydentämään saunahuoneen tyyliä. Vaihtoehtoina ovat tyylikäs, harjattu ruostumaton teräs, luonnollinen pehmeä vuolukivi sekä kestävä laminoitu puu.";

const ENTRIES = {
  "integration-collar-sawo30-wall-stainless": {
    name: "Kiuaskaulus – SAWO30 Seinä (Ruostumaton teräs)",
    short_description: GENERIC_DESC,
  },
  "integration-collar-tower-corner-stainless": {
    name: "Kiuaskaulus – Tower Kulma (Ruostumaton teräs)",
    short_description: GENERIC_DESC,
  },
  "integration-collar-round-v2-stainless": {
    name: "Kiuaskaulus – Pyöreä V2 (Ruostumaton teräs)",
    short_description:
      "Pyöreä ruostumaton kaulus parantaa penkkiin asennettujen kiukaiden ulkonäköä antamalla niille saumattoman, sisäänrakennetun ilmeen. Kauluksia valmistetaan eri materiaaleista, jotka on valittu huolella täydentämään saunahuoneen tyyliä. Vaihtoehtoina ovat tyylikäs, harjattu ruostumaton teräs, luonnollinen pehmeä vuolukivi sekä kestävä laminoitu puu.",
  },
  "integration-collar-phoenix-stainless": {
    name: "Kiuaskaulus – Phoenix (Ruostumaton teräs)",
    short_description: GENERIC_DESC,
  },
  "integration-collar-tower-wall-stainless": {
    name: "Kiuaskaulus – Tower Seinä (Ruostumaton teräs)",
    short_description: GENERIC_DESC,
  },
};

const TYPE_FI = "Kiuaskaulus";
const HEADERS_FI = ["Malli", "Pituus (mm)", "Leveys (mm)", "Korkeus (mm)"];

let ok = 0;
for (const [slug, vals] of Object.entries(ENTRIES)) {
  const file = path.join(DATA_DIR, `${slug}.fi.packet.json`);
  const packet = JSON.parse(fs.readFileSync(file, "utf8"));
  packet.fields.name = vals.name;
  packet.fields.short_description = vals.short_description;
  packet.fields.type = TYPE_FI;
  packet.fields.spec_table_headers = HEADERS_FI;
  fs.writeFileSync(file, JSON.stringify(packet, null, 2) + "\n", "utf8");
  console.log(`${slug}: ${vals.name}`);
  ok++;
}
console.log(`\nDone. ${ok}/${Object.keys(ENTRIES).length} packets filled.`);
