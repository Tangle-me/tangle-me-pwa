<?php
/**
 * SEARCH ADS
 * POST endpoint for keyword + location + radius search
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
        "u143213086_tangleme",
        "fake.name.forever@3eLNma",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Check which columns exist in ads table (avoids crash on missing columns)
    $cols = [];
    $colCheck = $pdo->query("SHOW COLUMNS FROM ads");
    while ($row = $colCheck->fetch(PDO::FETCH_ASSOC)) {
        $cols[] = $row['Field'];
    }
    $hasStatus = in_array('status', $cols);
    $hasExpired = in_array('expired', $cols);
    $hasHidden = in_array('hidden_by_reports', $cols);
    $hasLocationLat = in_array('location_lat', $cols);
    $hasLocationLon = in_array('location_lon', $cols);
    $hasLatitude = in_array('latitude', $cols);
    $hasLongitude = in_array('longitude', $cols);

    // Build GPS column expressions (COALESCE handles both old and new column names)
    $gpsLatExpr = $hasLocationLat && $hasLatitude ? 'COALESCE(a.location_lat, a.latitude)'
                : ($hasLocationLat ? 'a.location_lat' : ($hasLatitude ? 'a.latitude' : 'NULL'));
    $gpsLonExpr = $hasLocationLon && $hasLongitude ? 'COALESCE(a.location_lon, a.longitude)'
                : ($hasLocationLon ? 'a.location_lon' : ($hasLongitude ? 'a.longitude' : 'NULL'));

    $input = json_decode(file_get_contents('php://input'), true);

    $latitude  = floatval($input['latitude']  ?? 0);
    $longitude = floatval($input['longitude'] ?? 0);
    $radiusKm  = floatval($input['radius_km'] ?? 50);
    $keyword   = trim($input['keyword'] ?? '');

    $isGlobal    = ($radiusKm >= 50000);
    $hasLocation = ($latitude != 0 && $longitude != 0 && !$isGlobal);

    // ── Base query ───────────────────────────────────────────────────────────
    $where = "WHERE 1=1";
    if ($hasExpired) $where .= " AND COALESCE(a.expired, 0) = 0";
    if ($hasHidden)  $where .= " AND COALESCE(a.hidden_by_reports, 0) = 0";
    if ($hasStatus)  $where .= " AND (a.status IS NULL OR a.status != 'deleted')";

    $sql = "SELECT a.*, u.username, u.created_at AS member_since
            FROM ads a
            LEFT JOIN users u ON a.user_id = u.id
            $where";

    $params = [];

    // ── Keyword search (AND logic: every word must appear somewhere) ─────────
    if ($keyword !== '') {
        $words = preg_split('/\s+/', $keyword);
        $keywordClauses = [];

        foreach ($words as $word) {
            if (strlen($word) < 2) continue;

            // Escape LIKE special characters
            $escapedWord = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $word);
            $wordParam = '%' . $escapedWord . '%';

            $keywordClauses[] = "(a.keywords LIKE ?)";
            $params[] = $wordParam;
        }

        if (count($keywordClauses) > 0) {
            $sql .= " AND (" . implode(' AND ', $keywordClauses) . ")";
        }
    }

    // ── For specific radius: only ads that have stored GPS coordinates ────────
    if ($hasLocation) {
        $sql .= " AND ({$gpsLatExpr} IS NOT NULL
                  AND {$gpsLonExpr} IS NOT NULL
                  AND {$gpsLatExpr} != 0
                  AND {$gpsLonExpr} != 0)";
    }

    $sql .= " ORDER BY a.created_at DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ── Post-process each ad ─────────────────────────────────────────────────
    $ads = [];
    foreach ($rows as $ad) {
        // Decode photos from ads.photos JSON column
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

        // Derive country flag emoji from ISO country_code (e.g. "ZA" -> flag)
        $cc = strtoupper(trim($ad['country_code'] ?? ''));
        if (strlen($cc) === 2 && function_exists('mb_chr')) {
            $ad['country_flag'] = mb_chr(0x1F1E6 + ord($cc[0]) - ord('A')) . mb_chr(0x1F1E6 + ord($cc[1]) - ord('A'));
        } else {
            $ad['country_flag'] = '';
        }

        $ads[] = $ad;
    }

    // ── Haversine radius filtering (PHP-side, precise) ───────────────────────
    if ($hasLocation) {
        $filtered = [];

        foreach ($ads as &$ad) {
            // COALESCE: check location_lat/location_lon first, fall back to latitude/longitude
            $adLat = floatval($ad['location_lat'] ?? $ad['latitude'] ?? 0);
            $adLng = floatval($ad['location_lon'] ?? $ad['longitude'] ?? 0);

            if ($adLat != 0 && $adLng != 0) {
                $distance = haversineDistance($latitude, $longitude, $adLat, $adLng);
                $ad['distance_km'] = round($distance, 1);
                // Also ensure client-side can read GPS regardless of column name
                $ad['location_lat'] = $adLat;
                $ad['location_lon'] = $adLng;

                if ($distance <= $radiusKm) {
                    $filtered[] = $ad;
                }
            }
        }
        unset($ad);

        usort($filtered, function ($a, $b) {
            return ($a['distance_km'] ?? 99999) <=> ($b['distance_km'] ?? 99999);
        });

        $ads = $filtered;
    }

    ob_end_clean();
    echo json_encode([
        'success' => true,
        'ads'     => $ads,
        'count'   => count($ads)
    ]);

} catch (Throwable $e) {
    $errMsg = $e->getMessage() . ' on line ' . $e->getLine();
    error_log("SEARCH-AD ERROR: " . $errMsg);
    ob_end_clean();
    // Return 200 with success:false so Hostinger doesn't intercept with custom error page
    echo json_encode([
        'success' => false,
        'error'   => 'Search failed: ' . $errMsg,
        'ads'     => []
    ]);
}

// ── Haversine distance formula (km) ─────────────────────────────────────────
function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $R    = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a    = sin($dLat / 2) * sin($dLat / 2)
          + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
          * sin($dLon / 2) * sin($dLon / 2);
    $c    = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}
