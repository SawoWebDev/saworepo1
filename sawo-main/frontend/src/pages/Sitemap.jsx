import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../menuPaths";

const linkClass = "text-amber-800 hover:text-amber-950 hover:underline";
const headingClass = "text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300";

const Sitemap = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-16 px-4 sm:px-6 lg:px-8">
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

          <section>
            <h2 className={headingClass}>Finnish Sauna</h2>
            <ul className="space-y-3">
              <li><Link to={menuPaths.sauna.parent} className={`${linkClass} font-semibold`}>Sauna Products</Link></li>
              <li>
                <Link to={menuPaths.sauna.heaters.parent} className={linkClass}>Sauna Heaters</Link>
                <ul className="space-y-2 mt-2 ml-4">
                  <li><Link to={menuPaths.sauna.heaters.wallMounted} className={linkClass}>Wall-Mounted Heaters</Link></li>
                  <li><Link to={menuPaths.sauna.heaters.tower} className={linkClass}>Tower Heaters</Link></li>
                  <li><Link to={menuPaths.sauna.heaters.stone} className={linkClass}>Stone Heaters</Link></li>
                  <li><Link to={menuPaths.sauna.heaters.floor} className={linkClass}>Floor Heaters</Link></li>
                  <li><Link to={menuPaths.sauna.heaters.combi} className={linkClass}>Combination Heaters</Link></li>
                  <li><Link to={menuPaths.sauna.heaters.dragonfire} className={linkClass}>Dragonfire Heaters</Link></li>
                </ul>
              </li>
              <li><Link to={menuPaths.sauna.controls} className={linkClass}>Sauna Controls</Link></li>
              <li>
                <Link to={menuPaths.sauna.accessories.parent} className={linkClass}>Sauna Accessories</Link>
                <ul className="space-y-2 mt-2 ml-4">
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
                </ul>
              </li>
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
              <li><Link to={menuPaths.infrared} className={linkClass}>Infrared Backrest</Link></li>
              <li><Link to={menuPaths.infrared} className={linkClass}>Infrared Panels</Link></li>
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
            </ul>
          </section>

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
