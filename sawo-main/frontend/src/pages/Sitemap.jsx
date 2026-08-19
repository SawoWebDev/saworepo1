import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import menuPaths from "../menuPaths";
import SEO from "../components/SEO";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { isPubliclyVisible } from "../local-storage/visibility";

const linkClass = "text-amber-800 hover:text-amber-950 hover:underline";
const headingClass = "text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300";

// Matched against the *actual* category strings found in products.json
// (verified directly against the data, not guessed/assumed — the taxonomy
// admin's categories.json list uses different casing/singulars in a few
// spots, e.g. "Towers"/"Stones" here vs "tower"/"stone" there, which is what
// silently dumped 58 real heaters into "Other Products" before this fix).
// First matching group wins, so e.g. a product tagged both "steam
// accessories" and "accessories" lands under Steam Accessories, not
// double-listed. Falls through to "Other Products" instead of silently
// dropping anything a future category rename doesn't match.
const PRODUCT_GROUPS = [
  { label: "Steam Accessories", test: (c) => c === "steam accessories" },
  { label: "Steam Controls", test: (c) => c === "steam controls" },
  { label: "Infrared", test: (c) => c === "infrared" },
  { label: "Sauna Controls", test: (c) => c === "sauna controls" || c === "controls" },
  {
    label: "Sauna Accessories",
    test: (c) =>
      [
        "pails", "ladles", "pail shower", "thermometers", "clocks & timers",
        "sauna lights", "sauna-lights", "headrest & backrest", "doors & handles",
        "benches", "cloth hangers", "wooden floor mats", "kivistone",
        "ventilation & miscellaneous", "accessory sets", "accessories",
      ].includes(c),
  },
  {
    label: "Sauna Heaters",
    test: (c) =>
      ["towers", "wall-mounted", "stones", "floor", "combi", "dragonfire", "spare parts"].includes(c),
  },
];

function classifyProduct(product) {
  const categories = (product.categories || []).map((c) => c.toLowerCase());
  for (const group of PRODUCT_GROUPS) {
    if (categories.some(group.test)) return group.label;
  }
  return "Other Products";
}

