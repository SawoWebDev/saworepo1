// src/menuPaths.js
const menuPaths = {
  home: "/",

  sauna: {
    parent: "/sauna",
    heaters: {
      parent: "/sauna/heaters",
      wallMounted: "/sauna/heaters/wall-mounted",
      tower: "/sauna/heaters/tower",
      stone: "/sauna/heaters/stone",
      floor: "/sauna/heaters/floor",
      combi: "/sauna/heaters/combi",
      dragonfire: "/sauna/heaters/dragonfire",
    },
    controls: "/sauna/controls",
    accessories: {
      parent:             "/sauna/accessories",
      accessorySets:      "/sauna/accessories/accessory-sets",
      pailsLadles:        "/sauna/accessories/pails-ladles",
      thermometers:       "/sauna/accessories/thermometers",
      clocksSandtimers:   "/sauna/accessories/clocks-sandtimers",
      lightsCovers:       "/sauna/accessories/lights-covers",
      headrestsBackrests: "/sauna/accessories/headrests-backrests",
      doorsHandles:       "/sauna/accessories/doors-handles",
      benches:            "/sauna/accessories/benches-floor-tiles",
      kivistone:          "/sauna/accessories/kivistone",
      ventilations:       "/sauna/accessories/ventilations-add-ons",
    },
    rooms: "/sauna/rooms",
    interiorDesigns: "/sauna/rooms/interior-designs",
    woodPanels: "/sauna/rooms/wood-panels-timbers",
  },

  steam: {
    parent: "/steam",
    generators: "/steam/generators",
    controls: "/steam/controls",
    accessories: "/steam/accessories",
  },

  infrared: "/infrared",

  support: {
    parent: "/support",
    faq: "/support/faq",
    saunaCalculator: "/support/sauna-calculator",
    manuals: "/support/manuals",
    catalogue: "/support/catalogue",
  },

  contact: "/contact",

  about: {
    parent: "/about",
    news: "/about/news",
    sustainability: "/about/sustainability",
  },

  careers: "/careers",
  privacy: "/privacy-policy",
  sitemap: "/sitemap",
  products: "/products",
  accessories: "/sauna-accessories",
  adminDashboard:"/admin/dashboard",
};

export default menuPaths;