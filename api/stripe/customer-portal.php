<?php
/**
 * STRIPE CUSTOMER PORTAL
 * 
 * Creates a session to Stripe's Customer Portal
 * Allows users to manage their subscription (cancel, update payment, etc.)
 * 
 * POST /api/stripe/customer-portal.php
 * Body: { "user_id": 123 }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once 'stripe-config.php';
require_once '../config.php';

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['user_id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

try {
    // Using config.php variable names
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get user's Stripe customer ID
    $stmt = $pdo->prepare("SELECT stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !$user['stripe_customer_id']) {
        http_response_code(400);
        echo json_encode(['error' => 'No active subscription found']);
        exit;
    }
    
    // Create billing portal session
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/billing_portal/sessions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . STRIPE_SECRET_KEY,
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'customer' => $user['stripe_customer_id'],
        'return_url' => APP_URL . '/?portal=return'
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $portalSession = json_decode($response, true);
    
    if (isset($portalSession['error'])) {
        throw new Exception($portalSession['error']['message']);
    }
    
    echo json_encode([
        'success' => true,
        'portal_url' => $portalSession['url']
    ]);
    
} catch (Exception $e) {
    error_log('Customer portal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create portal session']);
}
?>
