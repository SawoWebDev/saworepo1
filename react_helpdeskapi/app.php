<?php
// Odoo JSON-RPC client. Copied from helpdeskapi/app.php verbatim — this is
// the working implementation, credentials now come from config.php's
// .env-backed constants instead of that file's own hardcoded define()s.
require_once __DIR__ . '/config.php';

class app {
    private $url;
    private $db;
    private $username;
    private $apiKey;
    private $sessionId = null;
    private $uid = null;
    private $isConnected = false;
    private $lastError = null;

    public function __construct() {
        // Load configuration from config.php
        $this->url = ODOO_URL;
        $this->username = ODOO_USERNAME;
        $this->password = ODOO_PASSWORD;
        $this->apiKey = ODOO_API_KEY;
        $this->db = $this->getDatabases();
    }

    public function getDatabases() {
        $dbUrl = $this->url . '/web/database/list';

        $data = json_encode([
            'jsonrpc' => '2.0',
            'method' => 'call',
            'params' => [],
            'id' => rand()
        ]);

        $ch = curl_init($dbUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL Error: " . $error);
        }
        curl_close($ch);

        $result = json_decode($response, true);
        return $result['result'][0] ?? [];
    }

    public function connect() {
        $authUrl = $this->url . '/web/session/authenticate';

        $data = json_encode([
            'jsonrpc' => '2.0',
            'params' => [
                'db' => $this->db,
                'login' => $this->username,
                'password' => $this->password
            ]
        ]);

        $ch = curl_init($authUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($data)
        ]);
        curl_setopt($ch, CURLOPT_HEADER, true);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL Error: " . $error);
        }

        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $header = substr($response, 0, $header_size);
        $body = substr($response, $header_size);

        curl_close($ch);

        // Extract session cookie
        preg_match('/Set-Cookie: session_id=([^;]+)/', $header, $matches);
        $this->sessionId = $matches[1] ?? null;

        // Parse response
        $result = json_decode($body, true);

        if (isset($result['result']['uid'])) {
            $this->uid = $result['result']['uid'];
            $this->isConnected = true;
            $this->lastError = null;
            return [
                'success' => true,
                'uid' => $this->uid,
                'database' => $this->db,
                'message' => 'Connected successfully to Odoo'
            ];
        } else {
            $this->isConnected = false;
            $this->lastError = $result['error'] ?? 'Authentication failed';
            return [$this->getErrorDetails()];
        }
    }

    public function isConnected() {
        return $this->isConnected;
    }

    public function getErrorDetails() {
        if (!$this->lastError) {
            return null;
        }

        $output = "<div style='background: #f8d7da; padding: 20px; border: 1px solid #f5c6cb; border-radius: 5px;'>";
        $output .= "<h2 style='color: #721c24;'>✗ Connection Failed</h2>";
        $output .= "<p><strong>Message:</strong> Failed to connect to Odoo</p>";

        if (is_array($this->lastError)) {
            $output .= "<h3>Error Details:</h3>";
            $output .= "<p><strong>Code:</strong> " . ($this->lastError['code'] ?? 'N/A') . "</p>";
            $output .= "<p><strong>Message:</strong> " . ($this->lastError['message'] ?? 'N/A') . "</p>";

            if (isset($this->lastError['data'])) {
                $output .= "<p><strong>Error Type:</strong> " . ($this->lastError['data']['name'] ?? 'N/A') . "</p>";
                $output .= "<p><strong>Error Message:</strong> " . ($this->lastError['data']['message'] ?? 'N/A') . "</p>";

                $output .= "<details style='margin-top: 10px;'>";
                $output .= "<summary style='cursor: pointer; font-weight: bold;'>Debug Trace</summary>";
                $output .= "<pre style='background: #f5f5f5; padding: 10px; overflow-x: auto;'>";
                $output .= htmlspecialchars($this->lastError['data']['debug'] ?? 'No debug info');
                $output .= "</pre>";
                $output .= "</details>";
            }
        }

        $output .= "<hr>";
        $output .= "<h3 style='color: #856404;'>⚠ Possible Solutions:</h3>";
        $output .= "<ul>";
        $output .= "<li>Check if your API Key is correct in config.php</li>";
        $output .= "<li>Verify your username: <strong>" . $this->username . "</strong></li>";
        $output .= "<li>Make sure the API key has proper access rights in Odoo</li>";
        $output .= "<li>Check if the database name is correct: <strong>" . $this->db . "</strong></li>";
        $output .= "<li>Try logging in to Odoo web interface with the same credentials</li>";
        $output .= "</ul>";
        $output .= "</div>";

        return $output;
    }

     public function query($model, $method, $params = [], $kwargs = []) {

        if (!$this->isConnected) {
            throw new Exception("Not connected to Odoo. Please call connect() first.");
        }

        $callUrl = $this->url . '/web/dataset/call_kw';

        if (is_array($kwargs) && empty($kwargs)) {
            $kwargs = (object) [];
        }

        $data = json_encode([
            'jsonrpc' => '2.0',
            'method' => 'call',
            'params' => [
                'model' => $model,
                'method' => $method,
                'args' => $params,
                'kwargs' => $kwargs,
            ],
            'id' => rand()
        ]);

        $ch = curl_init($callUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: session_id=' . $this->sessionId
        ]);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL Error: " . $error);
        }
        curl_close($ch);
        return json_decode($response, true);
    }

    public function createTicket ($model, $method, $params = [], $kwargs = []) {
        if (!$this->isConnected) {
            throw new Exception("Not connected to Odoo. Please call connect() first.");
        }

        $callUrl = $this->url . '/web/dataset/call_kw';
        $data = [
            'jsonrpc' => '2.0',
            'method' => 'call',
            'params' => [
                'model' => $model, // helpdesk.ticket
                'method' => $method, // create
                'args' => $params,
                'kwargs' => $kwargs, // Ensure kwargs is passed here
            ],
            'id' => rand()
        ];

        $jsonData = json_encode($data);

        $ch = curl_init($callUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: session_id=' . $this->sessionId
        ]);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL Error: " . $error);
        }
        curl_close($ch);

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            throw new Exception("Odoo Error: " . $result['error']['message']);
        }

        return $result;
    }

     public function createContacts ($model, $method, $params = [], $kwargs = []) {
        if (!$this->isConnected) {
            throw new Exception("Not connected to Odoo. Please call connect() first.");
        }

        $callUrl = $this->url . '/web/dataset/call_kw';
        $data = [
            'jsonrpc' => '2.0',
            'method' => 'call',
            'params' => [
                'model' => $model, // helpdesk.ticket
                'method' => $method, // create
                'args' => $params,
                'kwargs' => $kwargs, // Ensure kwargs is passed here
            ],
            'id' => rand()
        ];

        $jsonData = json_encode($data);

        $ch = curl_init($callUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: session_id=' . $this->sessionId
        ]);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL Error: " . $error);
        }
        curl_close($ch);

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            throw new Exception("Odoo Error: " . $result['error']['message']);
        }

        return $result;
    }

    public function getSessionId() {
        return $this->sessionId;
    }
}
