<?php
/**
 * UPDATE AD API - Build 024
 * Updates an existing ad, including photos JSON (for reordering/removal)
 * 
 * POST /api/update-ad.php
 * Body: { ad_id, keywords, description, contact, photos?, location_lat?, location_lng?, location_address? }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

// Content moderation
require_once 'moderation.php';

// Rate limiting
if (file_exists('security/rate-limiter.php')) {
    require_once 'security/rate-limiter.php';
    rateLimit('update-ad', 15, 600);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$ad_id = isset($input['ad_id']) ? intval($input['ad_id']) : 0;
$keywords = isset($input['keywords']) ? trim($input['keywords']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$contact = isset($input['contact']) ? trim($input['contact']) : '';
$photosRaw = isset($input['photos']) ? $input['photos'] : null;

$location_lat = isset($input['location_lat']) ? $input['location_lat'] : null;
$location_lng = isset($input['location_lng']) ? $input['location_lng'] : null;
$location_address = isset($input['location_address']) ? trim($input['location_address']) : null;

if (!$ad_id) {
    echo json_encode(['success' => false, 'error' => 'Ad ID required']);
    exit;
}

if (!$keywords) {
    echo json_encode(['success' => false, 'error' => 'Keywords required']);
    exit;
}

// Content moderation
$keywordsCheck = validateContentPHP($keywords, 'keywords');
if ($keywordsCheck) {
    echo json_encode(['success' => false, 'error' => $keywordsCheck, 'code' => 'CONTENT_VIOLATION']);
    exit;
}

if ($description) {
    $descCheck = validateContentPHP($description, 'description');
    if ($descCheck) {
        echo json_encode(['success' => false, 'error' => $descCheck, 'code' => 'CONTENT_VIOLATION']);
        exit;
    }
}

if ($contact) {
    $contactCheck = validateContentPHP($contact, 'contact');
    if ($contactCheck) {
        echo json_encode(['success' => false, 'error' => $contactCheck, 'code' => 'CONTENT_VIOLATION']);
        exit;
    }
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
    
    $stmt = $pdo->prepare("SELECT id, user_id FROM ads WHERE id = ?");
    $stmt->execute([$ad_id]);
    $ad = $stmt->fetch();
    
    if (!$ad) {
        echo json_encode(['success' => false, 'error' => 'Ad not found']);
        exit;
    }
    
    $updateFields = [
        'keywords = ?',
        'description = ?',
        'contact = ?',
        'updated_at = NOW()'
    ];
    $params = [$keywords, $description, $contact];
    
    // Build 024: Update photos if provided (for reordering/removal)
    if ($photosRaw !== null && is_array($photosRaw)) {
        $photosClean = [];
        foreach ($photosRaw as $p) {
            if (is_array($p) && (!empty($p['thumb']) || !empty($p['full']))) {
                $photosClean[] = [
                    'thumb' => $p['thumb'] ?? '',
                    'full'  => $p['full']  ?? $p['thumb'] ?? ''
                ];
            }
        }
        $updateFields[] = 'photos = ?';
        $params[] = count($photosClean) > 0 ? json_encode($photosClean) : null;
    }
    
    if ($location_lat !== null && $location_lng !== null) {
        $updateFields[] = 'latitude = ?';
        $updateFields[] = 'longitude = ?';
        $params[] = $location_lat;
        $params[] = $location_lng;
    }
    
    if ($location_address !== null) {
        $updateFields[] = 'location_address = ?';
        $params[] = $location_address;
    }
    
    $params[] = $ad_id;
    
    $sql = "UPDATE ads SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($params);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Ad updated successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update ad']);
    }
    
} catch (PDOException $e) {
    error_log("Update ad error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
