<?php
/**
 * Tangle-me Build 022 - Forgot Password API (FIXED)
 * Endpoint: /api/forgot-password.php
 *
 * KEY FIX: Inline DB connection - no database.php dependency
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

    // DATABASE - inline, same pattern as register.php
    $pdo = new PDO(
        "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
        "u143213086_tangleme",
        "fake.name.forever@3eLNma",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // INPUT
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Valid email required.']);
        exit;
    }

    // 1. Check user exists
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'No account found with this email. Please register first.']);
        exit;
    }

    // 2. Rate limit: max 5 per hour
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM password_resets WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $stmt->execute([$email]);
    $rate = $stmt->fetch(PDO::FETCH_ASSOC);

    if ((int)$rate['cnt'] >= 5) {
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Too many reset attempts. Please try again in 1 hour.']);
        exit;
    }

    // 3. Generate code and store
    $code      = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
    $stmt->execute([$email]);

    $stmt = $pdo->prepare("INSERT INTO password_resets (email, code, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, NOW())");
    $stmt->execute([$email, password_hash($code, PASSWORD_DEFAULT), $expiresAt]);

    // 4. Send email
    $username  = htmlspecialchars($user['username'], ENT_QUOTES, 'UTF-8');
    $safeCode  = htmlspecialchars($code, ENT_QUOTES, 'UTF-8');
    $fromEmail = 'noreply@tangle-me.com';
    $subject   = "Your Tangle-me Reset Code: $safeCode";

    $htmlBody = "<!DOCTYPE html>
<html><head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#f7fafc;font-family:Arial,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#f7fafc;padding:40px 0;'>
<tr><td align='center'>
<table width='500' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);'>
<tr><td style='background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;'>
<h1 style='color:#ffffff;margin:0;font-size:24px;'>Reset Your Password</h1>
</td></tr>
<tr><td style='padding:32px;'>
<p style='color:#2d3748;font-size:16px;margin:0 0 16px;'>Hi <strong>$username</strong>,</p>
<p style='color:#4a5568;font-size:15px;margin:0 0 24px;'>Your 6-digit reset code expires in <strong>15 minutes</strong>.</p>
<div style='background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;'>
<p style='color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 8px;text-transform:uppercase;'>Your reset code</p>
<p style='color:#ffffff;font-size:36px;font-weight:700;letter-spacing:12px;font-family:Courier New,monospace;margin:0;'>$safeCode</p>
</div>
<p style='color:#718096;font-size:14px;margin:0 0 8px;'>Your Tangle ID: <strong style='font-family:Courier New,monospace;color:#2d3748;'>$username</strong></p>
<p style='color:#a0aec0;font-size:13px;margin:24px 0 0;'>If you did not request this, ignore this email.</p>
</td></tr>
<tr><td style='background:#f7fafc;padding:16px 32px;text-align:center;'>
<p style='color:#a0aec0;font-size:12px;margin:0;'>The Tangle-me Team | tangle-me.com</p>
</td></tr>
</table></td></tr></table>
</body></html>";

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Tangle-me <{$fromEmail}>\r\n";
    $headers .= "Reply-To: {$fromEmail}\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    ob_end_clean();

    $mailSent = @mail($email, $subject, $htmlBody, $headers);

    if (!$mailSent) {
        error_log("[TM] forgot-password: mail() failed for $email");
        echo json_encode(['success' => false, 'error' => 'Email could not be sent. Please try again.']);
        exit;
    }

    error_log("[TM] forgot-password: code sent to $email");
    echo json_encode(['success' => true, 'message' => 'Reset code sent. Check your inbox and spam folder.']);

} catch (Throwable $e) {
    ob_end_clean();
    error_log("[TM] forgot-password CRASH: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error. Please try again.']);
}
