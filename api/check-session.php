<?php
/**
 * Tangle-me Build 022 - Check Session API
 * Endpoint: /api/check-session.php
 */

ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

try {
    if (!empty($_SESSION['user_id'])) {

        $pdo = new PDO(
            "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
            "u143213086_tangleme",
            "fake.name.forever@3eLNma",
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        // BUILD 022 FIX: Read subscription_tier directly from users table
        // Previous code queried a 'subscriptions' table that does not exist,
        // causing every user to show as 'free' even after a successful payment.
        $stmt = $pdo->prepare("SELECT id, email, username, country_code, created_at, subscription_tier, subscription_status FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $tier = $user['subscription_tier'] ?? 'free';
            if (empty($tier)) $tier = 'free';

            ob_end_clean();
            echo json_encode([
                'loggedIn' => true,
                'user'     => [
                    'id'           => (int)$user['id'],
                    'email'        => $user['email'],
                    'username'     => $user['username'],
                    'country'      => $user['country_code'],
                    'tier'         => $tier,
                    'member_since' => $user['created_at']
                ]
            ]);
            exit;
        }
    }

    ob_end_clean();
    echo json_encode(['loggedIn' => false]);

} catch (Throwable $e) {
    ob_end_clean();
    error_log('[TM] check-session CRASH: ' . $e->getMessage());
    echo json_encode(['loggedIn' => false]);
}
