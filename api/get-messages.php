<?php
/**
 * GET MESSAGES API - Build 008
 * Retrieves inbox or sent messages for logged-in user
 * 
 * GET /api/get-messages.php?type=inbox&user_id=X
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET');

// Start session
session_start();

// Get user ID from session or query parameter
$userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;

// Build 008: Also accept user_id from query string
if ($userId === 0 && isset($_GET['user_id'])) {
    $userId = intval($_GET['user_id']);
}

if ($userId <= 0) {
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit;
}

$type = isset($_GET['type']) ? $_GET['type'] : 'inbox';

if (!in_array($type, ['inbox', 'sent'])) {
    $type = 'inbox';
}

try {
    // Use same credentials as send-message.php
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
        "u143213086_tangleme",
        "fake.name.forever@3eLNma",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Check if messages table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'messages'")->fetch();
    if (!$tableCheck) {
        echo json_encode([
            'success' => true,
            'data' => [],
            'count' => 0,
            'type' => $type
        ]);
        exit;
    }
    
    if ($type === 'inbox') {
        // Get messages received by this user - JOIN with users to get sender username
        $stmt = $pdo->prepare("
            SELECT 
                m.id,
                m.sender_id,
                m.receiver_id,
                m.ad_id,
                m.ad_keywords,
                m.message,
                m.is_read,
                m.created_at,
                COALESCE(u.username, m.sender_username, 'Unknown') as sender_username
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = ? AND m.deleted_by_receiver = 0
            ORDER BY m.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$userId]);
    } else {
        // Get messages sent by this user - JOIN with users to get receiver username
        $stmt = $pdo->prepare("
            SELECT 
                m.id,
                m.sender_id,
                m.receiver_id,
                m.ad_id,
                m.ad_keywords,
                m.message,
                m.is_read,
                m.created_at,
                COALESCE(u.username, m.receiver_username, 'Unknown') as receiver_username
            FROM messages m
            LEFT JOIN users u ON m.receiver_id = u.id
            WHERE m.sender_id = ? AND m.deleted_by_sender = 0
            ORDER BY m.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$userId]);
    }
    
    $messages = $stmt->fetchAll();
    
    // Count unread for inbox
    $unreadCount = 0;
    if ($type === 'inbox') {
        $stmtUnread = $pdo->prepare("SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0 AND deleted_by_receiver = 0");
        $stmtUnread->execute([$userId]);
        $unreadCount = $stmtUnread->fetchColumn();
    }
    
    echo json_encode([
        'success' => true,
        'data' => $messages,
        'count' => count($messages),
        'unread_count' => intval($unreadCount),
        'type' => $type
    ]);
    
} catch (PDOException $e) {
    error_log("Get messages error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
