<?php
/**
 * GET TANGLE ADS API - Build 028
 * Returns only the ads that the user specifically saved for a given tangle
 * 
 * GET /api/get-tangle-ads.php?user_id=X&saved_user_id=Y
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$savedUserId = isset($_GET['saved_user_id']) ? intval($_GET['saved_user_id']) : 0;

if (!$userId || !$savedUserId) {
    echo json_encode(['success' => false, 'error' => 'user_id and saved_user_id required']);
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
    
    // Check if junction table exists
    $junctionExists = $pdo->query("SHOW TABLES LIKE 'saved_tangle_ads'")->fetch();
    
    if ($junctionExists) {
        // Get only ads that were specifically saved
        $sql = "SELECT a.*, u.username, u.country_flag, u.country_code, u.country_name, u.created_at as member_since
                FROM saved_tangle_ads sta
                JOIN ads a ON sta.ad_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE sta.user_id = ? AND sta.saved_user_id = ?
                ORDER BY sta.created_at DESC";
    } else {
        // Fallback: return all ads by that user
        $sql = "SELECT a.*, u.username, u.country_flag, u.country_code, u.country_name, u.created_at as member_since
                FROM ads a
                JOIN users u ON a.user_id = u.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC";
    }
    
    $stmt = $pdo->prepare($sql);
    if ($junctionExists) {
        $stmt->execute([$userId, $savedUserId]);
    } else {
        $stmt->execute([$savedUserId]);
    }
    $ads = $stmt->fetchAll();
    
    // Parse photos JSON for each ad
    foreach ($ads as &$ad) {
        if (isset($ad['photos']) && is_string($ad['photos'])) {
            $ad['photos'] = json_decode($ad['photos'], true) ?: [];
        }
    }
    
    echo json_encode([
        'success' => true,
        'ads' => $ads,
        'count' => count($ads)
    ]);
    
} catch (PDOException $e) {
    error_log("Get tangle ads error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
