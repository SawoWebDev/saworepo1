# cPanel Setup Guide — `react_helpdeskapi`

Step-by-step guide to getting the React contact form's PHP backend live on
the same cPanel host that already runs `helpdeskapi` for WordPress. Written
so someone with cPanel access but no prior context can follow it end to end.

This does **not** touch `helpdeskapi` in any way — it's a parallel,
independent deployment. If something goes wrong here, the WordPress contact
form keeps working exactly as it does today.

---

## 0. What you're setting up, in one paragraph

`react_helpdeskapi` is a folder of PHP files that needs to live somewhere
web-accessible on the same server WordPress/`helpdeskapi` already runs on
(confirmed from `helpdeskapi`'s old error log: `/home2/sawocom/public_html/`).
Once uploaded, it creates Odoo helpdesk tickets, emails your staff, and
emails the customer an auto-reply — all through the same SAWO mailbox and
Odoo account `helpdeskapi` already uses. The only new things it needs beyond
what's already configured for `helpdeskapi` are: its own directory, an
outbound connection to Odoo/SMTP/Supabase (same as before, just from a new
folder), and a `.env` file with credentials.

---

## 1. Prerequisites — confirm before uploading anything

Log into cPanel and check these first; all of them affect whether this will
actually work once uploaded.

### 1a. PHP version

**cPanel → Software → MultiPHP Manager.** Find the domain/folder this will
live under and note the PHP version it's set to. This code needs **PHP 7.1
or newer** (uses nullable return types and `catch (\Throwable ...)`); PHP
8.0+ is recommended if available, since 7.x is end-of-life upstream.

If `helpdeskapi` already runs fine on this account, whatever PHP version
it's using is already known-good — match it, or go newer.

### 1b. Required PHP extensions

**cPanel → Software → Select PHP Version → Extensions** (or **MultiPHP INI
Editor**, depending on cPanel version). Confirm these are checked/enabled:

| Extension | Used for | If missing |
|---|---|---|
| `curl` | Talking to Odoo's JSON-RPC API, and the Supabase recipient lookup in `send.php` | Both `app.php` and `send.php`'s `get_configured_notify_email()` fatal immediately |
| `openssl` | `STREAM_CRYPTO_METHOD_TLS_CLIENT` in `SimpleSMTPMailer`'s STARTTLS step | SMTP send throws "Failed to enable TLS encryption" |
| `mbstring` | `IntentClassifier::normalize()` (`mb_strtolower`) | Auto-reply's `"other"` category classification errors when it runs |
| `json` | Built into PHP core since 7.0 — just confirm it's not explicitly disabled | Every endpoint response breaks |

`helpdeskapi` already needs `curl` and `openssl` for the exact same reasons
(it also calls Odoo and, in `SendRespond.php`, already uses
`SimpleSMTPMailer`) — so if `helpdeskapi` works today, these are very likely
already on. Worth a 30-second check anyway.

### 1c. `fsockopen()` is not disabled

`SimpleSMTPMailer` opens a raw TCP socket to the SMTP server — it does not
use cURL or PHP's `mail()`. Some shared-hosting PHP configurations disable
`fsockopen` via `disable_functions` in `php.ini` as an anti-abuse measure.

**Check:** cPanel → **MultiPHP INI Editor** → select the domain/folder →
**Editor Mode** → search the config for `disable_functions`. If `fsockopen`
appears in that comma-separated list, it needs to be removed (talk to your
host if you don't have that permission — some hosts lock this down
account-wide, not just per-domain).

This exact function is already relied on by `helpdeskapi/SendRespond.php`,
so if that has ever successfully sent an email, `fsockopen` is already
enabled and you can skip this check.

### 1d. Outbound SMTP (port 587) isn't blocked

Some hosts block outbound connections on mail ports to prevent the server
being used to spam other providers. Since `mail.sawo.com` is (almost
certainly) this same cPanel account's own mail service, this is unlikely to
be an issue — but if the SMTP send fails with a connection error (not an
auth error) after everything else checks out, this is the next thing to ask
your host about.

### 1e. The SMTP mailbox exists

**cPanel → Email → Email Accounts.** Confirm the mailbox referenced in
`.env`'s `SMTP_USERNAME` exists and that you know its current password. If
that password has ever been rotated since `helpdeskapi/SendRespond.php` was
last written, `.env`'s `SMTP_PASSWORD` needs the *current* one, not
whatever's in the old reference file.

---

## 2. Upload the files

### 2a. Choose the target path

Recommended: `public_html/react_helpdeskapi/` — a sibling of
`public_html/helpdeskapi/`, so the URL becomes
`https://sawo.com/react_helpdeskapi/...`, matching what
`src/config/contactFormApi.js`'s default already assumes
(`REACT_APP_CONTACT_FORM_API_BASE`).

If you're setting up a dedicated API subdomain instead (see §6, "Domain
cutover considerations"), the target path changes accordingly, but the
folder contents are the same either way.

### 2b. What to upload

Upload **everything in `react_helpdeskapi/` except the `dev/` folder**:

```
config.php
app.php
send.php
indxe.php
.htaccess
lib/
  .htaccess
  SimpleSMTPMailer.php
  IntentClassifier.php
  SendRespond.php
```

Do **not** upload `dev/` (test harness — not meant for the live host; see
§7 for how to test without it) or your local `.env` verbatim unless the
values in it are the actual production values you want live (see §3).

### 2c. How to upload

**Option A — cPanel File Manager:**
1. cPanel → **Files → File Manager** → navigate to `public_html`.
2. Create a new folder named `react_helpdeskapi`.
3. Zip the local folder first (excluding `dev/` and `.env` — see §2b),
   upload the zip via File Manager's Upload button, then use File Manager's
   **Extract** action on it. Faster than uploading dozens of files
   one-by-one over a slow connection.

**Option B — FTP/SFTP client** (FileZilla, WinSCP, etc.):
1. Get credentials from cPanel → **Files → FTP Accounts** (or reuse your
   main cPanel login over SFTP on port 22, if enabled).
2. Connect, navigate to `public_html`, upload the folder directly —
   preserves the directory structure without needing to zip/extract.

Either way, **hidden files** (anything starting with `.`, i.e. `.htaccess`
and `.env`) are easy to miss — some FTP clients hide dotfiles by default.
Double-check `.htaccess` actually made it into both `react_helpdeskapi/`
and `react_helpdeskapi/lib/` after upload (§4 below verifies this).

---

## 3. Create `.env` on the server

The local `react_helpdeskapi/.env` already has the real production values
filled in (Odoo credentials, SMTP account, Supabase keys). Two ways to get
it onto the server:

**Fastest:** upload that local `.env` file directly, same as any other file
in §2c — it's already correct for the production Odoo/SMTP/Supabase
accounts documented in this project. Skip to §3a to confirm the one field
that does need editing per-environment.

**Or, build it from scratch:** in File Manager, create a new file named
`.env` inside `react_helpdeskapi/`, open it, and copy the structure from
`.env.example` (same folder) — fill in each value. Cross-reference
`helpdeskapi/config.php` and `helpdeskapi/SendRespond.php` for the Odoo/SMTP
credentials those files already hardcode, since this is the same account.

### 3a. The one value to double-check regardless: `CONTACT_FORM_ALLOWED_ORIGINS`

This must exactly match the origin the React app is actually served from —
scheme + host, no trailing slash, comma-separated if more than one:

```
CONTACT_FORM_ALLOWED_ORIGINS=https://www.sawo.com,https://saworepo1.pages.dev
```

Get this wrong and the browser will silently block the request with a CORS
error (see §8 troubleshooting) — nothing server-side will look broken, only
the browser console will show it.

### 3b. Permissions

`.env` should not be world-writable. `644` (owner read/write, everyone else
read-only) is the standard safe default on shared hosting — set via File
Manager's **Permissions** dialog (right-click the file → Change
Permissions) or `chmod 644 .env` if you have terminal access (cPanel →
**Advanced → Terminal**, if enabled on the account).

