// src/Administrator/PageHeader.jsx
//
// One shared header template for every admin page: icon chip + title +
// one-line description, with an optional slot on the right for page-level
// actions (a Refresh button, a New Product button, etc). Same shape
// everywhere — only the icon/title/description/actions change per page,
// same idea as the sidebar's shared nav-item styling.
import React from "react";

export default function PageHeader({ icon, title, description, actions, dark, setDark }) {
  return (
    <div className="page-header">
      <div className="page-header-main">
        {icon && (
          <div className="page-header-icon">
            <i className={icon} />
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
      </div>
      <div className="page-header-actions">
        {actions}
        {/* Day/Night switch — hidden for now, keeping the markup for later.
        {setDark && (
          <div className="ph-sw2-wrap">
            <label
              className="ph-sw2"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <input
                type="checkbox"
                checked={dark}
                onChange={() => setDark((d) => !d)}
                aria-label="Toggle theme"
              />
              <div className="ph-sw2__button" />
              <div className="ph-sw2__background" />
            </label>
          </div>
        )}
        */}
      </div>
    </div>
  );
}
