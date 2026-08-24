// src/config/contactFormApi.js
// Central source of the contact-form backend's base URL — the React app's
// own PHP backend (react_helpdeskapi), separate from the WordPress site's
// helpdeskapi backend. REACT_APP_CONTACT_FORM_API_BASE lets this be
// repointed per environment (local PHP dev server, Pages preview, prod)
// without touching component code.

const CONTACT_FORM_API_BASE =
  process.env.REACT_APP_CONTACT_FORM_API_BASE || "https://www.sawo.com/react_helpdeskapi";

export const SEND_EMAIL_URL = `${CONTACT_FORM_API_BASE}/send.php`;
export const ODOO_TICKET_URL = `${CONTACT_FORM_API_BASE}/indxe.php`;
