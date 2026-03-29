<?php
/**
 * TANGLE-ME API — Send Email Verification Code
 * Build 016
 * 
 * POST /api/send-verification.php
 * Body: { "email": "user@example.com", "user_id": 123 }
 * 
 * Sends a 6-digit verification code via email.
 * Code expires in 15 minutes. Max 5 attempts per hour.
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

// Rate limiting
session_start();
$rateLimitKey = 'verify_email_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$now = time();

if (!isset($_SESSION[$rateLimitKey])) {
    $_SESSION[$rateLimitKey] = ['count' => 0, 'window_start' => $now];
}

if ($now - $_SESSION[$rateLimitKey]['window_start'] > 3600) {
    $_SESSION[$rateLimitKey] = ['count' => 0, 'window_start' => $now];
}

if ($_SESSION[$rateLimitKey]['count'] >= 5) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many verification requests. Try again in an hour.']);
    exit();
}

// Parse input
$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
$userId = isset($input['user_id']) ? intval($input['user_id']) : 0;

if (empty($email) || $userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and user_id required']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit();
}

try {
    // Verify the user exists and email matches
    $stmt = $pdo->prepare('SELECT id, email, email_verified, username FROM users WHERE id = ? AND email = ?');
    $stmt->execute([$userId, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit();
    }

    if ($user['email_verified'] == 1) {
        echo json_encode(['success' => true, 'message' => 'Email already verified', 'already_verified' => true]);
        exit();
    }

    // Generate 6-digit code
    $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Store code in database
    $stmt = $pdo->prepare('
        UPDATE users 
        SET verification_code = ?, verification_expires = ?, verification_attempts = 0
        WHERE id = ?
    ');
    $stmt->execute([$code, $expiresAt, $userId]);

    // Send email
    $username = $user['username'];
    $subject = "Tangle-me — Verify your email";
    $htmlBody = "
    <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;'>
        <div style='text-align: center; padding: 20px 0;'>
            <h1 style='color: #7C3AED; margin: 0; font-size: 28px;'>tangle-me</h1>
            <p style='color: #6B7280; margin: 5px 0 0;'>Global Classifieds</p>
        </div>
        <div style='background: #F9FAFB; border-radius: 12px; padding: 30px; text-align: center;'>
            <p style='color: #374151; font-size: 16px; margin: 0 0 10px;'>Hi <strong>{$username}</strong>,</p>
            <p style='color: #6B7280; font-size: 14px; margin: 0 0 25px;'>Enter this code in the app to verify your email:</p>
            <div style='background: #FFFFFF; border: 2px solid #7C3AED; border-radius: 8px; padding: 15px; display: inline-block;'>
                <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7C3AED;'>{$code}</span>
            </div>
            <p style='color: #9CA3AF; font-size: 12px; margin: 20px 0 0;'>This code expires in 15 minutes.</p>
            <p style='color: #9CA3AF; font-size: 12px; margin: 5px 0 0;'>If you didn't create a Tangle-me account, ignore this email.</p>
        </div>
        <p style='color: #D1D5DB; font-size: 11px; text-align: center; margin-top: 20px;'>&copy; " . date('Y') . " Tangle-me. All rights reserved.</p>
    </div>";

    $textBody = "Your Tangle-me verification code is: {$code}\nThis code expires in 15 minutes.\nIf you didn't create a Tangle-me account, ignore this email.";

    // Build email headers
    $boundary = md5(time());
    $headers = "From: Tangle-me <noreply@tangle-me.com>\r\n";
    $headers .= "Reply-To: noreply@tangle-me.com\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $body = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $body .= $textBody . "\r\n\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $body .= $htmlBody . "\r\n\r\n";
    $body .= "--{$boundary}--";

    $sent = mail($email, $subject, $body, $headers);

    if (!$sent) {
        // Fallback: try simpler email
        $simpleHeaders = "From: noreply@tangle-me.com\r\nContent-Type: text/html; charset=UTF-8\r\n";
        $sent = mail($email, $subject, $htmlBody, $simpleHeaders);
    }

    $_SESSION[$rateLimitKey]['count']++;

    if ($sent) {
        // Mask email for display: j***@gmail.com
        $parts = explode('@', $email);
        $maskedEmail = substr($parts[0], 0, 1) . '***@' . $parts[1];

        echo json_encode([
            'success' => true,
            'message' => 'Verification code sent',
            'masked_email' => $maskedEmail,
            'expires_in' => 900
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to send email. Please try again.']);
    }

} catch (PDOException $e) {
    error_log("Send verification error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>