const Sitemap = () => {
  // Every publicly-visible product/accessory + sauna room, straight from the
  // same feeds the rest of the site reads (bundled JSON, or live Supabase if
  // the CMS's Live Data Source is set to it) — new items appear here the
  // moment they'd appear anywhere else on the site, no manual list to keep
  // in sync. isPubliclyVisible is the same check ProductPageRouter/
  // DispSaunaRoom use, so a draft or scheduled-future item never gets a
  // public sitemap link.
  const { products, loading: productsLoading } = useLocalProducts();
  const { rooms, loading: roomsLoading } = useLocalSaunaRooms();

  const groupedProducts = useMemo(() => {
    const visible = products.filter(isPubliclyVisible);
    const groups = new Map();
    visible.forEach((p) => {
      const label = classifyProduct(p);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(p);
    });
    groups.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    // Fixed order (matches PRODUCT_GROUPS + Other last) instead of
    // insertion/Map order, so the section order doesn't shuffle as data
    // changes.
    const order = [...PRODUCT_GROUPS.map((g) => g.label), "Other Products"];
    return order
      .map((label) => [label, groups.get(label) || []])
      .filter(([, list]) => list.length > 0);
  }, [products]);

  const visibleRooms = useMemo(
    () => rooms.filter(isPubliclyVisible).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [rooms]
  );

  const totalProducts = groupedProducts.reduce((sum, [, list]) => sum + list.length, 0);

  return (
    <div className="min-h-screen bg-white pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Sitemap"
        description="A complete guide to every page and section of the SAWO website: sauna heaters, steam generators, sauna rooms, and more."
        path="/sitemap"
      />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Sitemap</h1>
        <p className="text-lg text-gray-600 mb-8">
          Complete guide to all pages and sections of the SAWO website.
        </p>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <section>
            <h2 className={headingClass}>Main Pages</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.home} className={linkClass}>Home</Link></li>
              <li><Link to={menuPaths.about.parent} className={linkClass}>About Us</Link></li>
              <li><Link to={menuPaths.contact} className={linkClass}>Contact Us</Link></li>
              <li><Link to={menuPaths.careers} className={linkClass}>Careers</Link></li>
              <li><Link to={menuPaths.privacy} className={linkClass}>Privacy Policy</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>About</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.about.news} className={linkClass}>Latest News</Link></li>
              <li><Link to={menuPaths.about.sustainability} className={linkClass}>Sustainability</Link></li>
            </ul>
          </section>

          {/* Spans 3 grid rows at the lg breakpoint so it sits beside Main
              Pages/About/Steam Rooms/Infrared/Support/Products — those 6
              fill columns 1-2 across 3 rows via normal grid auto-placement,
              this occupies column 3 for the full height next to them. */}
          <section className="lg:row-span-3">
            <h2 className={headingClass}>Finnish Sauna</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.sauna.parent} className={`${linkClass} font-semibold`}>Sauna Products</Link></li>
              <li><Link to={menuPaths.sauna.heaters.parent} className={linkClass}>Sauna Heaters</Link></li>
              <li><Link to={menuPaths.sauna.heaters.wallMounted} className={linkClass}>Wall-Mounted Heaters</Link></li>
              <li><Link to={menuPaths.sauna.heaters.tower} className={linkClass}>Tower Heaters</Link></li>
              <li><Link to={menuPaths.sauna.heaters.stone} className={linkClass}>Stone Heaters</Link></li>
              <li><Link to={menuPaths.sauna.heaters.floor} className={linkClass}>Floor Heaters</Link></li>
              <li><Link to={menuPaths.sauna.heaters.combi} className={linkClass}>Combination Heaters</Link></li>
              <li><Link to={menuPaths.sauna.heaters.dragonfire} className={linkClass}>Dragonfire Heaters</Link></li>
              <li><Link to={menuPaths.sauna.controls} className={linkClass}>Sauna Controls</Link></li>
              <li><Link to={menuPaths.sauna.accessories.parent} className={linkClass}>Sauna Accessories</Link></li>
              <li><Link to={menuPaths.sauna.accessories.accessorySets} className={linkClass}>Accessory Sets</Link></li>
              <li><Link to={menuPaths.sauna.accessories.pailsLadles} className={linkClass}>Pails & Ladles</Link></li>
              <li><Link to={menuPaths.sauna.accessories.thermometers} className={linkClass}>Thermometers & Combined Meters</Link></li>
              <li><Link to={menuPaths.sauna.accessories.clocksSandtimers} className={linkClass}>Clocks & Sandtimers</Link></li>
              <li><Link to={menuPaths.sauna.accessories.lightsCovers} className={linkClass}>Sauna Lights & Covers</Link></li>
              <li><Link to={menuPaths.sauna.accessories.headrestsBackrests} className={linkClass}>Headrests & Backrests</Link></li>
              <li><Link to={menuPaths.sauna.accessories.doorsHandles} className={linkClass}>Doors & Handles</Link></li>
              <li><Link to={menuPaths.sauna.accessories.benches} className={linkClass}>Benches & Floor Tiles</Link></li>
              <li><Link to={menuPaths.sauna.accessories.kivistone} className={linkClass}>Kivistone</Link></li>
              <li><Link to={menuPaths.sauna.accessories.ventilations} className={linkClass}>Ventilations & Add-Ons</Link></li>
              <li><Link to={menuPaths.sauna.rooms} className={linkClass}>Sauna Rooms</Link></li>
              <li><Link to={menuPaths.sauna.interiorDesigns} className={linkClass}>Interior Designs</Link></li>
              <li><Link to={menuPaths.sauna.woodPanels} className={linkClass}>Wood Panels & Timbers</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>Steam Rooms</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.steam.parent} className={`${linkClass} font-semibold`}>Steam Room Products</Link></li>
              <li><Link to={menuPaths.steam.generators} className={linkClass}>Steam Generators</Link></li>
              <li><Link to={menuPaths.steam.controls} className={linkClass}>Steam Controls</Link></li>
              <li><Link to={menuPaths.steam.accessories} className={linkClass}>Steam Accessories</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>Infrared Sauna</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.infrared} className={linkClass}>Infrared Sauna Rooms</Link></li>
              <li><Link to="/products/infrared-backrest" className={linkClass}>Infrared Backrest</Link></li>
              <li><Link to="/products/infrared-panels" className={linkClass}>Infrared Panels</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>Support & Resources</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.support.parent} className={`${linkClass} font-semibold`}>Support Center</Link></li>
              <li><Link to={menuPaths.support.faq} className={linkClass}>Frequently Asked Questions</Link></li>
              <li><Link to={menuPaths.support.saunaCalculator} className={linkClass}>Sauna Calculator</Link></li>
              <li><Link to={menuPaths.support.manuals} className={linkClass}>User Manuals</Link></li>
              <li><Link to={menuPaths.support.catalogue} className={linkClass}>Product Catalogue</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>Products & Catalog</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.products} className={linkClass}>All Products</Link></li>
              <li><Link to={menuPaths.accessories} className={linkClass}>Accessories Catalog</Link></li>
              <li><Link to={menuPaths.heaters} className={linkClass}>Heaters Catalog</Link></li>
            </ul>
          </section>

          <div className="md:col-span-2 lg:col-span-3">
            <h2 className={headingClass}>
              Every Product{totalProducts > 0 && ` (${totalProducts})`}
            </h2>
            {productsLoading ? (
              <p className="text-gray-500">Loading products…</p>
            ) : totalProducts === 0 ? (
              <p className="text-gray-500">No products available right now.</p>
            ) : (
              // True CSS multi-column flow, not a grid — a grid puts each
              // group in its own cell and sizes every row to its tallest
              // cell, which is what left huge blank space under short
              // groups (e.g. Steam Controls) sitting next to Sauna Heaters'
              // 60+ items. Columns instead flow continuously top-to-bottom
              // and wrap to the next column wherever content actually ends,
              // so short and long groups pack together with no dead space.
              // break-after on the heading keeps it from being stranded
              // alone at the bottom of a column, separate from its list.
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
                {groupedProducts.map(([label, list]) => (
                  <section key={label} className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2 [break-after:avoid-column]">{label} ({list.length})</h3>
                    <ul className="space-y-1.5">
                      {list.map((p) => (
                        <li key={p.slug} className="[break-inside:avoid-column]">
                          <Link to={`/products/${p.slug}`} className={linkClass}>{p.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <h2 className={headingClass}>
              Sauna Rooms{visibleRooms.length > 0 && ` (${visibleRooms.length})`}
            </h2>
            {roomsLoading ? (
              <p className="text-gray-500">Loading sauna rooms…</p>
            ) : visibleRooms.length === 0 ? (
              <p className="text-gray-500">No sauna rooms available right now.</p>
            ) : (
              <ul className="columns-2 sm:columns-3 lg:columns-4 gap-6 space-y-1.5">
                {visibleRooms.map((r) => (
                  <li key={r.slug} className="break-inside-avoid">
                    <Link to={`/sauna/rooms/${r.slug}`} className={linkClass}>{r.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 bg-gray-100 rounded-lg md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600">
              Can't find what you're looking for? Visit our{" "}
              <Link to={menuPaths.contact} className={linkClass}>contact page</Link>{" "}
              or{" "}
              <Link to={menuPaths.support.faq} className={linkClass}>FAQ section</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
