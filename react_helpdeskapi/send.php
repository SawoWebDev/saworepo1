<?php
/**
 * Staff notification endpoint for the React contact form.
 *
 * Standalone counterpart to helpdeskapi/send.php (WordPress reference, left
 * untouched) — same field shape and HTML template, with:
 *   - mail() replaced by the authenticated SimpleSMTPMailer (config.php /
 *     .env-backed SMTP account), instead of the unauthenticated local MTA.
 *   - CORS restricted to an explicit origin allow-list instead of "*".
 *   - Recipient resolution: Settings.jsx's configured contact_notify_email
 *     (looked up server-side from Supabase) overrides the existing
 *     Europe-hub / info@sawo.com region routing when set; the region
 *     routing is preserved as the fallback. The client never supplies the
 *     destination address — this endpoint has open CORS, so trusting a
 *     client-supplied "to" would turn it into an anonymous mail relay.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/SimpleSMTPMailer.php';

header('Content-Type: application/json');

// ---------- CORS ----------
$allowedOrigins = array_map('trim', explode(',', CONTACT_FORM_ALLOWED_ORIGINS));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/* ---------- Helpers (replace WP sanitizers) ---------- */
function clean_text(string $value): string {
    // strip_tags first, then strip CR/LF so nothing here can smuggle extra
    // headers into the raw SMTP message built below (header injection).
    $value = trim(strip_tags($value));
    return str_replace(["\r", "\n"], '', $value);
}
function clean_textarea(string $value): string {
    return trim(strip_tags($value));
}
function clean_email(string $value): string {
    $value = filter_var(trim($value), FILTER_SANITIZE_EMAIL);
    return filter_var($value, FILTER_VALIDATE_EMAIL) ? $value : '';
}
function esc_html_str(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

/* ---------- Sanitize Inputs ---------- */
$fname = clean_text($input['fname'] ?? '');
$lname = clean_text($input['lname'] ?? '');
$name  = trim("$fname $lname");

$email        = clean_email($input['email'] ?? '');
$phone        = clean_text($input['phone'] ?? '');
$country      = clean_text($input['country'] ?? '');
$category     = clean_text($input['category'] ?? '');
$address      = clean_text($input['address'] ?? '');
$product      = clean_text($input['productName'] ?? '');
$serial       = clean_text($input['serialNumber'] ?? '');
$issue        = clean_textarea($input['issue'] ?? '');
$notes        = clean_textarea($input['notes'] ?? '');
$subjectInput = clean_text($input['subject'] ?? '');
$message      = clean_textarea($input['message'] ?? '');
$source 	  = clean_text($input['source'] ?? '');

if (!$fname || !$lname || !$email || !$country) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

/* ---------- Recipient resolution ----------
   Priority: Settings.jsx's configured `contact_notify_email` (Supabase
   app_settings, looked up server-side) -> existing Europe-hub / info@sawo.com
   region routing as the fallback when nothing is configured or the lookup
   fails. Never taken from the request body. */
function get_configured_notify_email(): ?string {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return null;
    }

    $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/app_settings'
         . '?key=eq.contact_notify_email&select=value';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . SUPABASE_ANON_KEY,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response === false) {
        return null;
    }
    $rows = json_decode($response, true);
    $value = $rows[0]['value'] ?? null;
    return (is_string($value) && filter_var($value, FILTER_VALIDATE_EMAIL)) ? $value : null;
}

$europeCountries = [
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium',
    'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus',
    'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France',
    'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
    'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands',
    'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania',
    'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia',
    'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine',
    'United Kingdom', 'Vatican City',
];

function isEurope(string $country, array $list): bool {
    foreach ($list as $c) {
        if (strcasecmp(trim($country), $c) === 0) {
            return true;
        }
    }
    return false;
}

$configuredRecipient = get_configured_notify_email();
if ($configuredRecipient) {
    $to = $configuredRecipient;
} else {
    $to = isEurope($country, $europeCountries) ? 'europehub@sawo.com' : 'info@sawo.com';
}

$subject = !empty($subjectInput)
    ? "Inquiry from $country: $name"
    : "Inquiry from $country ($category)";

/* ---------- Embed Logo as Base64 ---------- */
$logo_path   = __DIR__ . '/assets/SAWO-logo.png';
$logo_base64 = '';
if (file_exists($logo_path)) {
    $logo_base64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logo_path));
}

