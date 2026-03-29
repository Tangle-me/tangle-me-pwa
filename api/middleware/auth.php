<?php
/**
 * Tangle-me: Unified Authentication Middleware
 * Include this at the top of every protected endpoint:
 *   require_once __DIR__ . '/middleware/auth.php';
 * 
 * For endpoints that REQUIRE login:
 *   requireAuth();
 * 
 * For endpoints that OPTIONALLY use session (e.g., search):
 *   $userId = getAuthUserId(); // returns null if not logged in
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CSRF protection
require_once __DIR__ . '/csrf.php';
// Include rate limiter
require_once __DIR__ . '/rate-limiter.php';

/**
 * Standard JSON response helper
 */
function jsonResponse($success, $data = null, $error = null, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'data'    => $data,
        'error'   => $error
    ]);
    exit;
}

/**
 * Get the authenticated user's ID from session, or null
 */
function getAuthUserId() {
    return $_SESSION['user_id'] ?? null;
}

/**
 * Get the authenticated user's username from session, or null
 */
function getAuthUsername() {
    return $_SESSION['username'] ?? null;
}

/**
 * Require authentication — halts with 401 if not logged in
 */
function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(false, null, 'Authentication required', 401);
    }
}

/**
 * Require POST method — halts with 405 if not POST
 */
function requirePost() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(false, null, 'Method not allowed', 405);
    }
}

/**
 * Require CSRF token validation on POST requests
 * Call this for any form submission or state-changing request
 */
function requireCsrf() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!validateCsrfToken($token)) {
            jsonResponse(false, null, 'Invalid CSRF token', 403);
        }
    }
}

/**
 * Sanitize string input — trim, strip tags, limit length
 */
function sanitizeString($input, $maxLength = 500) {
    if (!is_string($input)) return '';
    $input = trim($input);
    $input = strip_tags($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    if (mb_strlen($input) > $maxLength) {
        $input = mb_substr($input, 0, $maxLength);
    }
    return $input;
}

/**
 * Validate email format
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate numeric input within range
 */
function validateNumeric($value, $min = null, $max = null) {
    if (!is_numeric($value)) return false;
    $num = floatval($value);
    if ($min !== null && $num < $min) return false;
    if ($max !== null && $num > $max) return false;
    return true;
}

/**
 * Get client IP (handles Cloudflare proxy)
 */
function getClientIp() {
    // Cloudflare passes real IP in CF-Connecting-IP
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Take the first IP in the chain
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Log API request to database (call after $pdo is available)
 * Table must exist — see schema-changelog.sql
 */
function logApiRequest($pdo, $endpoint, $action = '', $responseCode = 200) {
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO api_log (ip, endpoint, user_id, username, action, response_code, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->execute([
            getClientIp(),
            $endpoint,
            getAuthUserId(),
            getAuthUsername(),
            $action,
            $responseCode
        ]);
    } catch (PDOException $e) {
        // Logging should never break the main request
        error_log("API log failed: " . $e->getMessage());
    }
}
