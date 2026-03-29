<?php
// mark-message-read.php - Tangle-me v4.3.2 FIXED
// Mark a message as read

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$host = 'localhost';
$dbname = 'u143213086_tangleme';
$username = 'u143213086_tangleme';
$password = 'fake.name.forever@3eLNma';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    error_log("MARK-MESSAGE-READ DB error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Get user_id and message_id from request
$user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
$message_id = isset($input['message_id']) ? intval($input['message_id']) : null;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit;
}

if (!$message_id) {
    echo json_encode(['success' => false, 'error' => 'Missing message_id']);
    exit;
}

try {
    // Mark as read (only if you're the receiver)
    $stmt = $pdo->prepare("
        UPDATE messages 
        SET is_read = 1, read_at = NOW()
        WHERE id = ? AND receiver_id = ? AND is_read = 0
    ");
    $stmt->execute([$message_id, $user_id]);

    if ($stmt->rowCount() > 0) {
        // Get updated unread count
        $stmt2 = $pdo->prepare("SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0");
        $stmt2->execute([$user_id]);
        $unread_count = $stmt2->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Message marked as read',
            'unread_count' => intval($unread_count)
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Message not found or already read'
        ]);
    }

} catch(PDOException $e) {
    error_log("MARK-MESSAGE-READ query error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Failed to mark message as read']);
}
?>
