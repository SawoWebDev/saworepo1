<?php
/**
 * Loads react_helpdeskapi/.env (KEY=VALUE, one per line) if present, and
 * exposes everything the rest of this backend needs as constants.
 *
 * No Composer/dotenv dependency, deliberately — this backend follows the
 * same pure-PHP, no-external-library convention as lib/SimpleSMTPMailer.php.
 *
 * IMPORTANT — this repo is public. The defaults below are deliberately left
 * blank/placeholder; do NOT fill in real credentials here and commit them.
 * The actual deployed copy of this file (uploaded manually to the PHP host)
 * has real values filled in locally on that server only — that copy is not
 * this one and was never pushed to git. If your specific host can't create
 * `.env`/`.htaccess` (e.g. a restrictive File Manager plugin), fill in real
 * values directly in a copy of this file that you upload, but never commit
 * that copy — keep it out of git entirely.
 */

function react_helpdeskapi_load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }

        $key = trim(substr($line, 0, $eq));
        $value = trim(substr($line, $eq + 1));

        // Strip one layer of matching quotes, e.g. FOO="bar baz"
        if (strlen($value) >= 2) {
            $first = $value[0];
            $last = $value[strlen($value) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $value = substr($value, 1, -1);
            }
        }

        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
        }
    }
}

function react_helpdeskapi_env(string $key, $default = null)
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

react_helpdeskapi_load_env(__DIR__ . '/.env');

// ---------- Odoo ----------
define('ODOO_URL', react_helpdeskapi_env('ODOO_URL', 'https://erp.sawo.com'));
define('ODOO_USERNAME', react_helpdeskapi_env('ODOO_USERNAME', ''));
define('ODOO_PASSWORD', react_helpdeskapi_env('ODOO_PASSWORD', ''));
define('ODOO_API_KEY', react_helpdeskapi_env('ODOO_API_KEY', ''));

// ---------- SMTP (authenticated relay — same account SendRespond.php already
// used) ----------
define('SMTP_HOST', react_helpdeskapi_env('SMTP_HOST', 'mail.sawo.com'));
define('SMTP_PORT', (int) react_helpdeskapi_env('SMTP_PORT', 587));
define('SMTP_USERNAME', react_helpdeskapi_env('SMTP_USERNAME', ''));
define('SMTP_PASSWORD', react_helpdeskapi_env('SMTP_PASSWORD', ''));
define('SMTP_FROM_EMAIL', react_helpdeskapi_env('SMTP_FROM_EMAIL', 'info@sawo.com'));
define('SMTP_FROM_NAME', react_helpdeskapi_env('SMTP_FROM_NAME', 'SAWO Sauna Support'));
define('SMTP_DEBUG', filter_var(react_helpdeskapi_env('SMTP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN));

// ---------- Supabase (read-only lookup of the admin-configured notification
// recipient — app_settings.contact_notify_email; anon key only, no writes) ----------
define('SUPABASE_URL', react_helpdeskapi_env('SUPABASE_URL', 'https://qsdfdfuooeythaioucpx.supabase.co'));
define('SUPABASE_ANON_KEY', react_helpdeskapi_env('SUPABASE_ANON_KEY', ''));

// ---------- CORS ----------
// Comma-separated list of origins allowed to call these endpoints directly.
// http://127.0.0.1:5501 (VS Code Live Server's default) is included for
// local testing with dev/test-form.html — remove it once testing is done,
// it's harmless to leave (loopback-only, nobody outside your own machine
// can ever send a request that claims that origin) but not needed long-term.
define('CONTACT_FORM_ALLOWED_ORIGINS', react_helpdeskapi_env('CONTACT_FORM_ALLOWED_ORIGINS', 'https://www.sawo.com,https://saworepo1.pages.dev,http://127.0.0.1:5501'));
