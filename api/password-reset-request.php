<?php
/**
 * TANGLE-ME API - Password Reset Request
 * v4.0.1 - January 18, 2026
 * 
 * Step 1: User enters email, receives reset code
 * Note: For production, send code via email (requires SMTP setup)
 * For now: Returns code in response for testing
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
$pdo = getDBConnection();

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$email = $data['email'] ?? null;

// Validate input
if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email required']);
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email format']);
    exit();
}

try {
    // Check if user exists (active or inactive)
    $stmt = $pdo->prepare('
        SELECT id, username, email 
        FROM users 
        WHERE email = ?
    ');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Don't reveal if email exists - just say "sent"
        echo json_encode([
            'success' => true,
            'message' => 'If this email is registered, a reset code has been sent.'
        ]);
        exit();
    }
    
    // Generate 6-digit reset code
    $resetCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Store reset code in database (expires in 15 minutes)
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
    
    // Check if reset code table exists, if not create it
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            reset_code VARCHAR(6) NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            used TINYINT(1) DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_code (user_id, reset_code),
            INDEX idx_expires (expires_at)
        )
    ');
    
    // Insert reset code
    $stmt = $pdo->prepare('
        INSERT INTO password_resets (user_id, reset_code, created_at, expires_at) 
        VALUES (?, ?, NOW(), ?)
    ');
    $stmt->execute([$user['id'], $resetCode, $expiresAt]);
    
    // TODO: Send email with reset code
    // For now, return code in response (ONLY FOR TESTING!)
    // In production, send via email and remove from response
    
    error_log("Password reset requested for: " . $user['email'] . " - Code: $resetCode");
    
    echo json_encode([
        'success' => true,
        'message' => 'Reset code sent to your email',
        'debug_code' => $resetCode,  // REMOVE THIS IN PRODUCTION!
        'username' => $user['username']  // Show user their Tangle ID
    ]);
    
} catch (PDOException $e) {
    error_log("Password reset request error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
