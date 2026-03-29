<?php
/**
 * webhook.php — BUILD 022 FIX
 * Correctly reads current_period_end from Stripe events so subscription_expires_at
 * is set 30 days in the future, not the same day as creation.
 */

// Inline DB credentials — no config.php dependency
$db_host = 'localhost';
$db_name = 'u143213086_tangleme';
$db_user = 'u143213086_tangleme';
$db_pass = 'fake.name.forever@3eLNma';

$webhook_secret = 'whsec_2NHGT4lKNLOwe3c72lBsEJwGuK1qQP4Y';

// Read raw payload
$payload   = file_get_contents('php://input');
$sig       = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Verify Stripe signature
function verifyStripeSignature($payload, $sig, $secret) {
    $parts = [];
    foreach (explode(',', $sig) as $part) {
        [$k, $v] = explode('=', $part, 2);
        $parts[$k][] = $v;
    }
    $timestamp = $parts['t'][0] ?? 0;
    $signed    = $timestamp . '.' . $payload;
    $expected  = hash_hmac('sha256', $signed, $secret);
    $tolerance = 300; // 5 minutes

    if (abs(time() - $timestamp) > $tolerance) return false;
    foreach ($parts['v1'] as $v) {
        if (hash_equals($expected, $v)) return true;
    }
    return false;
}

if (!verifyStripeSignature($payload, $sig, $webhook_secret)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$event = json_decode($payload, true);
$type  = $event['type'] ?? '';

error_log("[Tangle-me Webhook] Event: $type");

// ── DB connection ────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user, $db_pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    error_log("[Tangle-me Webhook] DB error: " . $e->getMessage());
    exit;
}

// ── Helper: update user subscription ────────────────────────────────
function updateUser($pdo, $customerId, $tier, $status, $subscriptionId, $expiresAt) {
    $stmt = $pdo->prepare("
        UPDATE users SET
            subscription_tier        = ?,
            subscription_status      = ?,
            stripe_subscription_id   = ?,
            subscription_expires_at  = ?
        WHERE stripe_customer_id = ?
    ");
    $rows = $stmt->execute([$tier, $status, $subscriptionId, $expiresAt, $customerId]);
    error_log("[Tangle-me Webhook] Updated customer $customerId → tier=$tier status=$status expires=$expiresAt rows=$rows");
    return $rows;
}

// ── Event handlers ───────────────────────────────────────────────────
switch ($type) {

    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'invoice.payment_succeeded': {

        // Get subscription object
        $obj = $event['data']['object'];

        // For checkout.session, fetch the subscription details from sub object
        $customerId     = $obj['customer'] ?? null;
        $subscriptionId = $obj['subscription'] ?? $obj['id'] ?? null;

        // current_period_end is on the subscription object for sub events,
        // or on the line item for invoice events
        $periodEnd = null;

        if (isset($obj['current_period_end'])) {
            // subscription created/updated — this is the correct field
            $periodEnd = $obj['current_period_end'];
        } elseif (isset($obj['lines']['data'][0]['period']['end'])) {
            // invoice — read from line item
            $periodEnd = $obj['lines']['data'][0]['period']['end'];
        }

        // Determine tier from price ID
        $priceId = null;
        if (isset($obj['items']['data'][0]['price']['id'])) {
            $priceId = $obj['items']['data'][0]['price']['id'];
        } elseif (isset($obj['lines']['data'][0]['price']['id'])) {
            $priceId = $obj['lines']['data'][0]['price']['id'];
        }

        // For checkout.session.completed — customer_id is on the session object
        // subscription details come from the sub, not the session
        // So fall back to 30 days if we can't read period end
        if (!$periodEnd) {
            $periodEnd = time() + (30 * 24 * 3600); // 30 days from now
            error_log("[Tangle-me Webhook] WARNING: could not read current_period_end, defaulting to 30 days");
        }

        $expiresAt = date('Y-m-d H:i:s', $periodEnd);

        // Map price ID → tier
        $basicPriceId = 'price_1T3GmQBmTXv1INEtwlqZdeJx';
        $proPriceId   = 'price_1T3GttBmTXv1INEtxW7oIkNj';

        if ($priceId === $basicPriceId) {
            $tier = 'basic';
        } elseif ($priceId === $proPriceId) {
            $tier = 'pro';
        } else {
            // Unknown price — default to pro (paid something)
            $tier = 'pro';
            error_log("[Tangle-me Webhook] Unknown price ID: $priceId — defaulting to pro");
        }

        if ($customerId) {
            updateUser($pdo, $customerId, $tier, 'active', $subscriptionId, $expiresAt);
        }
        break;
    }

    case 'customer.subscription.deleted': {
        $obj        = $event['data']['object'];
        $customerId = $obj['customer'] ?? null;
        $subId      = $obj['id'] ?? null;
        if ($customerId) {
            updateUser($pdo, $customerId, 'free', 'cancelled', $subId, null);
        }
        break;
    }

    case 'invoice.payment_failed': {
        $obj        = $event['data']['object'];
        $customerId = $obj['customer'] ?? null;
        $subId      = $obj['subscription'] ?? null;
        if ($customerId) {
            // Don't downgrade immediately — just mark past_due
            $stmt = $pdo->prepare("
                UPDATE users SET subscription_status = 'past_due'
                WHERE stripe_customer_id = ?
            ");
            $stmt->execute([$customerId]);
        }
        break;
    }
}

http_response_code(200);
echo json_encode(['received' => true]);
