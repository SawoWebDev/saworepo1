<?php

// ============================================================
// SimpleSMTPMailer — a minimal, dependency-free SMTP client.
// No Composer, no external libraries. Pure PHP sockets.
//
// Talks directly to an authenticated SMTP relay (Brevo, SendGrid,
// Mailgun, etc.) using STARTTLS + AUTH LOGIN, same protocol
// PHPMailer uses under the hood — just stripped to essentials.
//
// Copied from helpdeskapi/smtpmailer.php verbatim (the version with
// multipart/alternative HTML-body support — not the older "copy 1" variant).
// This is the proven implementation already used by SendRespond.php; it is
// not re-implemented here.
// ============================================================

class SimpleSMTPMailer
{
    private $host;
    private $port;
    private $username;
    private $password;
    private $socket;
    private $debug;

    public function __construct($host, $port, $username, $password, $debug = false)
    {
        $this->host     = $host;
        $this->port     = $port;
        $this->username = $username;
        $this->password = $password;
        $this->debug    = $debug;
    }

    private function log($msg)
    {
        if ($this->debug) {
            echo htmlspecialchars($msg) . "\n";
        }
    }

    private function readResponse()
    {
        $data = '';
        while ($line = fgets($this->socket, 515)) {
            $data .= $line;
            // Multi-line responses have a "-" after the code (e.g. "250-");
            // the final line has a space (e.g. "250 ").
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        $this->log("S: $data");
        return $data;
    }

    private function sendCommand($command, $expectedCode)
    {
        $this->log("C: $command");
        fwrite($this->socket, $command . "\r\n");
        $response = $this->readResponse();
        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new Exception("SMTP error: expected $expectedCode, got: $response");
        }
        return $response;
    }

    public function send($fromEmail, $fromName, $toEmail, $subject, $body, $replyTo = null, $htmlBody = null)
    {
        // 1. Connect
        $this->socket = @fsockopen($this->host, $this->port, $errno, $errstr, 15);
        if (!$this->socket) {
            throw new Exception("Connection failed: $errstr ($errno)");
        }
        $this->readResponse(); // 220 greeting

        // 2. EHLO
        $this->sendCommand("EHLO " . gethostname(), 250);

        // 3. STARTTLS (required by virtually all relays on port 587)
        $this->sendCommand("STARTTLS", 220);
        if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("Failed to enable TLS encryption");
        }

        // 4. EHLO again (required after STARTTLS)
        $this->sendCommand("EHLO " . gethostname(), 250);

        // 5. Authenticate
        $this->sendCommand("AUTH LOGIN", 334);
        $this->sendCommand(base64_encode($this->username), 334);
        $this->sendCommand(base64_encode($this->password), 235);

        // 6. MAIL FROM / RCPT TO
        $this->sendCommand("MAIL FROM:<$fromEmail>", 250);
        $this->sendCommand("RCPT TO:<$toEmail>", 250);

        // 7. DATA
        $this->sendCommand("DATA", 354);

        $headers  = "From: $fromName <$fromEmail>\r\n";
        $headers .= "To: <$toEmail>\r\n";
        if ($replyTo) {
            $headers .= "Reply-To: <$replyTo>\r\n";
        }
        $headers .= "Subject: $subject\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Date: " . date('r') . "\r\n";

        if ($htmlBody !== null) {
            $boundary = 'alt_' . bin2hex(random_bytes(16));
            $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";

            $content = "--$boundary\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($body))
                . "--$boundary\r\n"
                . "Content-Type: text/html; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($htmlBody))
                . "--$boundary--";
        } else {
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            // Dot-stuffing per RFC 5321: a line starting with "." must have
            // an extra "." prepended, or the SMTP server treats it as end-of-data.
            $content = preg_replace('/^\./m', '..', $body);
        }

        $message = $headers . "\r\n" . $content . "\r\n.";
        $this->log("C: [message body, " . strlen($message) . " bytes]");
        fwrite($this->socket, $message . "\r\n");
        $response = $this->readResponse();
        $code = (int) substr($response, 0, 3);
        if ($code !== 250) {
            throw new Exception("Send failed: $response");
        }

        // 8. QUIT
        fwrite($this->socket, "QUIT\r\n");
        fclose($this->socket);

        return true;
    }
}
