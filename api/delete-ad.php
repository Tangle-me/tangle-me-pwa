<?php
// delete-ad.php - Tangle-me Backend API v4.3.0
// Deletes an ad (marks as deleted, doesn't physically remove)
// Now supports admin deletion

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host = 'localhost';
$dbname = 'u143213086_tangleme';
$username = 'u143213086_tangleme';
$password = 'fake.name.forever@3eLNma';

// Admin emails (can delete any ad)
$adminEmails = [
    'bechev.ventzi@gmail.com'
];

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get data from POST body or query params
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $adId = $data['ad_id'] ?? $_GET['ad_id'] ?? $_POST['ad_id'] ?? null;
    $userId = $data['user_id'] ?? $_GET['user_id'] ?? $_POST['user_id'] ?? $_SESSION['user_id'] ?? null;
    $userEmail = $data['user_email'] ?? $_GET['user_email'] ?? $_POST['user_email'] ?? null;
    $adminKey = $data['admin_key'] ?? $_GET['admin_key'] ?? $_POST['admin_key'] ?? null;
    
    // Debug logging
    error_log("DELETE-AD request: ad_id=$adId, user_id=$userId, email=$userEmail");
    
    if (!$adId) {
        echo json_encode([
            'success' => false,
            'error' => 'Ad ID required'
        ]);
        exit;
    }
    
    // Check if admin deletion (via admin key or admin email)
    $isAdmin = false;
    
    // Method 1: Admin key (for direct API calls)
    if ($adminKey === 'TangleAdmin2026!') {
        $isAdmin = true;
        error_log("DELETE-AD: Admin key authenticated");
    }
    
    // Method 2: Check if user email is in admin list
    if ($userEmail && in_array($userEmail, $adminEmails)) {
        $isAdmin = true;
        error_log("DELETE-AD: Admin email authenticated: $userEmail");
    }
    
    // Method 3: Check user_id belongs to admin
    if ($userId && !$isAdmin) {
        $adminCheck = $pdo->prepare("SELECT email FROM users WHERE id = :user_id");
        $adminCheck->execute([':user_id' => $userId]);
        $userRow = $adminCheck->fetch(PDO::FETCH_ASSOC);
        if ($userRow && in_array($userRow['email'], $adminEmails)) {
            $isAdmin = true;
            error_log("DELETE-AD: Admin user_id authenticated: $userId");
        }
    }
    
    // Get the ad
    $checkStmt = $pdo->prepare("SELECT id, user_id, keywords FROM ads WHERE id = :ad_id");
    $checkStmt->execute([':ad_id' => $adId]);
    $ad = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$ad) {
        echo json_encode([
            'success' => false,
            'error' => 'Ad not found'
        ]);
        exit;
    }
    
    // Admin can delete any ad
    if ($isAdmin) {
        $stmt = $pdo->prepare("UPDATE ads SET status = 'deleted' WHERE id = :ad_id");
        $stmt->execute([':ad_id' => $adId]);
        
        error_log("DELETE-AD: Admin deleted ad $adId ({$ad['keywords']})");
        
        echo json_encode([
            'success' => true,
            'message' => 'Ad deleted by admin',
            'ad_id' => $adId
        ]);
        exit;
    }
    
    // Regular user - must own the ad
    if (!$userId) {
        echo json_encode([
            'success' => false,
            'error' => 'User ID required'
        ]);
        exit;
    }
    
    // Use loose comparison with type casting for safety
    $adOwnerId = (int)$ad['user_id'];
    $requestUserId = (int)$userId;
    
    error_log("DELETE-AD: Comparing owner=$adOwnerId vs requester=$requestUserId");
    
    if ($adOwnerId !== $requestUserId) {
        echo json_encode([
            'success' => false,
            'error' => 'Not authorized to delete this ad',
            'debug' => "owner: $adOwnerId, you: $requestUserId"
        ]);
        exit;
    }
    
    // Soft delete - mark as deleted
    $stmt = $pdo->prepare("UPDATE ads SET status = 'deleted' WHERE id = :ad_id");
    $stmt->execute([':ad_id' => $adId]);
    
    if ($stmt->rowCount() > 0) {
        error_log("DELETE-AD: User $userId deleted their ad $adId");
        echo json_encode([
            'success' => true,
            'message' => 'Ad deleted successfully',
            'ad_id' => $adId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to delete ad - no rows affected'
        ]);
    }
    
} catch(PDOException $e) {
    error_log("DELETE-AD error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
