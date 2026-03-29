<?php
/**
 * Tangle-me Build 022 - Reset Password API (FIXED v2)
 * Endpoint: /api/reset-password.php
 *
 * FIXES:
 * 1. Inline DB connection - no database.php dependency
 * 2. Removed status='active' from UPDATE - column doesn't exist in users table
 * 3. ob_start() + global Throwable catch - always returns valid JSON
 * 4. Uses password_hash column (matches register.php)
 */

ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        ob_end_clean();
        http_response_code(200);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    // DATABASE - inline, same as register.php
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
        "u143213086_tangleme",
        "fake.name.forever@3eLNma",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // INPUT
    $input       = json_decode(file_get_contents('php://input'), true);
    $email       = trim($input['email'] ?? '');
    $code        = trim($input['code'] ?? '');
    $newPassword = $input['new_password'] ?? '';

    if (empty($email) || empty($code) || empty($newPassword)) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'All fields are required.']);
        exit;
    }

    if (strlen($code) !== 6 || !ctype_digit($code)) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Invalid reset code format.']);
        exit;
    }

    if (strlen($newPassword) < 6) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters.']);
        exit;
    }

    // 1. Find reset record
    $stmt = $pdo->prepare("SELECT id, code, expires_at, attempts FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'No reset code found. Please request a new one.']);
        exit;
    }

    // 2. Check attempts (max 5)
    if ((int)$reset['attempts'] >= 5) {
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Too many failed attempts. Please request a new code.']);
        exit;
    }

    // 3. Check expiry
    if (strtotime($reset['expires_at']) < time()) {
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Code has expired. Please request a new one.']);
        exit;
    }

    // 4. Verify code against bcrypt hash
    if (!password_verify($code, $reset['code'])) {
        $pdo->prepare("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?")->execute([$reset['id']]);
        $remaining = 5 - ((int)$reset['attempts'] + 1);
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => "Invalid code. $remaining attempts remaining."]);
        exit;
    }

    // 5. Update password — password_hash column, NO status column
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $email]);

    // 6. Get username for success screen
    $stmt = $pdo->prepare("SELECT username FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 7. Clean up all reset codes for this email
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    ob_end_clean();
    error_log("[TM] reset-password: password updated successfully for $email");
    echo json_encode([
        'success'  => true,
        'message'  => 'Password reset successfully.',
        'username' => $user['username'] ?? null
    ]);

} catch (Throwable $e) {
    ob_end_clean();
    error_log("[TM] reset-password CRASH: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error. Please try again.']);
}
