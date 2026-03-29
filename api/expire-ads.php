<?php
/**
 * TANGLE-ME API — Ad Expiry Cron Job
 * Build 016
 * 
 * GET /api/expire-ads.php?cron_key=YOUR_SECRET_KEY
 * 
 * Call via Hostinger Cron Jobs: daily at 3:00 AM UTC
 * Cron command: wget -q -O /dev/null "https://tangle-me.com/api/expire-ads.php?cron_key=YOUR_SECRET_KEY"
 * 
 * EXPIRY POLICY (based on Craigslist/OLX/Gumtree global standards):
 * - Free ads:  30 days
 * - Basic tier: 60 days  (€2.99/mo subscribers)
 * - Pro tier:   90 days  (€9.99/mo subscribers)
 * - Users get email warning 3 days before expiry
 * - Expired ads are marked (not deleted) — user can renew from their dashboard
 */

// Security: only allow via cron key or CLI
$cronKey = 'CHANGE_THIS_TO_A_RANDOM_STRING_48_CHARS'; // Generate at: https://randomkeygen.com/

if (php_sapi_name() !== 'cli') {
    $providedKey = $_GET['cron_key'] ?? '';
    if ($providedKey !== $cronKey) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
}

header('Content-Type: application/json');

// Database connection
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log("Expire-ads DB error: " . $e->getMessage());
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

$stats = [
    'expired' => 0,
    'warnings_sent' => 0,
    'errors' => 0,
    'run_at' => date('Y-m-d H:i:s')
];

try {
    // ================================================================
    // STEP 1: Set expiry dates for any ads that don't have one yet
    // (catches ads posted before this feature was added)
    // ================================================================
    $stmt = $pdo->prepare("
        UPDATE ads a
        LEFT JOIN users u ON a.user_id = u.id
        SET a.expires_at = CASE
            WHEN u.subscription_tier = 'pro'   THEN DATE_ADD(a.created_at, INTERVAL 90 DAY)
            WHEN u.subscription_tier = 'basic'  THEN DATE_ADD(a.created_at, INTERVAL 60 DAY)
            ELSE DATE_ADD(a.created_at, INTERVAL 30 DAY)
        END
        WHERE a.expires_at IS NULL AND a.expired = 0
    ");
    $stmt->execute();
    $backfilled = $stmt->rowCount();

    // ================================================================
    // STEP 2: Mark expired ads
    // ================================================================
    $stmt = $pdo->prepare("
        UPDATE ads 
        SET expired = 1 
        WHERE expires_at <= NOW() AND expired = 0
    ");
    $stmt->execute();
    $stats['expired'] = $stmt->rowCount();

    // ================================================================
    // STEP 3: Send 3-day warning emails for ads about to expire
    // ================================================================
    $stmt = $pdo->prepare("
        SELECT a.id AS ad_id, a.keywords, a.expires_at, 
               u.email, u.username, u.email_verified
        FROM ads a
        JOIN users u ON a.user_id = u.id
        WHERE a.expired = 0 
          AND a.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
          AND u.email_verified = 1
          AND a.id NOT IN (
              SELECT DISTINCT ad_id FROM (
                  SELECT a2.id AS ad_id FROM ads a2 
                  WHERE a2.expired = 0 
                  -- Simple way to avoid re-sending: check a flag or just send daily
              ) AS warned
          )
        LIMIT 50
    ");
    $stmt->execute();
    $expiringAds = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($expiringAds as $ad) {
        $daysLeft = max(1, ceil((strtotime($ad['expires_at']) - time()) / 86400));
        $adPreview = substr($ad['keywords'] ?? 'Your ad', 0, 60);

        $subject = "Tangle-me — Your ad expires in {$daysLeft} day(s)";
        $htmlBody = "
        <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #7C3AED;'>tangle-me</h2>
            <p>Hi <strong>{$ad['username']}</strong>,</p>
            <p>Your ad <em>\"{$adPreview}\"</em> will expire in <strong>{$daysLeft} day(s)</strong>.</p>
            <p>To keep it live, open Tangle-me and tap <strong>Renew</strong> from your My Ads dashboard.</p>
            <p style='color: #9CA3AF; font-size: 12px; margin-top: 30px;'>
                If you no longer need this ad, no action is needed — it will be archived automatically.
            </p>
        </div>";

        $headers = "From: Tangle-me <noreply@tangle-me.com>\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

        if (mail($ad['email'], $subject, $htmlBody, $headers)) {
            $stats['warnings_sent']++;
        } else {
            $stats['errors']++;
        }
    }

    // ================================================================
    // STEP 4: Log results
    // ================================================================
    error_log("Ad expiry cron: " . json_encode($stats));
    echo json_encode(['success' => true, 'stats' => $stats, 'backfilled' => $backfilled]);

} catch (PDOException $e) {
    error_log("Expire-ads error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Expiry processing failed', 'stats' => $stats]);
}
?>
