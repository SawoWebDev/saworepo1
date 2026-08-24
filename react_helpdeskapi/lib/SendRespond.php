<?php
require_once __DIR__ . '/SimpleSMTPMailer.php';
require_once __DIR__ . '/IntentClassifier.php';
// Assumes config.php (one level up) has already been required by the caller
// — indxe.php does this before instantiating SendRespond, so SMTP_* constants
// are already defined by the time sender() runs.

/**
 * Customer auto-reply system. Copied from helpdeskapi/SendRespond.php —
 * templates and branching logic unchanged. The only edit is in sender():
 * the SMTP account is now read from config.php's .env-backed constants
 * instead of being hardcoded here.
 */
class SendRespond
{
    private $from = "SAWO Sauna Support <info@sawo.com>";
    private $respondText;
    private $respond;
    private $sendTo;
    private $email;
    private $subject;

    public function sendRespond($email, $customername, $request = "", $productname = "", $description = "", $category = "")
    {
        if ($request === "feedback") {
            $subject = "We've Received Your Feedback — Thank You!";
            $this->respondText = $this->setfeedBackText($customername);
            $this->respond = $this->setfeedBack($customername, $subject);
            $this->subject = $subject;
        }

        if ($request === "technicalInquiry") {
            $subject = "Your Technical Inquiry Has Been Received.";
            $this->respondText = $this->settechnicalInquiryText($customername, $productname, $description); // $customername, $productName, $description
            $this->respond = $this->settechnicalInquiry($customername, $subject, $productname, $description); // $customerName, $subject, $productName, $description = ""
            $this->subject = $subject;
        }

        if ($request === "other") {
            $result = IntentClassifier::classify($category, $description, $request);

            if ($result['confidence'] === 'high' || $result['confidence'] === 'medium') {
                $map = [
                    IntentClassifier::SALES => 'sales',
                    IntentClassifier::TECHNICAL => 'technicalInquiry',
                    IntentClassifier::FEEDBACK => 'feedback',
                ];
                $request = isset($map[$result['intent']]) ? $map[$result['intent']] : 'other';
            } else {
                $request = 'other';
            }


            if ($result['intent'] == 'sales') {
                $subject = "We've Received Your Inquiry — SAWO Sauna";
                $this->respondText = $this->setSalesInquiryText($customername, $productname);
                $this->respond = $this->setSalesInquiry($customername, $subject, $productname);
            } else {
                $subject = "We've Received Your Message";
                $this->respondText = $this->setGeneralText($customername, $productname);
                $this->respond = $this->setGeneral($customername, $subject, $productname);
            }
            $this->subject = $subject;
        }

        $this->sendTo = $email;
        $this->email = $email;

        echo $this->sender();
    }

