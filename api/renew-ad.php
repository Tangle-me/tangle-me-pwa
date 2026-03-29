<?php
/**
 * TANGLE-ME API — Renew Ad
 * Build 016
 * 
 * POST /api/renew-ad.php
 * Body: { "ad_id": 42, "user_id": 123 }
 * 
 * Renews an expired (or about-to-expire) ad for another cycle.
 * Free users: +30 days, Basic: +60 days, Pro: +90 days
 * Max 3 renewals per ad (then they must repost)
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

$input = json_decode(file_get_contents('php://input'), true);
$adId = isset($input['ad_id']) ? intval($input['ad_id']) : 0;
$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;

if ($adId <= 0 || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ad_id and user_id required']);
    exit();
}

try {
    // Get the ad and verify ownership
    $stmt = $pdo->prepare('
        SELECT a.id, a.user_id, a.expired, a.renewed_count, a.expires_at,
               COALESCE(u.subscription_tier, "free") AS tier
        FROM ads a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
    ');
    $stmt->execute([$adId]);
    $ad = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ad) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Ad not found']);
        exit();
    }

    if ($ad['user_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You can only renew your own ads']);
        exit();
    }

    if ($ad['renewed_count'] >= 3) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'This ad has reached the maximum 3 renewals. Please create a new ad.'
        ]);
        exit();
    }

    // Calculate new expiry based on tier
    $days = 30; // free
    if ($ad['tier'] === 'basic') $days = 60;
    if ($ad['tier'] === 'pro') $days = 90;

    $newExpiry = date('Y-m-d H:i:s', strtotime("+{$days} days"));

    $stmt = $pdo->prepare('
        UPDATE ads 
        SET expired = 0, 
            expires_at = ?, 
            renewed_count = renewed_count + 1
        WHERE id = ?
    ');
    $stmt->execute([$newExpiry, $adId]);

    echo json_encode([
        'success' => true,
        'message' => "Ad renewed for {$days} days",
        'new_expires_at' => $newExpiry,
        'renewals_remaining' => 3 - ($ad['renewed_count'] + 1)
    ]);

} catch (PDOException $e) {
    error_log("Renew ad error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>
