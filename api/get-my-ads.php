<?php
/**
 * Tangle-me Get My Ads API
 * Build 010 - COMPLETE FIX with detailed logging
 * Date: 1 February 2026
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// CORS headers
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include config
require_once 'config.php';

// Log function
function logDebug($message) {
    error_log("[GET-MY-ADS] " . date('Y-m-d H:i:s') . " - " . $message);
}

logDebug("=== GET MY ADS REQUEST ===");
logDebug("Method: " . $_SERVER['REQUEST_METHOD']);
logDebug("GET params: " . json_encode($_GET));

// Start session to check for session user
session_start();
logDebug("Session user_id: " . ($_SESSION['user_id'] ?? 'not set'));

// Get user_id from multiple sources (query param takes priority)
$userId = null;

// Check query parameter first
if (isset($_GET['user_id']) && intval($_GET['user_id']) > 0) {
    $userId = intval($_GET['user_id']);
    logDebug("Got user_id from GET param: $userId");
}

// Fallback to session
if (!$userId && isset($_SESSION['user_id'])) {
    $userId = intval($_SESSION['user_id']);
    logDebug("Got user_id from session: $userId");
}

// Also check POST body (in case frontend sends it that way)
if (!$userId) {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $data = json_decode($input, true);
        if (isset($data['user_id']) && intval($data['user_id']) > 0) {
            $userId = intval($data['user_id']);
            logDebug("Got user_id from POST body: $userId");
        }
    }
}

if (!$userId || $userId <= 0) {
    logDebug("ERROR: No valid user_id found");
    echo json_encode([
        'success' => false, 
        'error' => 'User ID required',
        'debug' => [
            'get' => $_GET,
            'session' => isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null
        ]
    ]);
    exit();
}

logDebug("Final user_id: $userId");

try {
    // Connect to database
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    logDebug("Database connected");
    
    // Get user's ads (only active ones)
    $stmt = $pdo->prepare("
        SELECT * FROM ads 
        WHERE user_id = ? AND status = 'active'
        ORDER BY created_at DESC
    ");
    $stmt->execute([$userId]);
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    logDebug("Found " . count($ads) . " ads for user $userId");
    
    // Process ads - decode photos JSON
    $processedAds = [];
    foreach ($ads as $ad) {
        // Decode photos from JSON string to array
        if (isset($ad['photos']) && !empty($ad['photos'])) {
            logDebug("Ad {$ad['id']} raw photos: " . $ad['photos']);
            $decoded = json_decode($ad['photos'], true);
            $ad['photos'] = ($decoded !== null) ? $decoded : [];
            logDebug("Ad {$ad['id']} decoded photos count: " . count($ad['photos']));
        } else {
            $ad['photos'] = [];
            logDebug("Ad {$ad['id']} has no photos");
        }
        
        // Map location_lon back to location_lng for frontend compatibility
        if (isset($ad['location_lon'])) {
            $ad['location_lng'] = $ad['location_lon'];
        }
        
        // Map tier back to premium_tier for frontend compatibility
        if (isset($ad['tier'])) {
            $tierMap = ['free' => 'free', 'photo' => 'basic', 'business' => 'pro'];
            $ad['premium_tier'] = isset($tierMap[$ad['tier']]) ? $tierMap[$ad['tier']] : $ad['tier'];
        }
        
        $processedAds[] = $ad;
    }
    
    logDebug("Returning " . count($processedAds) . " processed ads");
    
    // Return success
    echo json_encode([
        'success' => true,
        'ads' => $processedAds,
        'count' => count($processedAds),
        'user_id' => $userId
    ]);
    
} catch (PDOException $e) {
    logDebug("DATABASE ERROR: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
