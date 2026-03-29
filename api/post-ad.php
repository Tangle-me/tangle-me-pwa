<?php
/**
 * Tangle-me - Post Ad API
 * Build 023 Fix: saves photos JSON, fixes tier column name
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Include content moderation
require_once 'moderation.php';

// Rate limiting (optional)
if (file_exists('security/rate-limiter.php')) {
    require_once 'security/rate-limiter.php';
    rateLimit('post-ad', 50, 600);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    die(json_encode(['success' => false, 'error' => 'Invalid JSON']));
}

$userId       = isset($input['user_id'])         ? intval($input['user_id'])           : null;
$keywords     = isset($input['keywords'])        ? trim($input['keywords'])            : '';
$description  = isset($input['description'])     ? trim($input['description'])         : '';
$contact      = isset($input['contact'])         ? trim($input['contact'])             : '';
$latitude     = isset($input['location_lat'])    ? floatval($input['location_lat'])    : (isset($input['latitude'])  ? floatval($input['latitude'])  : null);
$longitude    = isset($input['location_lng'])    ? floatval($input['location_lng'])    : (isset($input['longitude']) ? floatval($input['longitude']) : null);
$locationAddr = isset($input['location_address'])? trim($input['location_address'])    : '';
$photosRaw    = isset($input['photos'])          ? $input['photos']                    : [];

if (!$userId)        die(json_encode(['success' => false, 'error' => 'User ID required']));
if (empty($keywords)) die(json_encode(['success' => false, 'error' => 'Ad text/keywords required']));

// Content moderation
$keywordsCheck = validateContentPHP($keywords, 'ad text');
if ($keywordsCheck) die(json_encode(['success' => false, 'error' => $keywordsCheck, 'code' => 'CONTENT_VIOLATION']));

if (!empty($description)) {
    $descCheck = validateContentPHP($description, 'description');
    if ($descCheck) die(json_encode(['success' => false, 'error' => $descCheck, 'code' => 'CONTENT_VIOLATION']));
}

if (!empty($contact)) {
    $contactCheck = validateContentPHP($contact, 'contact information');
    if ($contactCheck) die(json_encode(['success' => false, 'error' => $contactCheck, 'code' => 'CONTENT_VIOLATION']));
}

// Sanitise photos: keep only objects with at least a thumb or full path
$photosClean = [];
if (is_array($photosRaw)) {
    foreach ($photosRaw as $p) {
        if (is_array($p) && (!empty($p['thumb']) || !empty($p['full']))) {
            $photosClean[] = [
                'thumb' => $p['thumb'] ?? '',
                'full'  => $p['full']  ?? $p['thumb'] ?? ''
            ];
        }
    }
}
$photosJson = count($photosClean) > 0 ? json_encode($photosClean) : null;

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Build 023 fix: column is subscription_tier, not tier
    $stmtUser = $pdo->prepare("SELECT id, subscription_tier FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) die(json_encode(['success' => false, 'error' => 'User not found']));

    $tier = strtolower($user['subscription_tier'] ?? 'free');
    switch ($tier) {
        case 'pro':   $expiryDays = 90; break;
        case 'basic': $expiryDays = 60; break;
        default:      $expiryDays = 30; break;
    }
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryDays} days"));

    // Build 027 fix: correct column names to match database schema (location_lat, location_lon)
    $stmt = $pdo->prepare("
        INSERT INTO ads (user_id, keywords, description, contact, location_lat, location_lon, location_address, photos, created_at, expires_at, expired)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 0)
    ");

    $stmt->execute([
        $userId,
        $keywords,
        $description,
        $contact,
        $latitude,
        $longitude,
        $locationAddr,
        $photosJson,
        $expiresAt
    ]);

    $adId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Ad posted successfully',
        'id'      => (int)$adId,   // JS expects 'id', not 'ad_id'
        'ad_id'   => (int)$adId
    ]);

} catch (PDOException $e) {
    error_log('[POST-AD] Error: ' . $e->getMessage());
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Database error']));
}
