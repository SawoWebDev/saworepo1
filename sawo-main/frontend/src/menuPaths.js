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
    accessories: "/sauna/accessories",
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
  accessories: "/accessories",
  adminDashboard:"/admin/dashboard",
};

export default menuPaths;
