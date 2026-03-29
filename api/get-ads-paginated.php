<?php
/**
 * GET ADS PAGINATED
 * Params: ?page=1&limit=20
 */

error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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

    $page   = max(1, intval($_GET['page']  ?? 1));
    $limit  = min(50, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $countStmt = $pdo->query("SELECT COUNT(*) AS total FROM ads
                              WHERE COALESCE(expired, 0) = 0
                              AND COALESCE(hidden_by_reports, 0) = 0
                              AND (status IS NULL OR status != 'deleted')");
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    $sql = "SELECT a.*, u.username, u.created_at AS member_since
            FROM ads a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE COALESCE(a.expired, 0) = 0
            AND COALESCE(a.hidden_by_reports, 0) = 0
            AND (a.status IS NULL OR a.status != 'deleted')
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
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

    $totalPages = $total > 0 ? ceil($total / $limit) : 1;

    echo json_encode([
        'success' => true,
        'ads'     => $ads,
        'pagination' => [
            'page'        => $page,
            'limit'       => $limit,
            'total'       => intval($total),
            'total_pages' => $totalPages,
            'has_next'    => $page < $totalPages,
            'has_prev'    => $page > 1
        ]
    ]);

} catch (Exception $e) {
    error_log("GET-ADS-PAGINATED ERROR: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Query failed: ' . $e->getMessage(), 'ads' => []]);
}
