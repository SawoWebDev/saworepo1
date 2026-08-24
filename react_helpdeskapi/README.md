# react_helpdeskapi

Standalone PHP backend for the **React** contact form
(`sawo-main/frontend/src/pages/Contact/Contact.jsx`). This is a separate,
independent implementation from `helpdeskapi`, which remains the WordPress
site's backend and is not touched by anything here.

```
WordPress  →  /helpdeskapi/          (unchanged, out of scope)
React      →  /react_helpdeskapi/  (this folder)
```

## Request flow

```
Contact.jsx
  │
  ├─▶ POST send.php    (staff notification)      ─┐
  │                                                 ├─ fired in parallel via
  └─▶ POST indxe.php   (Odoo ticket)              ─┘  Promise.allSettled

indxe.php:
  1. Connect to Odoo, create/find the res.partner
  2. Create the helpdesk.ticket
  3. On success only: fire the customer auto-reply (lib/SendRespond.php),
     failure here is logged, never turns a created ticket into an error
  4. Return { success, ticket }

send.php:
  1. Resolve recipient: Supabase app_settings.contact_notify_email (Settings
     → Contact Form Recipient) if set and valid → else Europe-hub/
     info@sawo.com region routing (same as the WordPress reference)
  2. Build the HTML notification body
  3. Send via lib/SimpleSMTPMailer.php (authenticated SMTP — mail.sawo.com,
     STARTTLS + AUTH LOGIN), From = the authenticated SMTP account,
     Reply-To = the customer's own email
  4. Return { success, message }
```

Both endpoints are independent — `indxe.php` failing doesn't block
`send.php` and vice versa (mirrors the WordPress reference's parallel-call
design, now reused by React via `Promise.allSettled`).

## Why not just copy `helpdeskapi`?

It wasn't copied wholesale — each file here was individually justified:

- `mail()` (unauthenticated, local MTA) → replaced with `SimpleSMTPMailer`
  (authenticated STARTTLS+AUTH LOGIN) everywhere, including `send.php`,
  which was still using `mail()` in the reference implementation.
- Credentials (Odoo password/API key, SMTP password, Supabase keys) →
  `.env`, never hardcoded in a PHP source file.
- `FeedBack.php`, `index.php`, `xsend.php`, `xxxsend.php`,
  `smtpmailer copy 1.php`, `createLeads.php`/`cLeads.php`, the `.zip`
  backups, and `error_log` were confirmed unused/obsolete/duplicate during
  the repo-wide reference analysis and were never carried over.
- The customer auto-reply (`SendRespond.php`) was built but never wired into
  the live ticket flow — it is here, called from `indxe.php` after a
  successful ticket create.

## Environment variables

See `.env.example` for the full list (Odoo credentials, SMTP account,
Supabase URL/anon key, CORS allow-list). Copy it to `.env` and fill in real
values — `.env` is gitignored by the repo root's `.gitignore`.

## Local development

```bash
php -S localhost:8000 -t react_helpdeskapi
```

Then open `react_helpdeskapi/dev/test-form.html` in a browser and point
its "API base URL" field at `http://localhost:8000`. It POSTs directly to
`indxe.php`/`send.php` with editable test data — no need to run the full
React app to test the backend in isolation.

**`dev/` is not for the production host.** It's blocked by
`dev/.htaccess` if it ever ends up there anyway, but the intent is to not
upload it at all — it exists only for local testing, and submitting through
it against real `.env` credentials creates a real Odoo ticket and sends a
real email.

## Deploying

Quick version:

1. Upload everything in this folder **except `dev/`** to the target path on
   the PHP host (e.g. `sawo.com/react_helpdeskapi/`) — this repo has no
   deploy automation for this folder, it's a manual upload.
2. Create `.env` on the server from `.env.example` with real values (do not
   upload your local `.env` if the host differs from what's in it).
3. Confirm `CONTACT_FORM_ALLOWED_ORIGINS` in that server-side `.env` matches
   whatever origin the React app is actually served from (Cloudflare Pages
   preview domain pre-cutover, `https://www.sawo.com` post-cutover).
4. Set `sawo-main/frontend/.env`'s `REACT_APP_CONTACT_FORM_API_BASE` to the
   deployed base URL and rebuild/redeploy the frontend.
5. Verify: submit one real inquiry per category (technical/customer/general)
   and check the staff inbox, Odoo ticket, customer's inbox, and
   `/admin/inbox` in the CMS.

**For the full walkthrough** — cPanel-specific navigation, PHP version/
extension checks, `.htaccess` verification, SMTP/port troubleshooting, a
full verification checklist, and a troubleshooting table — see
[`CPANEL-SETUP.md`](./CPANEL-SETUP.md) in this same folder.
