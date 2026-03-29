<?php
/**
 * Tangle-me: Rate Limiter
 * Prevents brute-force attacks on auth endpoints.
 * 
 * Usage:
 *   require_once __DIR__ . '/rate-limiter.php';
 *   checkRateLimit($pdo, 'login', 5, 900);  // 5 attempts per 15 min
 * 
 * Requires rate_limits table — see schema-changelog.sql
 */

/**
 * Check if the current IP has exceeded the rate limit for a given action.
 * Halts with 429 if limit exceeded.
 * 
 * @param PDO    $pdo         Database connection
 * @param string $action      The action being rate-limited (e.g., 'login', 'register', 'reset')
 * @param int    $maxAttempts Maximum attempts allowed in the window
 * @param int    $windowSecs  Time window in seconds (default 900 = 15 minutes)
 */
function checkRateLimit($pdo, $action, $maxAttempts = 5, $windowSecs = 900) {
    $ip = getClientIp();
    
    // Clean up old entries (older than 1 hour) periodically — 1% chance per request
    if (mt_rand(1, 100) === 1) {
        try {
            $cleanup = $pdo->prepare("DELETE FROM rate_limits WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
            $cleanup->execute();
        } catch (PDOException $e) {
            error_log("Rate limit cleanup failed: " . $e->getMessage());
        }
    }
    
    // Count recent attempts
    try {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) as attempt_count 
             FROM rate_limits 
             WHERE ip = ? AND action = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL ? SECOND)"
        );
        $stmt->execute([$ip, $action, $windowSecs]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result && $result['attempt_count'] >= $maxAttempts) {
            $minutesLeft = ceil($windowSecs / 60);
            http_response_code(429);
            header('Content-Type: application/json');
            header("Retry-After: $windowSecs");
            echo json_encode([
                'success' => false,
                'data'    => null,
                'error'   => "Too many attempts. Please try again in $minutesLeft minutes."
            ]);
            exit;
        }
    } catch (PDOException $e) {
        // If rate limiting fails, log it but don't block the request
        error_log("Rate limit check failed: " . $e->getMessage());
        return;
    }
}

/**
 * Record a rate-limited attempt (call AFTER validation, whether pass or fail)
 * 
 * @param PDO    $pdo    Database connection
 * @param string $action The action being recorded
 */
function recordRateLimitAttempt($pdo, $action) {
    $ip = getClientIp();
    
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO rate_limits (ip, action, attempted_at) VALUES (?, ?, NOW())"
        );
        $stmt->execute([$ip, $action]);
    } catch (PDOException $e) {
        error_log("Rate limit record failed: " . $e->getMessage());
    }
}

/**
 * getClientIp helper if not already defined (via auth.php)
 */
if (!function_exists('getClientIp')) {
    function getClientIp() {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
