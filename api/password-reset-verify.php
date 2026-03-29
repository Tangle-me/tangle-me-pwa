<?php
/**
 * TANGLE-ME API - Password Reset Verify - CORRECTED
 * v4.0.2 - Uses 'password' column (not 'password_hash')
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$email = $data['email'] ?? null;
$resetCode = $data['resetCode'] ?? null;
$newPassword = $data['newPassword'] ?? null;

if (!$email || !$resetCode || !$newPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email, reset code, and new password required']);
    exit();
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT id, username, email FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Invalid email']);
        exit();
    }
    
    $stmt = $pdo->prepare('
        SELECT id, expires_at, used 
        FROM password_resets 
        WHERE user_id = ? 
        AND reset_code = ? 
        AND used = 0 
        ORDER BY created_at DESC 
        LIMIT 1
    ');
    $stmt->execute([$user['id'], $resetCode]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired reset code']);
        exit();
    }
    
    if (strtotime($reset['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Reset code has expired. Please request a new one.']);
        exit();
    }
    
    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
    
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([$passwordHash, $user['id']]);
    
    $stmt = $pdo->prepare('UPDATE password_resets SET used = 1 WHERE id = ?');
    $stmt->execute([$reset['id']]);
    
    error_log("Password reset successful for: " . $user['email']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Password updated successfully',
        'username' => $user['username']
    ]);
    
} catch (PDOException $e) {
    error_log("Password reset verify error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
