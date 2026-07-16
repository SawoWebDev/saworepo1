// src/inline-edit/pageIds.js
// Maps a route pathname to the `page` id used in the site_content table.
// Only routes listed here can enter inline edit mode — the admin bar shows
// "not available" on every other route until it's added here (and the page
// wraps its content in EditableText/EditableImage, see About.jsx for the
// pattern to follow).

import menuPaths from "../menuPaths";

export const PATH_TO_PAGE = {
  [menuPaths.home]: "home",
  [menuPaths.about.parent]: "about",
};

export function getPageIdForPath(pathname) {
  return PATH_TO_PAGE[pathname] || null;
}
