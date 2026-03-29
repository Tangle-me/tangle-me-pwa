<?php
/**
 * DELETE PHOTO API
 * 
 * Deletes a photo and decrements user's photo counter (for BASIC tier)
 * 
 * POST /api/delete-photo.php
 * Body: { "user_id": 123, "filename": "photo_xxx.webp" }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once 'config.php';

define('UPLOAD_DIR', __DIR__ . '/../uploads/photos/');

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['user_id'] ?? null;
$filename = $input['filename'] ?? null;

if (!$userId || !$filename) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID and filename required']);
    exit;
}

// Sanitize filename to prevent directory traversal
$filename = basename($filename);

// Validate filename format
if (!preg_match('/^photo_[a-z0-9.]+\.webp$/i', $filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename format']);
    exit;
}

$fullPath = UPLOAD_DIR . $filename;
$thumbPath = UPLOAD_DIR . 'thumbs/' . $filename;

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user's current photo count
    $stmt = $pdo->prepare("SELECT photos_used, subscription_tier FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Delete files
    $deleted = false;
    if (file_exists($fullPath)) {
        unlink($fullPath);
        $deleted = true;
    }
    if (file_exists($thumbPath)) {
        unlink($thumbPath);
    }
    
    // Decrement photo counter (only if we actually deleted something)
    if ($deleted && $user['photos_used'] > 0) {
        $stmt = $pdo->prepare("UPDATE users SET photos_used = photos_used - 1 WHERE id = ? AND photos_used > 0");
        $stmt->execute([$userId]);
    }
    
    // Get updated count
    $stmt = $pdo->prepare("SELECT photos_used FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'deleted' => $deleted,
        'photos_used' => intval($updatedUser['photos_used']),
        'photos_limit' => ($user['subscription_tier'] === 'basic') ? 20 : 'unlimited'
    ]);
    
} catch (PDOException $e) {
    error_log('Photo delete error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