    public function sender()
    {
        $headers = "From: {$this->from}\r\n";
        $headers .= "Reply-To: {$this->getEmail()}\r\n";
        $headers .= "MIME-Version: 1.0\r\n";

        $altBoundary = 'alt_' . bin2hex(random_bytes(16));
        $mixedBoundary = 'mixed_' . bin2hex(random_bytes(16));

        $msg = "--$altBoundary\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($this->getrespondText())) . "\r\n"
            . "--$altBoundary\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($this->getrespond())) . "\r\n"
            . "--$altBoundary--\r\n";

        $headers .= "Content-Type: multipart/related; boundary=\"$altBoundary\"\r\n";

        $encodedSubject = preg_match('/[\x80-\xFF]/', $this->getSubject())
            ? '=?UTF-8?B?' . base64_encode($this->getSubject()
            ) . '?='
            : $this->subject;

        // Authenticated SMTP account — source of the actual send. The
        // envelope/From stays the authenticated SAWO address regardless of
        // who the customer is; Reply-To is the customer's own address so
        // staff replies land with them.
        $mailer = new SimpleSMTPMailer(SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_DEBUG);

        $sent = $mailer->send(
    			SMTP_FROM_EMAIL,              // from
                SMTP_FROM_NAME,               // from name
                $this->getSendTo(),    		  // to
                $encodedSubject,
                $this->getrespondText(),
    			$this->getEmail(),
                $this->getrespond()
            );

        return $sent ? "Email sent to {$this->getSendTo()}\n" : "Failed to send email to {$this->getSendTo()}\n";
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getSendTo()
    {
        return $this->sendTo;
    }

    public function getSubject()
    {
        return $this->subject;
    }

    private function sawoLogo()
    {
        $path = 'https://www.sawo.com/wp-content/uploads/2025/12/SAWO-logo-200x128.png';
        if ($path) {
            return '<img src="' . $path . '" alt="SAWO Inc."'
                . ' width="120" style="display:block; border:0; max-width:120px; height:auto;">';
        }
        return '<span style="font-size:22px; font-weight:bold; letter-spacing:3px;'
            . ' color:#af8564;">SAWO Inc.</span>';
    }

    // FeedBack
    public function getrespondText()
    {
        return $this->respondText;
    }

    public function getrespond()
    {
        return $this->respond;
    }

    private function setfeedBackText($customer_name)
    {
        return <<<TEXT
Hi $customer_name,

Thank you for taking the time to share your feedback with us. We've logged your
message and forwarded it to the appropriate team for review.

If your feedback requires a personal response, someone from our team will get
back to you. If it's general feedback, please know it's being reviewed and
genuinely helps us improve our products and service.

If this is an urgent matter, please reply directly to this email so we can
prioritize it.

Thank you again for helping us do better.

Warm regards,
Customer Service Team
SAWO Inc.

--
This is an automated confirmation from SAWO Sauna Support.
Replies to this email reach our support team directly.
TEXT;
    }

    private function setfeedBack($customer_name, $subject)
    {
        $name = htmlspecialchars($customer_name, ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $logo = $this->sawoLogo();
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
</head>
<body style="margin:0; padding:0; background-color:#efedea; -webkit-font-smoothing:antialiased;">
<!-- Preheader: inbox preview text, hidden in the body itself -->
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Thanks for your feedback &mdash; we've logged it and passed it to the right team.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#efedea;">
<tr>
<td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px; width:100%; background-color:#ffffff;
                font-family:Arial, Helvetica, sans-serif;">
    <!-- Header band: logo left, tagline right -->
    <tr>
        <td style="padding:22px 32px; border-bottom:1px solid #e8e4e0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
            <td align="left" valign="middle">$logo</td>
            <td align="right" valign="middle"
                style="font-size:19px; color:#9a9289; white-space:nowrap;">
                Thanks for your feedback
            </td>
            </tr>
        </table>
        </td>
    </tr>
    <!-- Accent rule -->
    <tr>
        <td style="background-color:#af8564; height:3px; line-height:3px; font-size:0;">&nbsp;</td>
    </tr>
    <!-- Body -->
    <tr>
        <td style="padding:32px 32px 8px 32px; font-size:15px; line-height:1.65; color:#3a3a3a;">
        <p style="margin:0 0 22px 0; font-size:18px; color:#1f1f1f;">Hi $name,</p>
        <p style="margin:0 0 16px 0;">
            Thank you for taking the time to share your feedback with us. We've logged your
            message and forwarded it to the appropriate team for review.
        </p>
        <p style="margin:0 0 16px 0;">
            If your feedback requires a personal response, someone from our team will get back
            to you. If it's general feedback, please know it's being reviewed and genuinely
            helps us improve our products and service.
        </p>
        <p style="margin:0 0 16px 0;">
            If this is an urgent matter, please reply directly to this email so we can
            prioritize it.
        </p>
        <p style="margin:0 0 30px 0;">Thank you again for helping us do better.</p>

        <p style="margin:0 0 20px 0;">Warm regards,</p>

        <p style="margin:0 0 2px 0; font-weight:bold; font-size:16px; color:#1f1f1f;">
            Customer Service Team
        </p>
        <p style="margin:0; font-size:14px; color:#8a8279;">SAWO Inc.</p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:28px 32px 30px 32px;">
        <div style="border-top:1px solid #eeeae6; padding-top:16px;
                    font-size:12px; line-height:1.6; color:#9a9289;">
            This is an automated confirmation from SAWO Sauna Support.<br>
            Replies to this email reach our support team directly.
        </div>
        </td>
    </tr>
    </table>
</td>
</tr>
</table>

</body>
</html>
HTML;
    }

    private function settechnicalInquiryText($customername, $productName, $description)
    {
        return <<<TEXT
Hi $customername,

Thank you for reaching out about $productName. We've forwarded your inquiry to our technical support team. They will review the details and get back to you soon.

To help us respond as accurately as possible, it's helpful to have on hand the following information:

-	$productName
-	Description or Issue: $description

Our team will reach out with next steps. Thank you for your patience.

Warm regards,
The SAWO Team

TEXT;
    }

    private function settechnicalInquiry($customerName, $subject, $productName, $description = "")
    {
        $name = htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $logo = $this->sawoLogo();
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
</head>
<body style="margin:0; padding:0; background-color:#efedea; -webkit-font-smoothing:antialiased;">
<!-- Preheader: inbox preview text, hidden in the body itself -->
<div style="display:none; max-height:0; overflow:hidden; opacity:0;"></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#efedea;">
<tr>
<td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px; width:100%; background-color:#ffffff;
                font-family:Arial, Helvetica, sans-serif;">
    <!-- Header band: logo left, tagline right -->
    <tr>
        <td style="padding:22px 32px; border-bottom:1px solid #e8e4e0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
            <td align="left" valign="middle">$logo</td>
            <td align="right" valign="middle"
                style="font-size:19px; color:#9a9289; white-space:nowrap;">
                Thank you for your technical question
            </td>
            </tr>
        </table>
        </td>
    </tr>
    <!-- Accent rule -->
    <tr>
        <td style="background-color:#af8564; height:3px; line-height:3px; font-size:0;">&nbsp;</td>
    </tr>
    <!-- Body -->
    <tr>
        <td style="padding:32px 32px 8px 32px; font-size:15px; line-height:1.65; color:#3a3a3a;">
        <p style="margin:0 0 22px 0; font-size:18px; color:#1f1f1f;">Hi $name,</p>
        <p style="margin:0 0 16px 0;">
           Thank you for reaching out about $productName. We've forwarded your inquiry to our technical support team.
           They will review the details and get back to you soon.
        </p>
        <p style="margin:0 0 16px 0;">
            To help us respond as accurately as possible, it's helpful to have on hand the following information:
         </p>
        <p style="margin:0 0 16px 0;">
            - Product name or Code: $productName <br />
            - Description or Issue: $description
        </p>
        <p style="margin:0 0 30px 0;">Our team will reach out with next steps. Thank you for your patience. </p>

        <p style="margin:0 0 20px 0;">Warm regards,</p>
        <p style="margin:0 0 2px 0; font-weight:bold; font-size:16px; color:#1f1f1f;">
           The SAWO Team
        </p>
        <p style="margin:0; font-size:14px; color:#8a8279;">SAWO Inc.</p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:28px 32px 30px 32px;">
        <div style="border-top:1px solid #eeeae6; padding-top:16px;
                    font-size:12px; line-height:1.6; color:#9a9289;">
            This is an automated confirmation from SAWO Sauna Support.<br>
            Replies to this email reach our support team directly.
        </div>
        </td>
    </tr>
    </table>
</td>
</tr>
</table>

</body>
</html>
HTML;
    }

    private function productPhrase($product)
    {
        $product = trim($product);
        if ($product === '') {
            return 'our other products';
        }

        if (strtolower($product) === 'heater') {
            return 'our sauna heaters';
        }

        if ($product === 'Steam Generator' || $product === 'Accessory' || $product === 'Kivistone Item') {
            return 'our ' . $product;
        }

        return $product;
    }

    private function setSalesInquiryText($customerName, $product)
    {
        $_product = $this->productPhrase($product);

        return <<<TEXT
Hi $customerName,

Thank you for your interest in $_product. We've received your inquiry, and a
member of our sales team will follow up within one business day with pricing,
availability, and lead time details tailored to your needs.

In the meantime, here's a quick overview of our heater types in case it's
helpful while you compare options:

website link

If you already know which models you're interested in, just let us know in a
reply and we'll include those in your quote.

We look forward to helping you.

Warm regards,
Customer Service Team
SAWO Inc.

--
This is an automated confirmation from SAWO Sauna Support.
Replies to this email reach our support team directly.
TEXT;
    }
    private function setSalesInquiry($customerName, $subject, $product)
    {
        $productName = $this->productPhrase($product);
        $name = htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $logo = $this->sawoLogo();
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
</head>
<body style="margin:0; padding:0; background-color:#efedea; -webkit-font-smoothing:antialiased;">
<!-- Preheader: inbox preview text, hidden in the body itself -->
<div style="display:none; max-height:0; overflow:hidden; opacity:0;"></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#efedea;">
<tr>
<td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px; width:100%; background-color:#ffffff;
                font-family:Arial, Helvetica, sans-serif;">
    <!-- Header band: logo left, tagline right -->
    <tr>
        <td style="padding:22px 32px; border-bottom:1px solid #e8e4e0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
            <td align="left" valign="middle">$logo</td>
            <td align="right" valign="middle"
                style="font-size:19px; color:#9a9289; white-space:nowrap;">
            </td>
            </tr>
        </table>
        </td>
    </tr>
    <!-- Accent rule -->
    <tr>
        <td style="background-color:#af8564; height:3px; line-height:3px; font-size:0;">&nbsp;</td>
    </tr>
    <!-- Body -->
    <tr>
        <td style="padding:32px 32px 8px 32px; font-size:15px; line-height:1.65; color:#3a3a3a;">
        <p style="margin:0 0 22px 0; font-size:18px; color:#1f1f1f;">Hi $name,</p>
        <p style="margin:0 0 16px 0;">
           Thank you for your interest in $productName. We've received your inquiry, and a
            member of our sales team will follow up within one business day with pricing,
            availability, and lead time details tailored to your needs.
        </p>
        <p style="margin:0 0 16px 0;">
            In the meantime, here's a quick overview of our heater types in case it's helpful while you compare options:
         </p>
        <p style="margin:0 0 16px 0;">
            <a href="https://www.sawo.com/finnish-sauna/sauna-heaters/?_gl=1*1rw56cs*_gcl_au*MTEyMjgyMTA3Ni4xNzg2MzI0Mjc5*_ga*MTQ2NTMyMTQ3Mi4xNzcwMjU3MTc3*_ga_RYK2H2SZ2K*czE3ODY1MjA4NjMkbzkzJGcwJHQxNzg2NTIwODYzJGo2MCRsMCRoMA..*_ga_FG5FSKL5ME*czE3ODY1MjA4NjMkbzY4JGcwJHQxNzg2NTIwODYzJGo2MCRsMCRoMA..">Sauna Heater </a>
        </p>
        <p style="margin:0 0 30px 0;">If you already know which models you're interested in, just let us know in a
reply and we'll include those in your quote. </p>
        <p style="margin:0 0 30px 0;"> We look forward to helping you.</p>
        <p style="margin:0 0 20px 0;">Warm regards,</p>
        <p style="margin:0 0 2px 0; font-weight:bold; font-size:16px; color:#1f1f1f;">
           Customer Service Team
        </p>
        <p style="margin:0; font-size:14px; color:#8a8279;">SAWO Inc.</p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:28px 32px 30px 32px;">
        <div style="border-top:1px solid #eeeae6; padding-top:16px;
                    font-size:12px; line-height:1.6; color:#9a9289;">
            This is an automated confirmation from SAWO Sauna Support.<br>
            Replies to this email reach our support team directly.
        </div>
        </td>
    </tr>
    </table>
</td>
</tr>
</table>
</body>
</html>
HTML;
    }
    private function setGeneralText($customerName, $product)
    {
        $_product = $this->productPhrase($product);

        return <<<TEXT
Hi $customerName,

Thank you for reaching out about $_product. We've received your message and
it's been passed to the right team for review.

Someone will follow up with you within one business day. If your request is
urgent, you can reply directly to this email and we'll prioritize it.

Thank you for your interest in SAWO.

Warm regards,
Customer Service Team
SAWO Inc.

--
This is an automated confirmation from SAWO Sauna Support.
Replies to this email reach our support team directly.
TEXT;
    }

    private function setGeneral($customerName, $subject, $product)
    {
        $productName = $this->productPhrase($product);
        $name = htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $logo = $this->sawoLogo();
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
</head>
<body style="margin:0; padding:0; background-color:#efedea; -webkit-font-smoothing:antialiased;">
<!-- Preheader: inbox preview text, hidden in the body itself -->
<div style="display:none; max-height:0; overflow:hidden; opacity:0;"></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#efedea;">
<tr>
<td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px; width:100%; background-color:#ffffff;
                font-family:Arial, Helvetica, sans-serif;">
    <!-- Header band: logo left, tagline right -->
    <tr>
        <td style="padding:22px 32px; border-bottom:1px solid #e8e4e0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
            <td align="left" valign="middle">$logo</td>
            <td align="right" valign="middle"
                style="font-size:19px; color:#9a9289; white-space:nowrap;">
            </td>
            </tr>
        </table>
        </td>
    </tr>
    <!-- Accent rule -->
    <tr>
        <td style="background-color:#af8564; height:3px; line-height:3px; font-size:0;">&nbsp;</td>
    </tr>
    <!-- Body -->
    <tr>
        <td style="padding:32px 32px 8px 32px; font-size:15px; line-height:1.65; color:#3a3a3a;">
        <p style="margin:0 0 22px 0; font-size:18px; color:#1f1f1f;">Hi $name,</p>
        <p style="margin:0 0 16px 0;">
            Thank you for reaching out about $productName. We've received your message and it's been passed to the right team for review.
        </p>
        <p style="margin:0 0 16px 0;">
            Someone will follow up with you within one business day. If your request is urgent, you can reply directly to this email and we'll prioritize it.
        </p>
        <p style="margin:0 0 30px 0;">Thank you for your interest in SAWO. </p>
        <p style="margin:0 0 20px 0;">Warm regards,</p>
        <p style="margin:0 0 2px 0; font-weight:bold; font-size:16px; color:#1f1f1f;">
           Customer Service Team
        </p>
        <p style="margin:0; font-size:14px; color:#8a8279;">SAWO Inc.</p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:28px 32px 30px 32px;">
        <div style="border-top:1px solid #eeeae6; padding-top:16px;
                    font-size:12px; line-height:1.6; color:#9a9289;">
            This is an automated confirmation from SAWO Sauna Support.<br>
            Replies to this email reach our support team directly.
        </div>
        </td>
    </tr>
    </table>
</td>
</tr>
</table>

</body>
</html>
HTML;
    }
}