---

## 4. Verify `.htaccess` is actually blocking direct access

The `.htaccess` files shipped in this folder block direct HTTP access to
`.env`, `config.php`, and everything in `lib/` — but `.htaccess` only works
if the Apache vhost has `AllowOverride All` (or at least `AllowOverride
Limit`) set for that directory. On cPanel shared hosting this is enabled by
default for `public_html`, but **verify it actually took effect** rather
than assuming:

1. In a browser, visit `https://sawo.com/react_helpdeskapi/.env`
   (adjust path if deployed elsewhere).
2. **Expected:** `403 Forbidden`.
3. **If you instead see the raw file contents (your credentials in
   plaintext) — stop, this is a real leak.** Most likely cause: the hosting
   account's Apache config has `AllowOverride None` for this path, so
   `.htaccess` is being ignored entirely. Contact your host, or as an
   immediate stopgap, move `.env` one directory above `public_html`
   (outside the web root entirely) and update `config.php`'s
   `react_helpdeskapi_load_env(__DIR__ . '/.env')` call to point at the
   new relative location — but exhaust the `AllowOverride` fix first, since
   moving `.env` outside the folder is a code change this doc's steps
   don't otherwise require.

Also check `https://sawo.com/react_helpdeskapi/lib/SimpleSMTPMailer.php`
— expected `403 Forbidden` as well.

