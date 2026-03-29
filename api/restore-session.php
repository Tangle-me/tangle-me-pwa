<?php
/**
 * Tangle-me - Restore Session API
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// SESSION MUST start first so the cookie is issued back to the browser
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input) {
    die(json_encode(['success' => false, 'error' => 'Invalid JSON']));
}

$email   = isset($input['email'])   ? trim($input['email'])    : null;
$uname   = isset($input['username'])? trim($input['username']) : null;
$user_id = isset($input['user_id']) ? intval($input['user_id']): null;

if (!$email && !$uname && !$user_id) {
    die(json_encode(['success' => false, 'error' => 'Email, username or user_id required']));
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log('[RESTORE-SESSION] DB Error: ' . $e->getMessage());
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Database error']));
}

try {
    // Detect which columns actually exist to avoid 500 on missing columns
    $colCheck = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    $wantedCols = ['id', 'email', 'username', 'country', 'country_code', 'country_name', 'country_flag', 'tier', 'created_at'];
    $safeCols = array_filter($wantedCols, fn($c) => in_array($c, $colCheck));
    $cols = implode(', ', $safeCols);

    if ($email) {
        $stmt = $pdo->prepare("SELECT $cols FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
    } elseif ($uname) {
        $stmt = $pdo->prepare("SELECT $cols FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$uname]);
    } else {
        $stmt = $pdo->prepare("SELECT $cols FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$user_id]);
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        die(json_encode(['success' => false, 'error' => 'User not found']));
    }

    // Set PHP session so bulk_upload.php and other endpoints can auth without re-login
    $_SESSION['user_id']  = (int)    $user['id'];
    $_SESSION['username'] = (string) ($user['username'] ?? 'unknown');
    $_SESSION['email']    = (string) ($user['email']    ?? '');

    // Subscription tier: users.tier is primary, subscriptions table is override
    $tier = $user['tier'] ?? 'free';
    try {
        $stmtSub = $pdo->prepare(
            "SELECT tier FROM subscriptions WHERE user_id = ? AND status = 'active'
             ORDER BY created_at DESC LIMIT 1"
        );
        $stmtSub->execute([$user['id']]);
        $sub = $stmtSub->fetch(PDO::FETCH_ASSOC);
        if ($sub && !empty($sub['tier'])) $tier = $sub['tier'];
    } catch (PDOException $e) {
        error_log('[RESTORE-SESSION] Subscription lookup skipped: ' . $e->getMessage());
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'id'                => (int)    $user['id'],
            'email'             => (string) ($user['email']        ?? ''),
            'username'          => (string) ($user['username']     ?? ''),
            'country'           => (string) ($user['country']      ?? ''),
            'country_code'      => (string) ($user['country_code'] ?? ''),
            'country_name'      => (string) ($user['country_name'] ?? ''),
            'country_flag'      => (string) ($user['country_flag'] ?? ''),
            'tier'              => (string) $tier,
            'subscription_tier' => (string) $tier,
            'created_at'        => (string) ($user['created_at']   ?? ''),
            'member_since'      => (string) ($user['created_at']   ?? '')
        ]
    ]);

} catch (PDOException $e) {
    error_log('[RESTORE-SESSION] Query Error: ' . $e->getMessage());
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Query failed']));
}
