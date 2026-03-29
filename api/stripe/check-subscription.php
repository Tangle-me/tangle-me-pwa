<?php
/**
 * check-subscription.php — BUILD 022 REWRITE
 * Reads subscription status from the USERS table (source of truth).
 * The webhook writes to users.subscription_tier — so this is authoritative.
 * Previous version queried a subscriptions table that may be empty/stale.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache, must-revalidate');

// ── DB credentials (inline — no config.php dependency) ──────────────
$db_host = 'localhost';
$db_name = 'u143213086_tangleme';
$db_user = 'u143213086_tangleme';
$db_pass = 'fake.name.forever@3eLNma';

// ── Input ────────────────────────────────────────────────────────────
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'user_id required']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user, $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Read directly from users table — webhook already set subscription_tier here
    $stmt = $pdo->prepare("
        SELECT 
            subscription_tier,
            subscription_status,
            subscription_expires_at,
            stripe_customer_id,
            stripe_subscription_id,
            photos_used
        FROM users
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    $tier   = $user['subscription_tier'] ?: 'free';
    $status = $user['subscription_status'] ?: 'inactive';
    $photos = intval($user['photos_used']);

    // Determine if subscription has expired
    $is_expired = false;
    if ($user['subscription_expires_at']) {
        $is_expired = strtotime($user['subscription_expires_at']) < time();
        // If it has expired, downgrade display tier to free
        if ($is_expired && $tier !== 'free') {
            $tier = 'free';
            $status = 'expired';
        }
    }

    // Photo limits
    $photo_limit = 0;
    if ($tier === 'basic') {
        $photo_limit = 20;
    } elseif ($tier === 'pro') {
        $photo_limit = 'unlimited';
    }

    echo json_encode([
        'success' => true,
        'subscription' => [
            'tier'         => $tier,
            'status'       => $status,
            'is_expired'   => $is_expired,
            'expires_at'   => $user['subscription_expires_at'],
            'photos_used'  => $photos,
            'photos_limit' => $photo_limit,
            'customer_id'  => $user['stripe_customer_id'],
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
