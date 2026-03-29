<?php
// register.php - Tangle-me Build 022 (FIXED)
// FIX: Returns error:'email_exists' + existingUsername when email is taken
//      so the JS "Login with existing account" button actually appears

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

// Rate limiting
if (file_exists(__DIR__ . '/security/rate-limiter.php')) {
    require_once __DIR__ . '/security/rate-limiter.php';
    rateLimit('register', 3, 600);
}

// Database - inline connection
$pdo = new PDO(
    "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
    "u143213086_tangleme",
    "fake.name.forever@3eLNma",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$data     = json_decode(file_get_contents('php://input'), true);
$email    = trim($data['email']    ?? '');
$username = trim($data['username'] ?? '');
$password = $data['password']      ?? '';
$country  = $data['country']       ?? 'XX';
$deviceId = $data['deviceId']      ?? null;

// Validation
if (!$email || !$username || !$password) {
    echo json_encode(['success' => false, 'error' => 'Email, username, and password required']);
    exit();
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email format']);
    exit();
}
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
    exit();
}

// ---------------------------------------------------------------
// CHECK EMAIL - return 'email_exists' + existingUsername
// This EXACTLY matches what the JS checks at line 6948:
//   result.error === 'email_exists' && result.existingUsername
// ---------------------------------------------------------------
$stmt = $pdo->prepare('SELECT id, username FROM users WHERE email = ?');
$stmt->execute([$email]);
$existingByEmail = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existingByEmail) {
    echo json_encode([
        'success'          => false,
        'error'            => 'email_exists',             // ← JS checks this exact string
        'existingUsername' => $existingByEmail['username'] // ← JS shows this in the notice
    ]);
    exit();
}

// Check username taken
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Username already taken']);
    exit();
}

// Create user
$stmt = $pdo->prepare('INSERT INTO users (email, username, password_hash, country_code, created_at) VALUES (?, ?, ?, ?, NOW())');
$stmt->execute([$email, $username, password_hash($password, PASSWORD_BCRYPT), $country]);
$userId = $pdo->lastInsertId();

// Register device
if ($deviceId) {
    $stmt = $pdo->prepare('INSERT INTO device_registrations (user_id, device_id, last_login) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE user_id = ?, last_login = NOW()');
    $stmt->execute([$userId, $deviceId, $userId]);
}

error_log("New user registered: $email ($username)");

echo json_encode([
    'success' => true,
    'message' => 'Account created successfully',
    'user'    => [
        'id'       => $userId,
        'email'    => $email,
        'username' => $username,
        'country'  => $country
    ]
]);
