<?php
/**
 * Tangle-me - Save Push Subscription
 * Build 015
 * 
 * POST /api/save-push-subscription.php
 * Body: { user_id, subscription: { endpoint, keys: { p256dh, auth } } }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true);

$userId = isset($input['user_id']) ? intval($input['user_id']) : null;
$subscription = $input['subscription'] ?? null;

if (!$userId || !$subscription || !isset($subscription['endpoint'])) {
    die(json_encode(['success' => false, 'error' => 'User ID and subscription required']));
}

$endpoint = $subscription['endpoint'];
$p256dh = $subscription['keys']['p256dh'] ?? '';
$auth = $subscription['keys']['auth'] ?? '';

if (!$endpoint || !$p256dh || !$auth) {
    die(json_encode(['success' => false, 'error' => 'Invalid subscription data']));
}

try {
    $pdo = getDbConnection();
    
    // Upsert: update if endpoint exists, insert if new
    $stmt = $pdo->prepare("
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
            user_id = VALUES(user_id),
            p256dh = VALUES(p256dh),
            auth = VALUES(auth),
            created_at = NOW()
    ");
    
    $stmt->execute([$userId, $endpoint, $p256dh, $auth]);
    
    echo json_encode(['success' => true, 'message' => 'Subscription saved']);
    
} catch (PDOException $e) {
    error_log('[PUSH-SAVE] Error: ' . $e->getMessage());
    die(json_encode(['success' => false, 'error' => 'Database error']));
}
