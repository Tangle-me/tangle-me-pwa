<?php
/**
 * Tangle-me - Delete Push Subscription
 * Build 015
 * 
 * POST /api/delete-push-subscription.php
 * Body: { endpoint }
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
$endpoint = $input['endpoint'] ?? '';

if (!$endpoint) {
    die(json_encode(['success' => false, 'error' => 'Endpoint required']));
}

try {
    $pdo = getDbConnection();
    
    $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
    $stmt->execute([$endpoint]);
    
    echo json_encode(['success' => true, 'message' => 'Subscription removed']);
    
} catch (PDOException $e) {
    error_log('[PUSH-DELETE] Error: ' . $e->getMessage());
    die(json_encode(['success' => false, 'error' => 'Database error']));
}
