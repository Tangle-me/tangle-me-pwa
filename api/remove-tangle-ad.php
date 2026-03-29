<?php
/**
 * REMOVE TANGLE AD API - Build 028
 * Removes a specific saved ad from a tangle, or removes the entire tangle
 * 
 * POST /api/remove-tangle-ad.php
 * Body: { user_id, saved_user_id, ad_id }  — removes one ad
 * Body: { user_id, saved_user_id }          — removes entire tangle + all saved ads
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

session_start();

$input = json_decode(file_get_contents('php://input'), true);

$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
$savedUserId = isset($input['saved_user_id']) ? intval($input['saved_user_id']) : 0;
$adId = isset($input['ad_id']) ? intval($input['ad_id']) : 0;

if ($userId === 0 && isset($_SESSION['user_id'])) {
    $userId = intval($_SESSION['user_id']);
}

if ($userId <= 0 || $savedUserId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid parameters']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
        "u143213086_tangleme",
        "fake.name.forever@3eLNma",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Check junction table exists
    $junctionExists = $pdo->query("SHOW TABLES LIKE 'saved_tangle_ads'")->fetch();
    
    if ($adId > 0 && $junctionExists) {
        // Remove specific ad from junction table
        $stmt = $pdo->prepare("DELETE FROM saved_tangle_ads WHERE user_id = ? AND saved_user_id = ? AND ad_id = ?");
        $stmt->execute([$userId, $savedUserId, $adId]);
        
        // Get remaining count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM saved_tangle_ads WHERE user_id = ? AND saved_user_id = ?");
        $countStmt->execute([$userId, $savedUserId]);
        $remaining = intval($countStmt->fetch()['cnt']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Ad removed from saved list',
            'remaining_ads' => $remaining
        ]);
    } else {
        // Remove entire tangle (both tables)
        if ($junctionExists) {
            $stmt = $pdo->prepare("DELETE FROM saved_tangle_ads WHERE user_id = ? AND saved_user_id = ?");
            $stmt->execute([$userId, $savedUserId]);
        }
        
        $stmt = $pdo->prepare("DELETE FROM saved_tangles WHERE user_id = ? AND saved_user_id = ?");
        $stmt->execute([$userId, $savedUserId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Tangle removed completely',
            'remaining_ads' => 0
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Remove tangle ad error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