$fields = [
    'Name'          => $name,
    'Email'         => $email,
    'Phone'         => $phone,
    'Country'       => $country,
    'Category'      => $category,
    'Subject'       => $subjectInput,
    'Address'       => $address,
    'Product'       => $product,
    'Serial Number' => $serial,
];

$finalMessage = !empty(trim($issue)) ? $issue : $message;

/* ---------- Build HTML body ---------- */
$body  = '<html><body style="font-family:Arial,sans-serif;background:#ffffff;padding:20px;">';
$body .= '
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
    <div style="padding:20px;">
        <h2 style="color:#333;border-bottom:2px solid #af8564;padding-bottom:10px;margin-bottom:20px;font-size:22px;">
            Inquiry from ' . esc_html_str($country) . '
        </h2>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#333;">
';

foreach ($fields as $label => $value) {
    if (!empty(trim($value))) {
        $body .= '
        <tr>
            <td style="font-weight:bold;width:150px;vertical-align:top;border-bottom:1px solid #eee;">' . esc_html_str($label) . ':</td>
            <td style="border-bottom:1px solid #eee;">' . esc_html_str($value) . '</td>
        </tr>';
    }
}

$body .= '</table>';

if ($source === 'chatbot' && !empty(trim($message))) {
    $body .= '
    <h3 style="margin-top:25px;color:#333;">Conversation</h3>
    <div style="background:#f7f7f7;padding:12px;border-left:4px solid #af8564;line-height:1.5;white-space:pre-wrap;">
        ' . nl2br(esc_html_str($message)) . '
    </div>';
} else {
    if (!empty(trim($message))) {
        // Non-chatbot submission — show message as a normal one-off message, not a transcript
        $body .= '
    <h3 style="margin-top:25px;color:#333;">Message</h3>
    <p style="line-height:1.5;">' . nl2br(esc_html_str($message)) . '</p>';
    }

    if (!empty(trim($notes))) {
        $body .= '
    <h3 style="margin-top:20px;color:#333;">Notes</h3>
    <p style="line-height:1.5;">' . nl2br(esc_html_str($notes)) . '</p>';
    }
}

$body .= '
    <hr style="margin:30px 0 15px 0;border:none;border-top:1px solid #eee;">
    <p style="font-size:12px;color:#777;text-align:center;margin:0 0 15px 0;line-height:1.4;">
        This email was generated from the SAWO website contact form.
    </p>';

if ($logo_base64) {
    $body .= '<img src="' . $logo_base64 . '" alt="SAWO Sauna" width="80" height="51" style="display:block;">';
}

$body .= '</div></div></body></html>';

/* ---------- Attachments ----------
   Structurally identical to the WordPress reference implementation's field
   shape (kept for forward-compat) — but currently unreachable: Contact.jsx
   posts `Content-Type: application/json`, never multipart/form-data, so
   $_FILES is always empty here today. Wiring real uploads later needs (a)
   the React form switched to a multipart POST and (b) SimpleSMTPMailer
   extended with a multipart/mixed attachment builder — neither exists
   because nothing currently exercises this path. */
$attachments = [];
$allowed_ext = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xlsx'];
$max_attachment_bytes = 8 * 1024 * 1024; // 8MB per file

if (!empty($_FILES['photos']['name'][0])) {
    foreach ($_FILES['photos']['name'] as $i => $filename) {
        if (empty($_FILES['photos']['tmp_name'][$i])) continue;
        if (($_FILES['photos']['size'][$i] ?? 0) > $max_attachment_bytes) continue;

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (in_array($ext, $allowed_ext, true)) {
            $attachments[] = [
                'filename' => basename($filename),
                'content'  => file_get_contents($_FILES['photos']['tmp_name'][$i]),
            ];
        }
    }
}

/* ---------- Send Email (authenticated SMTP) ---------- */
$mailer = new SimpleSMTPMailer(SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_DEBUG);

try {
    // Envelope/From stays the authenticated SAWO SMTP account regardless of
    // who submitted the form; Reply-To is the customer's own address so
    // staff replies land with them directly.
    $sent = $mailer->send(SMTP_FROM_EMAIL, SMTP_FROM_NAME, $to, $subject, strip_tags($body), $email, $body);
} catch (\Throwable $e) {
    error_log('[react_helpdeskapi] send.php SMTP failure: ' . $e->getMessage());
    $sent = false;
}

/* ---------- Response ---------- */
if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your request has been submitted successfully.',
    ]);
} else {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'There was an error submitting your request.',
    ]);
}
