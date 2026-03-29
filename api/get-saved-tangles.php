<?php
/**
 * GET SAVED TANGLES API - Build 028
 * Returns user's saved tangles with saved ad count from junction table
 * 
 * GET /api/get-saved-tangles.php?user_id=X
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

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'User ID required']);
    exit;
}

$pdo = new PDO(
    "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
    "u143213086_tangleme",
    "fake.name.forever@3eLNma",
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]
);

try {
    // Check if saved_tangles table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'saved_tangles'")->fetch();
    if (!$tableCheck) {
        echo json_encode(['success' => true, 'data' => [], 'count' => 0]);
        exit;
    }
    
    // Check if junction table exists
    $junctionExists = $pdo->query("SHOW TABLES LIKE 'saved_tangle_ads'")->fetch();
    
    // Build 028: Count saved ads from junction table (not total ads by user)
    if ($junctionExists) {
        $sql = "SELECT 
                    st.id,
                    st.saved_user_id,
                    st.ad_id,
                    st.notes,
                    u.username as saved_username,
                    u.country_code,
                    u.country_name,
                    u.country_flag,
                    u.created_at as member_since,
                    (SELECT COUNT(*) FROM saved_tangle_ads sta 
                     WHERE sta.user_id = st.user_id AND sta.saved_user_id = st.saved_user_id) as saved_ad_count,
                    (SELECT GROUP_CONCAT(sta2.ad_id) FROM saved_tangle_ads sta2 
                     WHERE sta2.user_id = st.user_id AND sta2.saved_user_id = st.saved_user_id) as saved_ad_ids
                FROM saved_tangles st
                JOIN users u ON st.saved_user_id = u.id
                WHERE st.user_id = ?
                ORDER BY st.id DESC";
    } else {
        // Fallback: old behavior — count all ads by that user
        $sql = "SELECT 
                    st.id,
                    st.saved_user_id,
                    st.ad_id,
                    st.notes,
                    u.username as saved_username,
                    u.country_code,
                    u.country_name,
                    u.country_flag,
                    u.created_at as member_since,
                    (SELECT COUNT(*) FROM ads WHERE user_id = st.saved_user_id) as saved_ad_count,
                    '' as saved_ad_ids
                FROM saved_tangles st
                JOIN users u ON st.saved_user_id = u.id
                WHERE st.user_id = ?
                ORDER BY st.id DESC";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $tangles = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $tangles,
        'count' => count($tangles)
    ]);
    
} catch (PDOException $e) {
    error_log("Get saved tangles error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
