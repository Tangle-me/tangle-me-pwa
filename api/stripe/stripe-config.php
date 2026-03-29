<?php
/**
 * TANGLE-ME STRIPE CONFIGURATION
 * Build 020 - February 2026
 * 
 * HOW TO GO LIVE:
 * 1. Fill in your live keys from https://dashboard.stripe.com/apikeys
 * 2. Fill in your live price IDs from https://dashboard.stripe.com/products
 * 3. Change STRIPE_MODE from 'test' to 'live'
 * 4. Upload this file to /api/stripe/stripe-config.php on Hostinger
 */

// ============================================
// STRIPE API KEYS
// ============================================

// TEST MODE (keep these — useful for future testing)
define('STRIPE_TEST_SECRET_KEY',      getenv('STRIPE_TEST_SECRET_KEY'));
define('STRIPE_TEST_PUBLISHABLE_KEY', 'pk_test_51SfhzPPlXgxlyudMgoo45LH5OZZAvpBrZPWwZk5cTELB9kZ8A7uz1SKO0RzB54hH8qq6ZJT0u8qdc1j8II7aKFeZ00uCxrZVhP');

// ⬇️ LIVE MODE — paste your keys from Stripe Dashboard → Developers → API Keys
define('STRIPE_LIVE_SECRET_KEY',      getenv('STRIPE_LIVE_SECRET_KEY'));
define('STRIPE_LIVE_PUBLISHABLE_KEY', 'pk_live_51SfhzABmTXv1INEtMR9xkL1vlVkNtzTUhpSiHgW9iq85tTTLzjXFBM9atXr1AMxxuxdReVTOAuJljaHR20n3AW2J00mLTAHMxF');

// ============================================
// ⚡ MODE SWITCH — change to 'live' when keys above are filled in
// ============================================
define('STRIPE_MODE', 'live'); // ← change this to 'live'

// Auto-select keys based on mode
if (STRIPE_MODE === 'live') {
    define('STRIPE_SECRET_KEY',      STRIPE_LIVE_SECRET_KEY);
    define('STRIPE_PUBLISHABLE_KEY', STRIPE_LIVE_PUBLISHABLE_KEY);
} else {
    define('STRIPE_SECRET_KEY',      STRIPE_TEST_SECRET_KEY);
    define('STRIPE_PUBLISHABLE_KEY', STRIPE_TEST_PUBLISHABLE_KEY);
}

// ============================================
// STRIPE PRICE IDs
// ============================================

// TEST MODE Price IDs (keep these)
define('STRIPE_TEST_BASIC_PRICE_ID', 'price_1SudHjPlXgxlyudMW6jr1DXH');
define('STRIPE_TEST_PRO_PRICE_ID',   'price_1SuddzPlXgxlyudMFb4VEWGr');

// ⬇️ LIVE MODE Price IDs — paste from Stripe Dashboard → Products
// Create two products: BASIC €2.99/month and PRO €9.99/month
// Then copy each price ID (starts with price_live_...)
define('STRIPE_LIVE_BASIC_PRICE_ID', 'price_1T3GmQBmTXv1INEtwlqZdeJx');
define('STRIPE_LIVE_PRO_PRICE_ID',   'price_1T3GttBmTXv1INEtxW7oIkNj');

// Auto-select price IDs based on mode
if (STRIPE_MODE === 'live') {
    define('STRIPE_BASIC_PRICE_ID', STRIPE_LIVE_BASIC_PRICE_ID);
    define('STRIPE_PRO_PRICE_ID',   STRIPE_LIVE_PRO_PRICE_ID);
} else {
    define('STRIPE_BASIC_PRICE_ID', STRIPE_TEST_BASIC_PRICE_ID);
    define('STRIPE_PRO_PRICE_ID',   STRIPE_TEST_PRO_PRICE_ID);
}

// ============================================
// WEBHOOK SECRET
// ⬇️ After going live, update this with your LIVE webhook secret
// Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret
// The test secret below works for test mode only
// ============================================
define('STRIPE_WEBHOOK_SECRET', 'whsec_2NHGT4lKNLOwe3c72lBsEJwGuK1qQP4Y');

// ============================================
// APPLICATION URLS
// ============================================
define('APP_URL',              'https://tangle-me.com');
define('STRIPE_SUCCESS_URL',   APP_URL . '/?payment=success');
define('STRIPE_CANCEL_URL',    APP_URL . '/?payment=cancelled');

// ============================================
// SUBSCRIPTION TIERS
// ============================================
define('TIER_FREE',  'free');
define('TIER_BASIC', 'basic');
define('TIER_PRO',   'pro');

define('BASIC_PHOTO_LIMIT', 20);
define('PRO_PHOTO_LIMIT',   999999);

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTierFromPriceId($priceId) {
    if ($priceId === STRIPE_BASIC_PRICE_ID) {
        return TIER_BASIC;
    } elseif ($priceId === STRIPE_PRO_PRICE_ID) {
        return TIER_PRO;
    }
    return TIER_FREE;
}

function getPhotoLimitForTier($tier) {
    switch ($tier) {
        case TIER_BASIC: return BASIC_PHOTO_LIMIT;
        case TIER_PRO:   return PRO_PHOTO_LIMIT;
        default:         return 0;
    }
}
?>
