// src/Administrator/ScrollArea.jsx
//
// Shared invisible scroll container for CMS data pages. Drop the table/grid/
// list content inside it (as a sibling below the page's toolbar/filters/
// search) and it becomes the only thing that scrolls — everything above it
// stays pinned. Pairs with the `cms-scroll-page` class on the page's root
// element; see admin.css for the `:has()` rule that switches
// .admin-main-content from page-level scroll to this internal scroll.
import React from "react";

export default function ScrollArea({ children, className = "", ...rest }) {
  return (
    <div className={`cms-scroll-area ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
