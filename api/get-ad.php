<?php
/**
 * GET SINGLE AD BY ID
 * GET /api/get-ad.php?id=123
 */

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$adId = intval($_GET['id'] ?? 0);
if (!$adId) {
    echo json_encode(['success' => false, 'error' => 'Ad ID required']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("SELECT a.*, u.username, u.created_at AS member_since
                           FROM ads a
                           LEFT JOIN users u ON a.user_id = u.id
                           WHERE a.id = ?");
    $stmt->execute([$adId]);
    $ad = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ad) {
        echo json_encode(['success' => false, 'error' => 'Ad not found']);
        exit;
    }

    // Decode photos JSON, derive full path from thumb if missing
    if (!empty($ad['photos']) && is_string($ad['photos'])) {
        $decoded = json_decode($ad['photos'], true);
        if (is_array($decoded)) {
            foreach ($decoded as &$photo) {
                if (empty($photo['full']) && !empty($photo['thumb'])) {
                    $photo['full'] = str_replace('uploads/photos/thumbs/', 'uploads/photos/', $photo['thumb']);
                }
            }
            unset($photo);
            $ad['photos'] = $decoded;
        } else {
            $ad['photos'] = [];
        }
    } else {
        $ad['photos'] = [];
    }

    echo json_encode(['success' => true, 'data' => $ad]);

} catch (Exception $e) {
    error_log("GET-AD ERROR: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Failed to load ad']);
}
