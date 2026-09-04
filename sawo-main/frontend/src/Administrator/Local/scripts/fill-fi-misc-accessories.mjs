// One-off fill script for the "misc accessories" fi batch (pails, ventilation,
// display stands, safety switches, Kivistone). Run once, then apply-many.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data", "product-i18n");

const VENT_TYPE = "Ilmanvaihto ja sekalaiset";

// slug -> { name, short_description, type, variations: [desc per index or null] }
const T = {
  "dragon-pail-9l": { name: "Dragon-ämpäri 9L", short_description: "SAWO Dragon-ämpäri 9L on ämpäri, jonka tilavuus on 9L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-pail-rattan-4l": { name: "Puinen rottinkiämpäri 4L", short_description: "SAWO Puinen rottinkiämpäri 4L on puinen ämpäri, jonka tilavuus on 4L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "stainless-steel-pail-with-curved-handle": { name: "Ruostumaton teräsämpäri kaarevalla kahvalla", short_description: "SAWO Ruostumaton teräsämpäri kaarevalla kahvalla on ruostumattomasta teräksestä valmistettu ämpäri, jonka tilavuus on 5L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "steamwater-pail-4l": { name: "Steamwater-ämpäri 4L", short_description: "SAWO Steamwater-ämpäri 4L on ämpäri, jonka tilavuus on 4L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "stainless-steel-pail-with-wooden-handle": { name: "Ruostumaton teräsämpäri puukahvalla", short_description: "SAWO Ruostumaton teräsämpäri puukahvalla on puinen ämpäri, jossa on ruostumaton teräs-sisäosa, tilavuus 5L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "steamwater-pail-9l": { name: "Steamwater-ämpäri 9L", short_description: "SAWO Steamwater-ämpäri 9L on ämpäri, jonka tilavuus on 9L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "dragon-pail-4l": { name: "Dragon-ämpäri 4L", short_description: "SAWO Dragon-ämpäri 4L on ämpäri, jonka tilavuus on 4L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-pail-28l": { name: "Puinen ämpäri 28L", short_description: "SAWO Puinen ämpäri 28L on puinen ämpäri, jonka tilavuus on 28L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-cover-for-381": { name: "Puinen kansi mallille 381", short_description: "SAWO:n puinen kansi mallille 381 on tehty yhteensopivaksi SAWO 381 -ämpärin kanssa, ja se suojaa ämpäriä saunakertojen välillä." },
  "wooden-pail-rattan": { name: "Puinen rottinkiämpäri", short_description: "SAWO Puinen rottinkiämpäri on puinen ämpäri, jonka tilavuus on 9L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-cover-for-391": { name: "Puinen kansi mallille 391", short_description: "SAWO:n puinen kansi mallille 391 on tehty yhteensopivaksi SAWO 391 -ämpärin kanssa, ja se suojaa ämpäriä saunakertojen välillä." },
  "wooden-pail-18l": { name: "Puinen ämpäri 18L", short_description: "SAWO Puinen ämpäri 18L on puinen ämpäri, jonka tilavuus on 18L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-pail-classic": { name: "Klassinen puuämpäri", short_description: "SAWO Klassinen puuämpäri on puinen ämpäri, jonka tilavuus on 4L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-pail-traditional": { name: "Perinteinen puuämpäri", short_description: "SAWO Perinteinen puuämpäri on puinen ämpäri, jonka tilavuus on 9L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-pail-rattan-with-stainless-steel-insert": { name: "Puinen rottinkiämpäri ruostumattomalla teräs-sisäosalla", short_description: "SAWO Puinen rottinkiämpäri ruostumattomalla teräs-sisäosalla on puinen ämpäri, jossa on ruostumaton teräs-sisäosa, tilavuus 5L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-pail-40l": { name: "Puinen ämpäri 40L", short_description: "SAWO Puinen ämpäri 40L on puinen ämpäri, jonka tilavuus on 40L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "wooden-cover-for-392": { name: "Puinen kansi mallille 392", short_description: "SAWO:n puinen kansi mallille 392 on tehty yhteensopivaksi SAWO 392 -ämpärin kanssa, ja se suojaa ämpäriä saunakertojen välillä." },
  "lovi": { name: "Lovi", short_description: "SAWO Lovi on ämpäri, jonka tilavuus on 4L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },
  "kanto": { name: "Kanto", short_description: "SAWO Kanto on ämpäri, jonka tilavuus on 4L. Sitä käytetään saunakiville kaadettavan veden säilyttämiseen." },

  "ventilation-cover-circle-641d": { name: "Pyöreä tuuletuskansi", short_description: "SAWO Pyöreä tuuletuskansi on tuuletuskansi, jonka halkaisija on Ø160mm. Sitä käytetään saunahuoneen tuuletusaukon viimeistelyyn.", type: VENT_TYPE },
  "ventilation-cover-circle-640mbr": { name: "Pyöreä tuuletuskansi", short_description: "SAWO Pyöreä tuuletuskansi on tuuletuskansi, jonka halkaisija on Ø160mm. Sitä käytetään saunahuoneen tuuletusaukon viimeistelyyn.", type: VENT_TYPE },
  "ventilation-louver-circle-634d": { name: "Pyöreä tuuletussäleikkö", short_description: "SAWO Pyöreä tuuletussäleikkö on tuuletussäleikkö, jonka halkaisija on Ø170mm ja kanavan reikä 125mm. Sitä käytetään säätelemään ilmavirtausta saunahuoneeseen ja sieltä pois.", type: VENT_TYPE },
  "ventilation-louver-square": { name: "Neliönmallinen tuuletussäleikkö", short_description: "SAWO Neliönmallinen tuuletussäleikkö on tuuletussäleikkö, jonka mitat ovat 215 × 170mm. Sitä käytetään säätelemään ilmavirtausta saunahuoneeseen ja sieltä pois.", type: VENT_TYPE },
  "ventilation-louver-circle-with-black-option-639d": { name: "Pyöreä tuuletussäleikkö, saatavana myös mustana", short_description: "SAWO Pyöreä tuuletussäleikkö, saatavana myös mustana on tuuletussäleikkö, jonka halkaisija on Ø170mm ja kanavan reikä 125mm, saatavana myös mustana viimeistelynä. Sitä käytetään säätelemään ilmavirtausta saunahuoneeseen ja sieltä pois.", type: VENT_TYPE },
  "ventilation-louver-circle-631d": { name: "Pyöreä tuuletussäleikkö", short_description: "SAWO Pyöreä tuuletussäleikkö on tuuletussäleikkö, jonka halkaisija on Ø145mm ja kanavan reikä 100mm. Sitä käytetään säätelemään ilmavirtausta saunahuoneeseen ja sieltä pois.", type: VENT_TYPE },
  "ventilation-louver-circle-with-black-option-638d": { name: "Pyöreä tuuletussäleikkö, saatavana myös mustana", short_description: "SAWO Pyöreä tuuletussäleikkö, saatavana myös mustana on tuuletussäleikkö, jonka halkaisija on Ø145mm ja kanavan reikä 100mm, saatavana myös mustana viimeistelynä. Sitä käytetään säätelemään ilmavirtausta saunahuoneeseen ja sieltä pois.", type: VENT_TYPE },
  "moisture-paper": { name: "Kosteuspaperi", short_description: "SAWO Kosteuspaperi, mitat 1200 × 77 × 77mm. Käytetään osana saunan seinän ja katon asennusta.", type: VENT_TYPE },
  "sauna-grille-622-d": { name: "Saunaritilä", short_description: null, type: VENT_TYPE },
  "display-stand-wall-1": { name: "Seinäesittelyteline 1", short_description: "SAWO Seinäesittelyteline 1 on seinään asennettava esittelyteline, jonka mitat ovat (P)630 x (L)1110 x (K)2000mm. Sitä käytetään SAWO-kiukaiden ja -lisävarusteiden esittelyyn vähittäismyynti- tai näyttelytiloissa.", type: VENT_TYPE },
  "display-stand-wall-2": { name: "Seinäesittelyteline 2", short_description: "SAWO Seinäesittelyteline 2 on seinään asennettava esittelyteline, jonka mitat ovat (P)630 x (L)2300 x (K)2000mm. Sitä käytetään SAWO-kiukaiden ja -lisävarusteiden esittelyyn vähittäismyynti- tai näyttelytiloissa.", type: VENT_TYPE },
  "display-stand-wall-3": { name: "Seinäesittelyteline 3", short_description: "SAWO Seinäesittelyteline 3 on seinään asennettava esittelyteline, jonka mitat ovat (P)630 x (L)3400 x (K)2000mm. Sitä käytetään SAWO-kiukaiden ja -lisävarusteiden esittelyyn vähittäismyynti- tai näyttelytiloissa.", type: VENT_TYPE },

  "safety-switch-for-heaters": { name: "Turvakytkin kiukaille", short_description: "Turvakytkin sammuttaa kiukaan, jos vieras esine (esim. pyyhe) koskettaa sitä tai tulee turvaetäisyyksien sisäpuolelle. (Noudattaa standardia SFS-EN60335-2-53, kohta 19.101.)", type: "Turvakytkin" },
  "helius-heater-hood": { name: "Helius-kiuaskupu", short_description: "Helius-kiuaskupu voidaan asentaa saunahuoneen syvennykseen, jolloin se pysyy piilossa ja poissa saunojien tieltä. Kiukaan erillisen vuolukivialtaan avulla vettä voidaan kaataa kiville höyryn tuottamiseksi. Tämä suunnitteluominaisuus auttaa ehkäisemään tahattomia palovammoja. Helius-kupu pienentää turvaetäisyyden minimiin.", type: "Kiuaskupu" },
  "emergency-stop-button-switch-estop": { name: "Hätäpysäytyspainike (ESTOP)", short_description: "Hätäpainikkeella voidaan kytkeä saunakiuas pois päältä ylikuumenemisen turvapiirin kautta. Lisäksi hätätilanteessa voidaan laukaista hälytys valinnaisen signalointilaitteen kautta, esimerkiksi kiinnittämään valvovan henkilökunnan huomio etäsijainnissa. Varmista, että noudatat sovellettavia normeja ja lakisääteisiä vaatimuksia, kuten EN 60335-1, EN 60335-2-53, VDE 0100 osa 703 sekä paikallisen energiantoimittajan vaatimuksia.", type: "Turvakytkin" },

  "soap-holder": { name: "Saippua-alusta", short_description: "SAWO Saippua-alusta on vuolukivinen saippua-alusta, mitat 180 × 100 × 30mm, 0.9kg, osa Kivistone-lisävarustesarjaa." },
  "wine-cooler-stone": { name: "Viininjäähdytin", short_description: "SAWO Viininjäähdytin on vuolukivestä ja setristä valmistettu viininjäähdytin, mitat 230 × 155 × 84mm, osa Kivistone-lisävarustesarjaa." },
  "stone-plate-large": { name: "Kivilautanen Suuri", short_description: "SAWO Kivilautanen Suuri on vuolukivinen tarjoilulautanen, mitat 305 × 200 × 15mm, 2.8kg, osa Kivistone-lisävarustesarjaa." },
  "stone-plate-small": { name: "Kivilautanen Pieni", short_description: "SAWO Kivilautanen Pieni on vuolukivinen tarjoilulautanen, mitat 240 × 170 × 25mm, 2.8kg, osa Kivistone-lisävarustesarjaa." },
  "cooler-w-2-shot-glasses": { name: "Jäähdytin ja 2 shottilasia", short_description: "SAWO Jäähdytin ja 2 shottilasia on vuolukivinen jäähdytin, mitat 135 × 100 × 70mm, 1.8kg, osa Kivistone-lisävarustesarjaa, käytetään juomien viilentämiseen saunan rentoutumistilassa." },

  "loisto-square-thermometer": { name: "Loisto Neliötermometri", short_description: "SAWO Loisto Neliötermometri on saunatermometri, mitat 110 × 85mm, käytetään saunan sisälämpötilan seurantaan.", type: "Lämpömittarit" },
};

let filled = 0, missing = [];
for (const [slug, vals] of Object.entries(T)) {
  const file = path.join(dataDir, `${slug}.fi.packet.json`);
  if (!fs.existsSync(file)) { missing.push(slug); continue; }
  const packet = JSON.parse(fs.readFileSync(file, "utf8"));
  if (vals.name !== undefined) packet.fields.name = vals.name;
  if (vals.short_description !== undefined) packet.fields.short_description = vals.short_description;
  if (vals.type !== undefined) packet.fields.type = vals.type;
  fs.writeFileSync(file, JSON.stringify(packet, null, 2));
  filled++;
}
console.log(`Filled ${filled} packets.`);
if (missing.length) console.log("Missing packet files:", missing);
