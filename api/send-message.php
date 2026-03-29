<?php
/**
 * SEND MESSAGE - Build 018 Update
 * Now stores sender's GPS coordinates with each message
 * 
 * REQUIRES: ALTER TABLE messages ADD COLUMN sender_lat DECIMAL(10,7) DEFAULT NULL;
 *           ALTER TABLE messages ADD COLUMN sender_lng DECIMAL(10,7) DEFAULT NULL;
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST method required']);
    exit;
}

require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $adId = intval($input['ad_id'] ?? 0);
    $adKeywords = trim($input['ad_keywords'] ?? '');
    $senderId = intval($input['sender_id'] ?? 0);
    $recipientId = intval($input['recipient_id'] ?? 0);
    $message = trim($input['message'] ?? '');
    $senderLat = isset($input['sender_lat']) ? floatval($input['sender_lat']) : null;
    $senderLng = isset($input['sender_lng']) ? floatval($input['sender_lng']) : null;
    
    // Validation
    if (!$senderId) {
        echo json_encode(['success' => false, 'error' => 'Login required']);
        exit;
    }
    
    if (!$message) {
        echo json_encode(['success' => false, 'error' => 'Message cannot be empty']);
        exit;
    }
    
    if (strlen($message) > 2000) {
        echo json_encode(['success' => false, 'error' => 'Message too long (max 2000 characters)']);
        exit;
    }
    
    // If no recipient_id provided, look up ad owner
    if (!$recipientId && $adId) {
        $stmt = $pdo->prepare("SELECT user_id FROM ads WHERE id = ?");
        $stmt->execute([$adId]);
        $ad = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($ad) {
            $recipientId = intval($ad['user_id']);
        }
    }
    
    if (!$recipientId) {
        echo json_encode(['success' => false, 'error' => 'Recipient not found']);
        exit;
    }
    
    // Prevent messaging yourself
    if ($senderId === $recipientId) {
        echo json_encode(['success' => false, 'error' => 'Cannot message yourself']);
        exit;
    }
    
    // Rate limiting - max 20 messages per 10 minutes per sender
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM messages 
                           WHERE sender_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)");
    $stmt->execute([$senderId]);
    $rateCheck = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($rateCheck['cnt'] >= 20) {
        echo json_encode(['success' => false, 'error' => 'Too many messages. Please wait a few minutes.']);
        exit;
    }
    
    // Check if sender_lat/sender_lng columns exist (safe migration handling)
    $hasGeoColumns = false;
    try {
        $colCheck = $pdo->query("SHOW COLUMNS FROM messages LIKE 'sender_lat'");
        $hasGeoColumns = ($colCheck->rowCount() > 0);
    } catch (Exception $e) {
        $hasGeoColumns = false;
    }
    
    // Insert message
    if ($hasGeoColumns) {
        $stmt = $pdo->prepare("INSERT INTO messages (ad_id, ad_keywords, sender_id, receiver_id, message, sender_lat, sender_lng, created_at) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$adId, $adKeywords, $senderId, $recipientId, $message, $senderLat, $senderLng]);
    } else {
        // Fallback if columns don't exist yet
        $stmt = $pdo->prepare("INSERT INTO messages (ad_id, ad_keywords, sender_id, receiver_id, message, created_at) 
                               VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$adId, $adKeywords, $senderId, $recipientId, $message]);
    }
    
    $messageId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message_id' => $messageId,
        'geo_tagged' => $hasGeoColumns && ($senderLat !== null)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send message: ' . $e->getMessage()]);
}
