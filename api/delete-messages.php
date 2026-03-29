<?php
/**
 * TANGLE-ME API — Delete Messages
 * Build 017
 * 
 * POST /api/delete-messages.php
 * Body: { "user_id": 123, "message_ids": [1, 2, 3], "type": "inbox" }
 * 
 * Soft-deletes messages for the requesting user only.
 * The other party can still see their copy.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Rate limiting (optional)
if (file_exists('security/rate-limiter.php')) {
    require_once 'security/rate-limiter.php';
    rateLimit('delete-messages', 30, 600); // 30 deletes per 10 minutes
}

// Parse input
$input = json_decode(file_get_contents('php://input'), true);
$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
$messageIds = isset($input['message_ids']) ? $input['message_ids'] : [];
$type = isset($input['type']) ? trim($input['type']) : '';

// Validate
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit();
}

if (empty($messageIds) || !is_array($messageIds)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No messages selected']);
    exit();
}

if (!in_array($type, ['inbox', 'sent'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid message type']);
    exit();
}

// Sanitize message IDs - only allow integers
$messageIds = array_map('intval', $messageIds);
$messageIds = array_filter($messageIds, function($id) { return $id > 0; });

if (empty($messageIds)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No valid message IDs']);
    exit();
}

// Limit bulk delete to 100 at a time
if (count($messageIds) > 100) {
    $messageIds = array_slice($messageIds, 0, 100);
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Soft delete: set deleted_by_sender or deleted_by_receiver flag
    // This ensures only the deleting user loses access; the other party keeps their copy
    $placeholders = implode(',', array_fill(0, count($messageIds), '?'));

    if ($type === 'inbox') {
        // User is the receiver — mark as deleted by receiver
        $sql = "UPDATE messages SET deleted_by_receiver = 1 
                WHERE id IN ($placeholders) AND receiver_id = ?";
    } else {
        // User is the sender — mark as deleted by sender
        $sql = "UPDATE messages SET deleted_by_sender = 1 
                WHERE id IN ($placeholders) AND sender_id = ?";
    }

    $stmt = $pdo->prepare($sql);
    
    // Bind message IDs + user ID
    $params = $messageIds;
    $params[] = $userId;
    $stmt->execute($params);

    $deletedCount = $stmt->rowCount();

    echo json_encode([
        'success' => true,
        'message' => $deletedCount . ' message(s) deleted',
        'deleted_count' => $deletedCount
    ]);

} catch (PDOException $e) {
    error_log('[DELETE-MESSAGES] Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
