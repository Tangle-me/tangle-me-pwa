<?php
/**
 * GET MESSAGE COUNT API - Build 009
 * Returns unread message count for a user
 * 
 * GET /api/get-message-count.php?user_id=X
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET');

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit;
}

try {
    // Database connection
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
        "u143213086_tangleme",
        "fake.name.forever@3eLNma",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Count unread messages for this user
    $stmt = $pdo->prepare("SELECT COUNT(*) as unread FROM messages WHERE receiver_id = ? AND is_read = 0");
    $stmt->execute([$user_id]);
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'unread_count' => intval($result['unread'])
    ]);
    
} catch (PDOException $e) {
    error_log("Get message count error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
