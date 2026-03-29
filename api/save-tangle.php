<?php
/**
 * SAVE TANGLE API - Build 028
 * Saves an advertiser to user's My Tangles + tracks saved ads in junction table
 * 
 * POST /api/save-tangle.php
 * Body: { saved_user_id, ad_id?, notes?, user_id }
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

$savedUserId = isset($input['saved_user_id']) ? intval($input['saved_user_id']) : 0;
$adId = isset($input['ad_id']) ? intval($input['ad_id']) : null;
$notes = isset($input['notes']) ? trim($input['notes']) : '';
$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;

if ($userId === 0 && isset($_SESSION['user_id'])) {
    $userId = intval($_SESSION['user_id']);
}

if ($userId <= 0) {
    echo json_encode(['success' => false, 'error' => 'You must be logged in to save Tangles']);
    exit;
}
if ($savedUserId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid user to save']);
    exit;
}
if ($userId === $savedUserId) {
    echo json_encode(['success' => false, 'error' => 'You cannot save yourself']);
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
    
    // Ensure saved_tangles table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'saved_tangles'")->fetch();
    if (!$tableCheck) {
        $pdo->exec("CREATE TABLE saved_tangles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            saved_user_id INT NOT NULL,
            ad_id INT DEFAULT NULL,
            notes VARCHAR(500) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_save (user_id, saved_user_id),
            INDEX idx_user (user_id)
        )");
    }
    
    // Build 028: Ensure saved_tangle_ads junction table exists
    $junctionCheck = $pdo->query("SHOW TABLES LIKE 'saved_tangle_ads'")->fetch();
    if (!$junctionCheck) {
        $pdo->exec("CREATE TABLE saved_tangle_ads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            saved_user_id INT NOT NULL,
            ad_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_save_ad (user_id, saved_user_id, ad_id),
            INDEX idx_user_saved (user_id, saved_user_id)
        )");
    }
    
    // Check if tangle already saved
    $stmt = $pdo->prepare("SELECT id, notes FROM saved_tangles WHERE user_id = ? AND saved_user_id = ?");
    $stmt->execute([$userId, $savedUserId]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update notes only if new notes provided
        if ($notes !== '') {
            $stmt = $pdo->prepare("UPDATE saved_tangles SET notes = ? WHERE id = ?");
            $stmt->execute([$notes, $existing['id']]);
        }
        $tangleId = $existing['id'];
        $message = 'Tangle updated';
    } else {
        // Insert new tangle
        $stmt = $pdo->prepare("INSERT INTO saved_tangles (user_id, saved_user_id, ad_id, notes) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $savedUserId, $adId, $notes]);
        $tangleId = $pdo->lastInsertId();
        $message = 'Tangle saved';
    }
    
    // Build 028: Also save the specific ad in junction table
    $adSaved = false;
    if ($adId && $adId > 0) {
        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO saved_tangle_ads (user_id, saved_user_id, ad_id) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $savedUserId, $adId]);
            $adSaved = $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            // Duplicate — already saved, ignore
        }
    }
    
    // Get updated saved ad count for this tangle
    $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM saved_tangle_ads WHERE user_id = ? AND saved_user_id = ?");
    $countStmt->execute([$userId, $savedUserId]);
    $savedAdCount = intval($countStmt->fetch()['cnt']);
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'id' => $tangleId,
        'ad_saved' => $adSaved,
        'saved_ad_count' => $savedAdCount
    ]);
    
} catch (PDOException $e) {
    error_log("Save tangle error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
