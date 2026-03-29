<?php
/**
 * CREATE STRIPE CHECKOUT SESSION
 * 
 * Creates a Stripe Checkout session for subscription purchase
 * Redirects user to Stripe's hosted checkout page
 * 
 * POST /api/stripe/create-checkout.php
 * Body: { "plan": "basic" | "pro", "user_id": 123 }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once 'stripe-config.php';

// ⚠️ BUILD 022 FIX: config.php does not exist on this server
// Inline DB credentials — same password as your other PHP files
$db_host = 'localhost';
$db_name = 'u143213086_tangleme';
$db_user = 'u143213086_tangleme';
$db_pass = 'fake.name.forever@3eLNma'; // ← REPLACE THIS before uploading

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

$plan = $input['plan'] ?? null;
$userId = $input['user_id'] ?? null;

// Validate inputs
if (!$plan || !in_array($plan, ['basic', 'pro'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plan. Must be "basic" or "pro"']);
    exit;
}

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

try {
    
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->prepare("SELECT id, email, username, stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Select price ID based on plan
    $priceId = ($plan === 'basic') ? STRIPE_BASIC_PRICE_ID : STRIPE_PRO_PRICE_ID;
    
    // Initialize Stripe (using curl since we don't have Composer)
    $stripeCustomerId = $user['stripe_customer_id'];
    
    // Create or retrieve Stripe customer
    if (!$stripeCustomerId) {
        // Create new Stripe customer
        $customerResponse = stripeRequest('POST', 'customers', [
            'email' => $user['email'],
            'name' => $user['username'],
            'metadata' => [
                'tangle_user_id' => $user['id'],
                'tangle_username' => $user['username']
            ]
        ]);
        
        if (isset($customerResponse['error'])) {
            throw new Exception('Failed to create Stripe customer: ' . $customerResponse['error']['message']);
        }
        
        $stripeCustomerId = $customerResponse['id'];
        
        // Save customer ID to database
        $updateStmt = $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
        $updateStmt->execute([$stripeCustomerId, $userId]);
    }
    
    // Create Checkout Session
    $sessionResponse = stripeRequest('POST', 'checkout/sessions', [
        'customer' => $stripeCustomerId,
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price' => $priceId,
            'quantity' => 1
        ]],
        'mode' => 'subscription',
        'success_url' => STRIPE_SUCCESS_URL . '&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => STRIPE_CANCEL_URL,
        'metadata' => [
            'tangle_user_id' => $user['id'],
            'tangle_plan' => $plan
        ],
        'subscription_data' => [
            'metadata' => [
                'tangle_user_id' => $user['id'],
                'tangle_plan' => $plan
            ]
        ]
    ]);
    
    if (isset($sessionResponse['error'])) {
        throw new Exception('Failed to create checkout session: ' . $sessionResponse['error']['message']);
    }
    
    // Return checkout URL
    echo json_encode([
        'success' => true,
        'checkout_url' => $sessionResponse['url'],
        'session_id' => $sessionResponse['id']
    ]);
    
} catch (Exception $e) {
    error_log('Stripe checkout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create checkout session']);
}

/**
 * Make a request to Stripe API
 */
function stripeRequest($method, $endpoint, $data = null) {
    $url = 'https://api.stripe.com/v1/' . $endpoint;
    
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . STRIPE_SECRET_KEY,
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query_nested($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        curl_close($ch);
        return ['error' => ['message' => curl_error($ch)]];
    }
    
    curl_close($ch);
    
    return json_decode($response, true);
}

/**
 * Build nested query string for Stripe API
 */
function http_build_query_nested($data, $prefix = '') {
    $result = [];
    
    foreach ($data as $key => $value) {
        $newKey = $prefix ? "{$prefix}[{$key}]" : $key;
        
        if (is_array($value)) {
            $result[] = http_build_query_nested($value, $newKey);
        } else {
            $result[] = urlencode($newKey) . '=' . urlencode($value);
        }
    }
    
    return implode('&', $result);
}
?>
