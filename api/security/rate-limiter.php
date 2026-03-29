<?php
/**
 * Tangle-me Rate Limiter
 * File-based rate limiting for Hostinger (no Redis needed)
 * 
 * Place in: /api/security/rate-limiter.php
 */

class RateLimiter {
    private $cacheDir;
    
    public function __construct() {
        $this->cacheDir = __DIR__ . '/../../cache/ratelimit/';
        
        // Create directory if not exists
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
            // Protect cache directory from web access
            file_put_contents($this->cacheDir . '.htaccess', 'Deny from all');
        }
    }
    
    /**
     * Get client IP address
     */
    public function getClientIP() {
        // Check for forwarded IP (if behind proxy/load balancer)
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            return $_SERVER['HTTP_X_REAL_IP'];
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Check if request is allowed
     * 
     * @param string $endpoint - Endpoint name (e.g., 'login', 'register')
     * @param int $maxAttempts - Maximum attempts allowed
     * @param int $windowSeconds - Time window in seconds
     * @return array - Result with 'allowed' boolean
     */
    public function check($endpoint, $maxAttempts = 5, $windowSeconds = 300) {
        $ip = $this->getClientIP();
        $key = md5($ip . '_' . $endpoint);
        $file = $this->cacheDir . $key . '.json';
        
        $now = time();
        $data = [
            'attempts' => [],
            'blocked_until' => 0
        ];
        
        // Load existing data
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $data = json_decode($content, true) ?: $data;
        }
        
        // Check if currently blocked
        if (isset($data['blocked_until']) && $data['blocked_until'] > $now) {
            $waitTime = $data['blocked_until'] - $now;
            return [
                'allowed' => false,
                'wait_seconds' => $waitTime,
                'message' => "Too many attempts. Please wait " . ceil($waitTime / 60) . " minute(s)."
            ];
        }
        
        // Remove old attempts outside window
        $data['attempts'] = array_values(array_filter(
            $data['attempts'] ?? [],
            fn($t) => $t > ($now - $windowSeconds)
        ));
        
        // Check if over limit
        if (count($data['attempts']) >= $maxAttempts) {
            // Progressive blocking: 1min, 5min, 15min, 1hr max
            $violations = floor(count($data['attempts']) / $maxAttempts);
            $blockTime = min(3600, 60 * pow(3, $violations));
            $data['blocked_until'] = $now + $blockTime;
            file_put_contents($file, json_encode($data), LOCK_EX);
            
            return [
                'allowed' => false,
                'wait_seconds' => $blockTime,
                'message' => "Too many attempts. Please wait " . ceil($blockTime / 60) . " minute(s)."
            ];
        }
        
        // Log this attempt
        $data['attempts'][] = $now;
        file_put_contents($file, json_encode($data), LOCK_EX);
        
        return [
            'allowed' => true,
            'remaining' => $maxAttempts - count($data['attempts'])
        ];
    }
    
    /**
     * Clean old cache files (run periodically via cron)
     */
    public function cleanup($maxAgeSeconds = 86400) {
        if (!is_dir($this->cacheDir)) return;
        
        $files = glob($this->cacheDir . '*.json');
        $now = time();
        $cleaned = 0;
        
        foreach ($files as $file) {
            if (filemtime($file) < ($now - $maxAgeSeconds)) {
                unlink($file);
                $cleaned++;
            }
        }
        
        return $cleaned;
    }
}

/**
 * Quick helper function - blocks request if rate limited
 * 
 * Usage: rateLimit('login', 5, 300);
 * 
 * @param string $endpoint - Endpoint name
 * @param int $max - Max attempts (default 5)
 * @param int $window - Window in seconds (default 300 = 5 min)
 */
function rateLimit($endpoint, $max = 5, $window = 300) {
    $limiter = new RateLimiter();
    $result = $limiter->check($endpoint, $max, $window);
    
    if (!$result['allowed']) {
        http_response_code(429); // Too Many Requests
        header('Content-Type: application/json');
        header('Retry-After: ' . $result['wait_seconds']);
        echo json_encode([
            'success' => false,
            'error' => $result['message'],
            'retry_after' => $result['wait_seconds']
        ]);
        exit;
    }
    
    return $result;
}
