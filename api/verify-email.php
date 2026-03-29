<?php
/**
 * TANGLE-ME API — Verify Email Code
 * Build 016
 * 
 * POST /api/verify-email.php
 * Body: { "user_id": 123, "code": "482917" }
 * 
 * Validates the 6-digit code. Max 5 attempts before code is invalidated.
 */

// CORS
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Database connection
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Parse input
$input = json_decode(file_get_contents('php://input'), true);
$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
$code = isset($input['code']) ? trim($input['code']) : '';

if ($userId <= 0 || empty($code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'User ID and verification code required']);
    exit();
}

// Validate code format (6 digits only)
if (!preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid code format']);
    exit();
}

try {
    // Get user's verification info
    $stmt = $pdo->prepare('
        SELECT id, email, email_verified, verification_code, verification_expires, verification_attempts
        FROM users WHERE id = ?
    ');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit();
    }

    // Already verified?
    if ($user['email_verified'] == 1) {
        echo json_encode(['success' => true, 'message' => 'Email already verified', 'already_verified' => true]);
        exit();
    }

    // No code set?
    if (empty($user['verification_code'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No verification code found. Please request a new one.']);
        exit();
    }

    // Too many attempts?
    if ($user['verification_attempts'] >= 5) {
        // Invalidate the code
        $stmt = $pdo->prepare('UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?');
        $stmt->execute([$userId]);

        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Too many wrong attempts. Please request a new code.',
            'code_invalidated' => true
        ]);
        exit();
    }

    // Code expired?
    if (strtotime($user['verification_expires']) < time()) {
        $stmt = $pdo->prepare('UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?');
        $stmt->execute([$userId]);

        http_response_code(410);
        echo json_encode([
            'success' => false,
            'error' => 'Code has expired. Please request a new one.',
            'code_expired' => true
        ]);
        exit();
    }

    // Check the code
    if ($code === $user['verification_code']) {
        // SUCCESS — mark as verified, clear code
        $stmt = $pdo->prepare('
            UPDATE users 
            SET email_verified = 1, verification_code = NULL, verification_expires = NULL, verification_attempts = 0
            WHERE id = ?
        ');
        $stmt->execute([$userId]);

        echo json_encode([
            'success' => true,
            'message' => 'Email verified successfully!',
            'email_verified' => true
        ]);

        error_log("Email verified for user ID {$userId}");
    } else {
        // WRONG CODE — increment attempts
        $attempts = $user['verification_attempts'] + 1;
        $remaining = 5 - $attempts;

        $stmt = $pdo->prepare('UPDATE users SET verification_attempts = ? WHERE id = ?');
        $stmt->execute([$attempts, $userId]);

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => "Incorrect code. {$remaining} attempt(s) remaining.",
            'attempts_remaining' => $remaining
        ]);
    }

} catch (PDOException $e) {
    error_log("Verify email error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>
