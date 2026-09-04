import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import menuPaths from "../menuPaths";
import SEO from "../components/SEO";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { isPubliclyVisible } from "../local-storage/visibility";
import { useLocaleT, useLocalizedPath } from "../i18n/LocaleContext";

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
  const t = useLocaleT("sitemap");
  const localize = useLocalizedPath();
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
        title={t("meta.title")}
        description={t("meta.description")}
        path={localize("/sitemap")}
        hreflangAlternates={{ en: "/sitemap", zh: "/zh/sitemap" }}
      />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">{t("title")}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t("subtitle")}
        </p>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <section>
            <h2 className={headingClass}>{t("groups.mainPages.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.home)} className={linkClass}>{t("groups.mainPages.home")}</Link></li>
              <li><Link to={localize(menuPaths.about.parent)} className={linkClass}>{t("groups.mainPages.about")}</Link></li>
              <li><Link to={localize(menuPaths.contact)} className={linkClass}>{t("groups.mainPages.contact")}</Link></li>
              <li><Link to={localize(menuPaths.careers)} className={linkClass}>{t("groups.mainPages.careers")}</Link></li>
              <li><Link to={localize(menuPaths.privacy)} className={linkClass}>{t("groups.mainPages.privacy")}</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>{t("groups.about.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.about.news)} className={linkClass}>{t("groups.about.news")}</Link></li>
              <li><Link to={localize(menuPaths.about.sustainability)} className={linkClass}>{t("groups.about.sustainability")}</Link></li>
            </ul>
          </section>

          {/* Spans 3 grid rows at the lg breakpoint so it sits beside Main
              Pages/About/Steam Rooms/Infrared/Support/Products — those 6
              fill columns 1-2 across 3 rows via normal grid auto-placement,
              this occupies column 3 for the full height next to them. */}
          <section className="lg:row-span-3">
            <h2 className={headingClass}>{t("groups.sauna.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.sauna.parent)} className={`${linkClass} font-semibold`}>{t("groups.sauna.products")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.parent)} className={linkClass}>{t("groups.sauna.heaters")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.wallMounted)} className={linkClass}>{t("groups.sauna.wallMounted")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.tower)} className={linkClass}>{t("groups.sauna.tower")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.stone)} className={linkClass}>{t("groups.sauna.stone")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.floor)} className={linkClass}>{t("groups.sauna.floor")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.combi)} className={linkClass}>{t("groups.sauna.combi")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.heaters.dragonfire)} className={linkClass}>{t("groups.sauna.dragonfire")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.controls)} className={linkClass}>{t("groups.sauna.controls")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.parent)} className={linkClass}>{t("groups.sauna.accessories")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.accessorySets)} className={linkClass}>{t("groups.sauna.accessorySets")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.pailsLadles)} className={linkClass}>{t("groups.sauna.pailsLadles")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.thermometers)} className={linkClass}>{t("groups.sauna.thermometers")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.clocksSandtimers)} className={linkClass}>{t("groups.sauna.clocksSandtimers")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.lightsCovers)} className={linkClass}>{t("groups.sauna.lightsCovers")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.headrestsBackrests)} className={linkClass}>{t("groups.sauna.headrestsBackrests")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.doorsHandles)} className={linkClass}>{t("groups.sauna.doorsHandles")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.benches)} className={linkClass}>{t("groups.sauna.benches")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.kivistone)} className={linkClass}>{t("groups.sauna.kivistone")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.accessories.ventilations)} className={linkClass}>{t("groups.sauna.ventilations")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.rooms)} className={linkClass}>{t("groups.sauna.rooms")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.interiorDesigns)} className={linkClass}>{t("groups.sauna.interiorDesigns")}</Link></li>
              <li><Link to={localize(menuPaths.sauna.woodPanels)} className={linkClass}>{t("groups.sauna.woodPanels")}</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>{t("groups.steam.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.steam.parent)} className={`${linkClass} font-semibold`}>{t("groups.steam.products")}</Link></li>
              <li><Link to={localize(menuPaths.steam.generators)} className={linkClass}>{t("groups.steam.generators")}</Link></li>
              <li><Link to={localize(menuPaths.steam.controls)} className={linkClass}>{t("groups.steam.controls")}</Link></li>
              <li><Link to={localize(menuPaths.steam.accessories)} className={linkClass}>{t("groups.steam.accessories")}</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>{t("groups.infrared.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.infrared.parent)} className={linkClass}>{t("groups.infrared.parent")}</Link></li>
              <li><Link to={localize(menuPaths.infrared.saunas)} className={linkClass}>{t("groups.infrared.saunas")}</Link></li>
              <li><Link to={localize(menuPaths.infrared.panels)} className={linkClass}>{t("groups.infrared.panels")}</Link></li>
              <li><Link to={localize(menuPaths.infrared.controls)} className={linkClass}>{t("groups.infrared.controls")}</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>{t("groups.support.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.support.parent)} className={`${linkClass} font-semibold`}>{t("groups.support.parent")}</Link></li>
              <li><Link to={localize(menuPaths.support.faq)} className={linkClass}>{t("groups.support.faq")}</Link></li>
              <li><Link to={localize(menuPaths.support.saunaCalculator)} className={linkClass}>{t("groups.support.calculator")}</Link></li>
              <li><Link to={localize(menuPaths.support.manuals)} className={linkClass}>{t("groups.support.manuals")}</Link></li>
              <li><Link to={localize(menuPaths.support.catalogue)} className={linkClass}>{t("groups.support.catalogue")}</Link></li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>{t("groups.catalog.heading")}</h2>
            <ul className="space-y-3">
              <li><Link to={localize(menuPaths.products)} className={linkClass}>{t("groups.catalog.allProducts")}</Link></li>
              <li><Link to={localize(menuPaths.accessories)} className={linkClass}>{t("groups.catalog.accessoriesCatalog")}</Link></li>
              <li><Link to={localize(menuPaths.heaters)} className={linkClass}>{t("groups.catalog.heatersCatalog")}</Link></li>
            </ul>
          </section>

          <div className="md:col-span-2 lg:col-span-3">
            <h2 className={headingClass}>
              {t("everyProduct")}{totalProducts > 0 && ` (${totalProducts})`}
            </h2>
            {productsLoading ? (
              <p className="text-gray-500">{t("loadingProducts")}</p>
            ) : totalProducts === 0 ? (
              <p className="text-gray-500">{t("noProducts")}</p>
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
                    <h3 className="font-semibold text-gray-800 mb-2 [break-after:avoid-column]">{t(`productGroups.${label}`)} ({list.length})</h3>
                    <ul className="space-y-1.5">
                      {list.map((p) => (
                        <li key={p.slug} className="[break-inside:avoid-column]">
                          <Link to={localize(`/products/${p.slug}`)} className={linkClass}>{p.name}</Link>
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
              {t("saunaRooms")}{visibleRooms.length > 0 && ` (${visibleRooms.length})`}
            </h2>
            {roomsLoading ? (
              <p className="text-gray-500">{t("loadingRooms")}</p>
            ) : visibleRooms.length === 0 ? (
              <p className="text-gray-500">{t("noRooms")}</p>
            ) : (
              <ul className="columns-2 sm:columns-3 lg:columns-4 gap-6 space-y-1.5">
                {visibleRooms.map((r) => (
                  <li key={r.slug} className="break-inside-avoid">
                    <Link to={localize(`/sauna/rooms/${r.slug}`)} className={linkClass}>{r.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 bg-gray-100 rounded-lg md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("help.title")}</h3>
            <p className="text-gray-600">
              {t("help.prefix")}{" "}
              <Link to={localize(menuPaths.contact)} className={linkClass}>{t("help.contactLink")}</Link>{" "}
              {t("help.or")}{" "}
              <Link to={localize(menuPaths.support.faq)} className={linkClass}>{t("help.faqLink")}</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
