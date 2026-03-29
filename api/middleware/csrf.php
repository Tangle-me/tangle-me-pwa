<?php
/**
 * Tangle-me: CSRF Token Protection
 * Generates and validates tokens to prevent cross-site request forgery.
 * 
 * Usage in PHP forms:
 *   <input type="hidden" name="csrf_token" value="<?= getCsrfToken() ?>">
 * 
 * Usage in JavaScript fetch calls:
 *   Add header: 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
 * 
 * Add this meta tag to index.html (rendered by PHP or injected):
 *   <meta name="csrf-token" content="<?= getCsrfToken() ?>">
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Generate or retrieve the current session's CSRF token
 */
function getCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    
    // Rotate token every 2 hours
    if (time() - ($_SESSION['csrf_token_time'] ?? 0) > 7200) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Validate a submitted CSRF token
 */
function validateCsrfToken($token) {
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * API endpoint to get a fresh CSRF token (for SPA/JS apps)
 * Call GET /api/middleware/csrf-token.php to get a token
 */
if (basename($_SERVER['SCRIPT_FILENAME']) === 'csrf.php' && 
    isset($_GET['action']) && $_GET['action'] === 'token') {
    header('Content-Type: application/json');
    echo json_encode(['token' => getCsrfToken()]);
    exit;
}