---

## 5. Point React at the deployed URL

In `sawo-main/frontend/.env`:

```
REACT_APP_CONTACT_FORM_API_BASE=https://sawo.com/react_helpdeskapi
```

Adjust the host if you deployed to a subdomain instead (§6). This is a
**build-time** variable for Create React App — editing `.env` alone does
nothing to an already-running dev server or an already-built production
bundle. Rebuild and redeploy the frontend after changing it.

---

## 6. Domain cutover considerations

Covered in more depth in `docs/🔴 GO-LIVE/CONTACT-FORM-PLAN.md` — summary:

- If `sawo.com`'s root DNS still points at this same cPanel server (WordPress
  hasn't moved to Cloudflare Pages yet), path-based deployment
  (`sawo.com/react_helpdeskapi/`) works with **zero DNS changes**.
- If/when the root domain moves to Cloudflare Pages for the React app,
  `sawo.com/react_helpdeskapi/*` stops resolving to this cPanel server
  unless you either (a) keep a dedicated subdomain (e.g. `api.sawo.com`)
  pointed at this cPanel server's IP via a DNS A/CNAME record, independent
  of the Pages cutover, or (b) add a Cloudflare Worker/Pages Function that
  reverse-proxies that specific path back to this server.
- Recommended: option (a), a subdomain. When that happens, this guide's
  steps are unchanged except the target path/URL in §2a and §5.

---

## 7. Smoke test before trusting it with real customers

**Don't** upload `dev/test-form.html` to production for this — instead,
either:

- Run it **locally**: open `react_helpdeskapi/dev/test-form.html` on your
  own machine, set its "API base URL" field to
  `https://sawo.com/react_helpdeskapi` (the live URL), and submit a test
  entry. It POSTs directly, same as the real React form would, no need to
  touch the site itself.
- Or use `curl` from your own machine:
  ```bash
  curl -X POST https://sawo.com/react_helpdeskapi/indxe.php \
    -H "Content-Type: application/json" \
    -d '{"fname":"Test","lname":"User","email":"you@example.com","country":"Philippines","category":"customer","subject":"Feedback","describeIssue":"cPanel smoke test"}'
  ```
  Expect back `{"success":true,"ticket":{...}}`. Repeat against `send.php`
  with the same payload, expect `{"success":true,"message":"..."}`.

