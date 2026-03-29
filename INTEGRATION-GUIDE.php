<?php
/**
 * ============================================================
 * INTEGRATION GUIDE: How to add security to existing endpoints
 * ============================================================
 * 
 * This file shows the pattern for updating each PHP endpoint.
 * You do NOT upload this file — it's a reference guide.
 * 
 * STEP 1: Copy the /api/middleware/ folder to your server
 * STEP 2: Run schema-changelog.sql in phpMyAdmin
 * STEP 3: Update each endpoint as shown below
 */

// ============================================================
// EXAMPLE: login.php (auth endpoint with rate limiting)
// ============================================================

/*
--- ADD these lines at the TOP of login.php: ---

require_once __DIR__ . '/middleware/auth.php';

// Rate limit: 5 login attempts per IP per 15 minutes
checkRateLimit($pdo, 'login', 5, 900);

// Record the attempt (even before checking password)
recordRateLimitAttempt($pdo, 'login');

// Require POST method
requirePost();

--- Then at the END, use standardized response: ---

// On success:
logApiRequest($pdo, '/api/login.php', 'login_success');
jsonResponse(true, ['user_id' => $userId, 'username' => $username]);

// On failure:
logApiRequest($pdo, '/api/login.php', 'login_failed');
jsonResponse(false, null, 'Invalid credentials', 401);
*/


// ============================================================
// EXAMPLE: register.php (rate limited + CSRF)
// ============================================================

/*
--- ADD at TOP: ---

require_once __DIR__ . '/middleware/auth.php';
requirePost();
checkRateLimit($pdo, 'register', 3, 900);  // 3 registrations per IP per 15 min
recordRateLimitAttempt($pdo, 'register');

// Validate & sanitize inputs
$username = sanitizeString($_POST['username'] ?? '', 50);
$email = $_POST['email'] ?? '';
if (!validateEmail($email)) {
    jsonResponse(false, null, 'Invalid email address', 400);
}
*/


// ============================================================
// EXAMPLE: post-ad.php (requires auth + CSRF)
// ============================================================

/*
--- ADD at TOP: ---

require_once __DIR__ . '/middleware/auth.php';
requirePost();
requireAuth();       // Must be logged in
requireCsrf();       // Validate CSRF token

// Sanitize inputs
$title = sanitizeString($_POST['title'] ?? '', 200);
$description = sanitizeString($_POST['description'] ?? '', 5000);
$lat = $_POST['latitude'] ?? null;
$lng = $_POST['longitude'] ?? null;

if (!validateNumeric($lat, -90, 90) || !validateNumeric($lng, -180, 180)) {
    jsonResponse(false, null, 'Invalid coordinates', 400);
}
*/


// ============================================================
// EXAMPLE: forgot-password.php (rate limited, no auth needed)
// ============================================================

/*
--- ADD at TOP: ---

require_once __DIR__ . '/middleware/auth.php';
requirePost();
checkRateLimit($pdo, 'reset', 3, 900);  // 3 reset requests per IP per 15 min
recordRateLimitAttempt($pdo, 'reset');

$email = $_POST['email'] ?? '';
if (!validateEmail($email)) {
    jsonResponse(false, null, 'Invalid email address', 400);
}
*/


// ============================================================
// EXAMPLE: send-message.php (auth + rate limit + CSRF)
// ============================================================

/*
--- ADD at TOP: ---

require_once __DIR__ . '/middleware/auth.php';
requirePost();
requireAuth();
requireCsrf();
checkRateLimit($pdo, 'message', 30, 300);  // 30 messages per 5 min
recordRateLimitAttempt($pdo, 'message');
*/


// ============================================================
// EXAMPLE: search-ad.php (public, no auth, no CSRF needed)
// ============================================================

/*
--- ADD at TOP: ---

require_once __DIR__ . '/middleware/auth.php';
// No requireAuth() — search is public
// No requireCsrf() — GET requests don't need CSRF

// Sanitize search inputs
$query = sanitizeString($_GET['q'] ?? '', 200);
$lat = $_GET['lat'] ?? null;
$lng = $_GET['lng'] ?? null;
*/


// ============================================================
// ENDPOINT CHEAT SHEET: Which protections each endpoint needs
// ============================================================

/*
RATE LIMITED (auth endpoints):
  /api/login.php              — 5 per 15 min
  /api/register.php           — 3 per 15 min
  /api/forgot-password.php    — 3 per 15 min
  /api/reset-password.php     — 5 per 15 min
  /api/send-verification.php  — 3 per 15 min

REQUIRE AUTH + CSRF (state-changing, logged-in):
  /api/post-ad.php
  /api/update-ad.php
  /api/delete-ad.php
  /api/delete-photo.php
  /api/upload-photo.php
  /api/send-message.php
  /api/delete-messages.php
  /api/save-tangle.php
  /api/remove-tangle-ad.php
  /api/update-tangle-note.php
  /api/report-ad.php
  /api/renew-ad.php
  /api/deactivate.php
  /api/save-push-subscription.php
  /api/translate-ad.php
  /tangle-bulk/bulk_upload.php

REQUIRE AUTH (read-only, logged-in):
  /api/get-my-ads.php
  /api/get-messages.php
  /api/get-message-count.php
  /api/get-saved-tangles.php
  /api/get-tangle-ads.php
  /api/get-photo-count.php
  /api/check-session.php
  /api/restore-session.php
  /api/stripe/create-checkout.php
  /api/stripe/customer-portal.php

PUBLIC (no auth needed):
  /api/search-ad.php
  /api/get-ads.php
  /api/get-ads-paginated.php
  /api/get-ad.php
  /api/geocode.php
  /api/placeholder-image.php
  /ad.php
*/
