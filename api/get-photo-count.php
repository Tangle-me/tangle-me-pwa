<?php
// get-photo-count.php - Tangle-me Photo Count API v4.3.0
// Returns user's current photo count and remaining slots

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host = 'localhost';
$dbname = 'u143213086_tangleme';
$username = 'u143213086_tangleme';
$password = 'fake.name.forever@3eLNma';

try {
    $userId = $_GET['user_id'] ?? null;
    $userTier = $_GET['tier'] ?? 'free';
    
    if (!$userId) {
        throw new Exception('User ID required');
    }
    
    // Tier limits
    $tierLimits = [
        'free' => 0,
        'basic' => 20,
        'pro' => -1 // -1 means unlimited
    ];
    
    $limit = $tierLimits[$userTier] ?? 0;
    
    // Connect to database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user's photo count
    $stmt = $pdo->prepare("SELECT photo_count FROM users WHERE id = :user_id");
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $photoCount = $user['photo_count'] ?? 0;
    
    if ($limit === -1) {
        // PRO tier - unlimited
        echo json_encode([
            'success' => true,
            'tier' => $userTier,
            'photo_count' => $photoCount,
            'limit' => 'unlimited',
            'remaining' => 'unlimited',
            'can_upload' => true
        ]);
    } elseif ($limit === 0) {
        // FREE tier - no photos
        echo json_encode([
            'success' => true,
            'tier' => $userTier,
            'photo_count' => $photoCount,
            'limit' => 0,
            'remaining' => 0,
            'can_upload' => false,
            'message' => 'Upgrade to BASIC or PRO to upload photos'
        ]);
    } else {
        // BASIC tier - limited
        $remaining = max(0, $limit - $photoCount);
        echo json_encode([
            'success' => true,
            'tier' => $userTier,
            'photo_count' => $photoCount,
            'limit' => $limit,
            'remaining' => $remaining,
            'can_upload' => $remaining > 0
        ]);
    }
    
} catch (Exception $e) {
    error_log("GET-PHOTO-COUNT error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Server error'
    ]);
}
?>
