<?php
/**
 * TANGLE-ME API - Account Deactivation
 * v4.0 - January 18, 2026
 * 
 * Deactivates user account (marks as inactive, doesn't delete)
 * Account can be reactivated by logging in with same email/password
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

$userId = $data['userId'] ?? null;
$email = $data['email'] ?? null;

// Validate input
if (!$userId || !$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'User ID and email required']);
    exit();
}

try {
    // Check if user exists and is active
    $stmt = $pdo->prepare('
        SELECT id, username, active 
        FROM users 
        WHERE id = ? AND email = ?
    ');
    $stmt->execute([$userId, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit();
    }
    
    if ($user['active'] == 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Account already inactive']);
        exit();
    }
    
    // Deactivate account (mark as inactive)
    $stmt = $pdo->prepare('
        UPDATE users 
        SET active = 0, deleted_at = NOW() 
        WHERE id = ?
    ');
    $stmt->execute([$userId]);
    
    // Log deactivation
    error_log("Account deactivated: " . $user['username'] . " ($email) - ID: $userId");
    
    echo json_encode([
        'success' => true,
        'message' => 'Account deactivated successfully',
        'username' => $user['username'],
        'reactivation_info' => 'Login with your email and password to reactivate'
    ]);
    
} catch (PDOException $e) {
    error_log("Deactivation error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
