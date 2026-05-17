import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../menuPaths";

const Sitemap = () => {
  return (
    <div className="min-h-screen bg-white pt-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Sitemap</h1>
        <p className="text-lg text-gray-600 mb-8">
          Complete guide to all pages and sections of the SAWO website.
        </p>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Main Pages */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Main Pages
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to={menuPaths.home} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to={menuPaths.about.parent} className="text-amber-800 hover:text-amber-950 hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to={menuPaths.contact} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to={menuPaths.careers} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Careers
                </Link>
              </li>
              <li>
                <Link to={menuPaths.privacy} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          {/* About Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              About
            </h2>
            <ul className="space-y-3 ml-4">
              <li>
                <Link to={menuPaths.about.parent} className="text-amber-800 hover:text-amber-950 hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to={menuPaths.about.news} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Latest News
                </Link>
              </li>
              <li>
                <Link to={menuPaths.about.sustainability} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Sustainability
                </Link>
              </li>
            </ul>
          </section>

          {/* Sauna Products */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Finnish Sauna
            </h2>
            <ul className="space-y-3 ml-4">
              <li>
                <Link to={menuPaths.sauna.parent} className="text-amber-800 hover:text-amber-950 hover:underline font-semibold">
                  Sauna Products
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.sauna.heaters.parent} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Sauna Heaters
                </Link>
                <ul className="space-y-2 mt-2 ml-4">
                  <li>
                    <Link to={menuPaths.sauna.heaters.wallMounted} className="text-amber-800 hover:text-amber-950 hover:underline">
                      Wall-Mounted Heaters
                    </Link>
                  </li>
                  <li>
                    <Link to={menuPaths.sauna.heaters.tower} className="text-amber-800 hover:text-amber-950 hover:underline">
                      Tower Heaters
                    </Link>
                  </li>
                  <li>
                    <Link to={menuPaths.sauna.heaters.stone} className="text-amber-800 hover:text-amber-950 hover:underline">
                      Stone Heaters
                    </Link>
                  </li>
                  <li>
                    <Link to={menuPaths.sauna.heaters.floor} className="text-amber-800 hover:text-amber-950 hover:underline">
                      Floor Heaters
                    </Link>
                  </li>
                  <li>
                    <Link to={menuPaths.sauna.heaters.combi} className="text-amber-800 hover:text-amber-950 hover:underline">
                      Combination Heaters
                    </Link>
                  </li>
                  <li>
                    <Link to={menuPaths.sauna.heaters.dragonfire} className="text-amber-800 hover:text-amber-950 hover:underline">
                      Dragonfire Heaters
                    </Link>
                  </li>
                </ul>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.sauna.controls} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Sauna Controls
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.sauna.accessories} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Sauna Accessories
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.sauna.rooms} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Sauna Rooms
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.sauna.interiorDesigns} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Interior Designs
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.sauna.woodPanels} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Wood Panels & Timbers
                </Link>
              </li>
            </ul>
          </section>

          {/* Steam Products */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Steam Rooms
            </h2>
            <ul className="space-y-3 ml-4">
              <li>
                <Link to={menuPaths.steam.parent} className="text-amber-800 hover:text-amber-950 hover:underline font-semibold">
                  Steam Room Products
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.steam.generators} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Steam Generators
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.steam.controls} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Steam Controls
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.steam.accessories} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Steam Accessories
                </Link>
              </li>
            </ul>
          </section>

          {/* Infrared */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Infrared Sauna
            </h2>
            <ul className="space-y-3 ml-4">
              <li>
                <Link to={menuPaths.infrared} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Infrared Sauna Rooms
                </Link>
              </li>
            </ul>
          </section>

          {/* Support */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Support & Resources
            </h2>
            <ul className="space-y-3 ml-4">
              <li>
                <Link to={menuPaths.support.parent} className="text-amber-800 hover:text-amber-950 hover:underline font-semibold">
                  Support Center
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.support.faq} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Frequently Asked Questions
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.support.saunaCalculator} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Sauna Calculator
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.support.manuals} className="text-amber-800 hover:text-amber-950 hover:underline">
                  User Manuals
                </Link>
              </li>
              <li className="ml-4">
                <Link to={menuPaths.support.catalogue} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Product Catalogue
                </Link>
              </li>
            </ul>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
              Products & Catalog
            </h2>
            <ul className="space-y-3 ml-4">
              <li>
                <Link to={menuPaths.products} className="text-amber-800 hover:text-amber-950 hover:underline">
                  All Products
                </Link>
              </li>
              <li>
                <Link to={menuPaths.accessories} className="text-amber-800 hover:text-amber-950 hover:underline">
                  Accessories Catalog
                </Link>
              </li>
            </ul>
          </section>

          <div className="p-6 bg-gray-100 rounded-lg md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600">
              Can't find what you're looking for? Visit our{" "}
              <Link to={menuPaths.contact} className="text-amber-800 hover:text-amber-950 hover:underline">
                contact page
              </Link>{" "}
              or{" "}
              <Link to={menuPaths.support.faq} className="text-amber-800 hover:text-amber-950 hover:underline">
                FAQ section
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
