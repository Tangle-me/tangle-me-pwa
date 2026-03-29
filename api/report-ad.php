<?php
/**
 * TANGLE-ME API — Report Ad
 * Build 016
 * 
 * POST /api/report-ad.php
 * Body: { "ad_id": 42, "user_id": 123, "reason": "spam", "details": "Optional text" }
 * 
 * Reasons: spam, scam, offensive, prohibited, wrong_category, other
 * 
 * Auto-hides ad after 3 unique reports (pending admin review).
 * One report per user per ad.
 */

// CORS
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Database connection
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Rate limit: 10 reports per hour per IP
session_start();
$rateLimitKey = 'report_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$now = time();

if (!isset($_SESSION[$rateLimitKey])) {
    $_SESSION[$rateLimitKey] = ['count' => 0, 'window_start' => $now];
}
if ($now - $_SESSION[$rateLimitKey]['window_start'] > 3600) {
    $_SESSION[$rateLimitKey] = ['count' => 0, 'window_start' => $now];
}
if ($_SESSION[$rateLimitKey]['count'] >= 10) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many reports. Please try again later.']);
    exit();
}

// Parse input
$input = json_decode(file_get_contents('php://input'), true);
$adId = isset($input['ad_id']) ? intval($input['ad_id']) : 0;
$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
$reason = isset($input['reason']) ? trim($input['reason']) : '';
$details = isset($input['details']) ? trim(substr($input['details'], 0, 500)) : null;

// Validate
$validReasons = ['spam', 'scam', 'offensive', 'prohibited', 'wrong_category', 'other'];

if ($adId <= 0 || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ad_id and user_id required']);
    exit();
}

if (!in_array($reason, $validReasons)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid reason. Choose: ' . implode(', ', $validReasons)]);
    exit();
}

try {
    // Verify the ad exists
    $stmt = $pdo->prepare('SELECT id, user_id FROM ads WHERE id = ?');
    $stmt->execute([$adId]);
    $ad = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ad) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Ad not found']);
        exit();
    }

    // Can't report your own ad
    if ($ad['user_id'] == $userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'You cannot report your own ad']);
        exit();
    }

    // Check if already reported by this user
    $stmt = $pdo->prepare('SELECT id FROM reported_ads WHERE ad_id = ? AND reporter_user_id = ?');
    $stmt->execute([$adId, $userId]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'You have already reported this ad']);
        exit();
    }

    // Insert the report
    $stmt = $pdo->prepare('
        INSERT INTO reported_ads (ad_id, reporter_user_id, reason, details, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ');
    $stmt->execute([$adId, $userId, $reason, $details]);

    // Update report count on the ad
    $stmt = $pdo->prepare('UPDATE ads SET report_count = report_count + 1 WHERE id = ?');
    $stmt->execute([$adId]);

    // Auto-hide if 3+ reports
    $stmt = $pdo->prepare('SELECT report_count FROM ads WHERE id = ?');
    $stmt->execute([$adId]);
    $currentCount = $stmt->fetchColumn();

    $autoHidden = false;
    if ($currentCount >= 3) {
        $stmt = $pdo->prepare('UPDATE ads SET hidden_by_reports = 1 WHERE id = ?');
        $stmt->execute([$adId]);
        $autoHidden = true;
        error_log("Ad #{$adId} auto-hidden: {$currentCount} reports (latest reason: {$reason})");
    }

    $_SESSION[$rateLimitKey]['count']++;

    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your report. We will review this ad.',
        'auto_hidden' => $autoHidden
    ]);

} catch (PDOException $e) {
    // Duplicate report (race condition catch)
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'You have already reported this ad']);
    } else {
        error_log("Report ad error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server error']);
    }
}
?>
