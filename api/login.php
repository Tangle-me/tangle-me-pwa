<?php
// login.php - Tangle-me v4.3.4
// Clean, minimal login

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Build 015 - Rate limiting (5 attempts per 5 minutes)
if (file_exists(__DIR__ . '/security/rate-limiter.php')) {
    require_once __DIR__ . '/security/rate-limiter.php';
    rateLimit('login', 5, 300);
}

// Database
$pdo = new PDO(
    "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
    "u143213086_tangleme",
    "fake.name.forever@3eLNma",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$data = json_decode(file_get_contents('php://input'), true);
$identifier = trim($data['identifier'] ?? $data['email'] ?? '');
$password = $data['password'] ?? '';
$deviceId = $data['deviceId'] ?? null;

if (!$identifier || !$password) {
    echo json_encode(['success' => false, 'error' => 'Email and password required']);
    exit();
}

// Find user
$stmt = $pdo->prepare('SELECT id, email, username, password_hash, country_code FROM users WHERE email = ? OR username = ?');
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    error_log("Login failed: $identifier");
    echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
    exit();
}

// Update device registration
if ($deviceId) {
    $stmt = $pdo->prepare('INSERT INTO device_registrations (user_id, device_id, last_login) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE user_id = ?, last_login = NOW()');
    $stmt->execute([$user['id'], $deviceId, $user['id']]);
}

// Update last login
$pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

error_log("Login successful: " . $user['username']);

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'username' => $user['username'],
        'country' => $user['country_code']
    ],
    'message' => 'Login successful'
]);
?>
