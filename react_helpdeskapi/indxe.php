<?php
/**
 * Odoo helpdesk-ticket endpoint for the React contact form.
 *
 * Standalone counterpart to helpdeskapi/indxe.php (WordPress reference,
 * left untouched) — same Odoo ticket fields/shape, plus:
 *   - CORS restricted to an explicit origin allow-list (config.php) instead
 *     of the reference's "adjust origin as needed" wildcard.
 *   - After a successful ticket create, fires the customer auto-reply
 *     (SendRespond) — see mapSubjectToRequest() below. A failure here is
 *     logged but never turns a created ticket into an error response.
 */

require_once __DIR__ . '/config.php';

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

require_once __DIR__ . '/app.php';
require_once __DIR__ . '/lib/SendRespond.php';

$application = new app();

try {
    // Connect to Odoo
    $connection = $application->connect();
    if (!isset($connection['success']) || !$connection['success']) {
        throw new Exception("Failed to connect to Odoo.");
    }

    // Parse the input data
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $fname = trim((string) ($input['fname'] ?? ''));
    $lname = trim((string) ($input['lname'] ?? ''));
    $fullname = trim("$fname $lname");

    // Validate required fields
    $email = $input['email'] ?? null;
    $name = $fullname !== '' ? $fullname : null;
    $phone = $input['phone'] ?? null;
    $country = $input['country'] ?? null;
    $category = $input['category'] ?? null; // "technical" | "customer" | "general" — form's top-level category
    $product_category = $input['productCategory'] ?? null;
    $product_name = $input['productName'] ?? null;
    $serial_number = $input['serialNumber'] ?? null;
    $product_code = $input['productCode'] ?? null;
    $purchase_invoice = $input['purchaseInvoice'] ?? null;
    $issue = $input['issue'] ?? null;
    $subject = $input['subject'] ?? null;
    $room_width_size = $input['width'] ?? 0;
    $room_length_size = $input['depth'] ?? 0;
    $room_height_size = $input['height'] ?? 0;
    $add_product_info = $input['addProductInfo'] ?? null;
    $description = $input['describeIssue'] ?? null;

    if (!$email || !$name || !$description || !$subject) {
        throw new Exception("Missing required fields: email, name, or description.");
    }

    // Step 1: Check if the partner exists or create a new one
    $lastPartner = $application->query(
        'res.partner',
        'search_read',
        [
            [['email', '=', $email]],
            ['id', 'name', 'email', 'phone'],
            0,
            1
        ],
        ['context' => ['order' => 'id desc']]
    );

    $partner_id = isset($lastPartner['result'][0]['id']) ? $lastPartner['result'][0]['id'] : createNewPartner($application, $name, $email, $phone);

    if (!$partner_id) {
        throw new Exception("Failed to create or retrieve partner.");
    }

    // Step 2: Create the ticket
    $newTicket = $application->createTicket(
        'helpdesk.ticket',
        'create',
        [
            [
                'name' =>  $subject,
                'partner_id' => $partner_id,
                'priority' => 0,
                'description' => $description,
                'team_id' => 1,
                'x_studio_product_category' =>  $product_category,
                'x_studio_product_name' => $product_name,
                'x_studio_purchase_invoice_number_1' => $purchase_invoice,
                'x_studio_serial_number' => $serial_number,
                'x_studio_product_code_1' => $product_code,
                'x_studio_issue' => $issue,
                'x_studio_country' => $country, // Country
                'x_studio_subject' => $subject, // Subject
                'x_studio_sauna_room_size_in_m3' => $room_width_size, // width
                'x_studio_sauna_room_size_length_in_m3' => $room_length_size, // length
                'x_studio_sauna_room_size_height_in_m3' => $room_height_size, // height
                'x_studio_product_information' => $add_product_info // Additional Product Information
            ]
        ],
        ['context' => ['lang' => 'en_US']]
    );

    // Step 3: Customer auto-reply — only after the ticket actually exists,
    // and only ever logged on failure, never surfaced as a ticket-creation
    // error (the ticket is real either way).
    // SendRespond::sendRespond() echoes its own "Email sent to ..." status
    // line (existing behavior, unchanged) — buffered and discarded here so
    // it can't corrupt this endpoint's JSON response body.
    try {
        $request = mapSubjectToRequest($subject);
        $respond = new SendRespond();
        ob_start();
        $respond->sendRespond($email, $name, $request, $product_category, $description, $category);
        ob_end_clean();
    } catch (\Throwable $autoReplyError) {
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        error_log('[react_helpdeskapi] customer auto-reply failed: ' . $autoReplyError->getMessage());
    }

    // Return the ticket response
    echo json_encode([
        'success' => true,
        'ticket' => $newTicket
    ]);
} catch (Exception $e) {
    // Handle errors and return JSON response
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Maps the React form's subject values onto SendRespond's $request buckets.
 * Only "Repair Inquiry"/"Replacement Request" (technical) and "Feedback" have
 * dedicated templates; every other real subject the form can send —
 * "Customer Support", "Order Status", "Purchase Inquiry", "Other", or a
 * free-text General-inquiry subject — falls through to "other", which
 * SendRespond routes through IntentClassifier (sales vs. general) instead of
 * being left undefined (undefined would fatal inside sendRespond()).
 */
function mapSubjectToRequest($subject)
{
    if ($subject === 'Repair Inquiry' || $subject === 'Replacement Request') {
        return 'technicalInquiry';
    }
    if ($subject === 'Feedback') {
        return 'feedback';
    }
    return 'other';
}

/**
 * Create a new partner
 */
function createNewPartner($application, $name, $email, $phone) {
    $newPartnerData = [
        'name' => $name,
        'email' => $email,
        'phone' => $phone ?? "",
        'company_type' => 'person'
    ];

    $newPartner = $application->createContacts(
        'res.partner',
        'create',
        [$newPartnerData],
        ['context' => ['lang' => 'en_US']]
    );

    return isset($newPartner['result']) ? $newPartner['result'] : null;
}