Use a real email address you control as `email` in the test payload — it's
what the customer auto-reply and Odoo partner record will use. Don't use a
real customer's address for this test.

---

## 8. Full verification checklist

Once the smoke test above returns `success: true` from both endpoints:

- [ ] **Staff email arrives** at the expected recipient, with the customer's
      email as Reply-To, HTML rendering correctly (check spam folder too —
      first send from a new sending pattern sometimes lands there once).
- [ ] **Odoo ticket exists** with the right fields (partner, product info,
      description) — check the Odoo helpdesk directly.
- [ ] **Customer receives the auto-reply** at the test address you used, and
      it's the *right template* for the subject you tested (Feedback →
      feedback template, Repair/Replacement → technical template, anything
      else → the classifier-routed sales/general template).
- [ ] **`/admin/inbox`** in the CMS shows the submission (only true once
      you've also tested via the real React form, not raw `curl` — `curl`
      hits the PHP endpoints directly and skips the Supabase logging that
      only `Contact.jsx` performs).
- [ ] **Settings → Contact Form Recipient override** — set a value there,
      submit again, confirm the staff notification actually goes to that
      address instead of the default region routing. Clear it afterward if
      you were just testing.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser console shows a CORS error, no request even reaches the server (or request is blocked after) | `CONTACT_FORM_ALLOWED_ORIGINS` doesn't exactly match the page's origin | Fix the value in `.env` (§3a) — check scheme, host, and no trailing slash |
| `500 Internal Server Error`, blank response | PHP fatal error | Check PHP's error log — cPanel → **Metrics → Errors**, or set a custom log path in MultiPHP INI Editor. Common cause: a missing extension (§1b) |
| `indxe.php` returns `{"success":false,"error":"Failed to connect to Odoo."}` | Wrong `ODOO_USERNAME`/`ODOO_PASSWORD`/`ODOO_API_KEY` in `.env`, or Odoo itself is unreachable from this server | Double check `.env` against `helpdeskapi/config.php`'s values (same account) |
| `send.php` returns `{"success":false,"message":"..."}`, HTTP 502 | SMTP send failed — check the server's PHP error log for `[react_helpdeskapi] send.php SMTP failure: ...` | Auth error → wrong `SMTP_USERNAME`/`SMTP_PASSWORD` or the mailbox password was rotated (§1e). Connection error → port 587 blocked (§1d) or wrong `SMTP_HOST` |
| `.env` or files in `lib/` are viewable directly in the browser | `.htaccess` isn't being applied | See §4 |
| Customer never gets an auto-reply, but the ticket was created fine | Expected for some subjects if `lib/SendRespond.php`'s SMTP send itself fails — this is logged (`error_log`) but deliberately never turns into a ticket-creation error | Check the PHP error log for `[react_helpdeskapi] customer auto-reply failed: ...` |
| Everything returns `success:true` but nothing arrives anywhere | You tested with `curl`/the dev form against a URL that's actually still hitting cached/old files, or you edited the wrong `.env` (local vs. server) | Confirm you edited the file that's actually on the server, not your local copy — re-upload if unsure |

---

## 10. Rollback

Nothing here can break `helpdeskapi` or the WordPress form — they're
untouched, separate files, separate URL path. If `react_helpdeskapi`
turns out broken after go-live, the safe rollback is simply reverting
`sawo-main/frontend/.env`'s `REACT_APP_CONTACT_FORM_API_BASE`... but there's
nothing to roll back *to*, since the React form never pointed at
`helpdeskapi`. The actual rollback is: fix forward using §9 above, or point
`REACT_APP_CONTACT_FORM_API_BASE` at nothing valid temporarily while you
debug — the form will then show its existing "there was an error" message
rather than silently misbehaving, buying time without any customer data
loss (submissions still get their best-effort Supabase log regardless).
