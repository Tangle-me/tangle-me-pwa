<?php
/**
 * GET ADS (non-paginated fallback)
 * Supports: ?search=keyword
 */

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $sql = "SELECT a.*, u.username, u.created_at AS member_since
            FROM ads a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE COALESCE(a.expired, 0) = 0
            AND COALESCE(a.hidden_by_reports, 0) = 0
            AND (a.status IS NULL OR a.status != 'deleted')";

    $params = [];
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    if ($search !== '') {
        $sql .= " AND (a.keywords LIKE ? OR a.description LIKE ? OR a.location_address LIKE ?)";
        $like = '%' . $search . '%';
        $params = [$like, $like, $like];
    }

    $sql .= " ORDER BY a.created_at DESC LIMIT 100";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode photos JSON, derive full path from thumb if missing
    foreach ($ads as &$ad) {
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
    }
    unset($ad);

    echo json_encode([
        'success' => true,
        'ads'     => $ads,
        'count'   => count($ads)
    ]);

} catch (Exception $e) {
    error_log("GET-ADS ERROR: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Query failed: ' . $e->getMessage(), 'ads' => []]);
}
