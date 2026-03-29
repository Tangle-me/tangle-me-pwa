<?php
/**
 * Tangle-me Bulk Upload — Configuration
 * =======================================
 * Set CLAUDE_API_KEY as a server environment variable in Hostinger:
 *   hPanel → Advanced → PHP Config → Environment Variables
 *   or add to your .htaccess: SetEnv CLAUDE_API_KEY sk-ant-xxxxx
 */

// ── Claude API ─────────────────────────────────────────────────────────────────
define('CLAUDE_API_KEY',    getenv('CLAUDE_API_KEY') ?: getenv('CLAUDE_API_KEY'));
define('CLAUDE_MODEL',      'claude-haiku-4-5-20251001');  // ~$0.004 per bulk upload
define('CLAUDE_MAX_TOKENS', 2000);

// ── Upload limits ──────────────────────────────────────────────────────────────
define('MAX_UPLOAD_BYTES',     100 * 1024 * 1024);  // 100MB ZIP
define('MAX_IMAGE_BYTES',       10 * 1024 * 1024);  // 10MB per photo
define('MAX_IMAGES_PER_AD',    20);
define('MAX_ROWS_PER_IMPORT',  500);
define('MAX_UNZIPPED_BYTES',   200 * 1024 * 1024);  // ZIP bomb protection

// ── Allowed file types ─────────────────────────────────────────────────────────
define('ALLOWED_DATA_EXT',    ['csv', 'txt', 'json', 'xlsx', 'xls']);
define('ALLOWED_IMAGE_EXT',   ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif']);
define('ALLOWED_IMAGE_MIMES', ['image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif']);

// ── Paths  (adjust to match your server layout) ────────────────────────────────
define('TEMP_DIR',   sys_get_temp_dir() . '/tangle_bulk/');
define('PHOTOS_DIR', __DIR__ . '/../uploads/photos/');   // physical path
define('PHOTOS_URL', '/uploads/photos/');                // public URL prefix

// ── Tangle-me canonical schema ─────────────────────────────────────────────────
define('TANGLE_SCHEMA', [
    'title'         => 'Ad headline / title',
    'description'   => 'Full ad description text',
    'category'      => 'Vehicles | Real Estate | Services | General',
    'subcategory'   => 'e.g. Sedan, SUV, Apartment, House',
    'price'         => 'Numeric price — no currency symbols',
    'currency'      => 'ISO code: ZAR, USD, EUR, GBP etc.',
    'condition'     => 'New | Used | Refurbished',
    'make'          => 'Vehicle brand / manufacturer',
    'model'         => 'Vehicle model name',
    'year'          => '4-digit year of manufacture',
    'mileage_km'    => 'Odometer reading in kilometres',
    'fuel_type'     => 'Petrol | Diesel | Electric | Hybrid',
    'transmission'  => 'Manual | Automatic | Semi-automatic',
    'color'         => 'Exterior colour',
    'doors'         => 'Number of doors',
    'engine_cc'     => 'Engine displacement in cc',
    'bedrooms'      => 'Number of bedrooms',
    'bathrooms'     => 'Number of bathrooms',
    'size_sqm'      => 'Floor area in square metres',
    'property_type' => 'House | Apartment | Townhouse | Land etc.',
    'erf_size_sqm'  => 'Plot / stand size in square metres',
    'city'          => 'City name',
    'province'      => 'Province or state',
    'country'       => 'Country name or ISO code',
    'address'       => 'Street address',
    'latitude'      => 'GPS latitude (decimal)',
    'longitude'     => 'GPS longitude (decimal)',
    'seller_name'   => 'Seller or dealer name',
    'seller_phone'  => 'Contact phone number',
    'seller_email'  => 'Contact email address',
    'seller_type'   => 'Private | Dealer | Agent',
    'reference_no'  => 'Original listing ID from source platform',
    'photos'        => 'Photo filenames or URLs pipe-separated',
    'is_demo'       => '1 for demo/test data, 0 for real',
]);

// ── Database ───────────────────────────────────────────────────────────────────
function getDbConnection() {
    static $pdo_instance = null;
    if ($pdo_instance !== null) return $pdo_instance;
    try {
        $host = 'localhost';
        $name = 'u143213086_tangleme';
        $user = 'u143213086_tangleme';
        $pass = 'fake.name.forever@3eLNma';
        $pdo_instance = new PDO(
            "mysql:host=$host;dbname=$name;charset=utf8mb4",
            $user,
            $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    } catch (PDOException $e) {
        error_log('[tangle_bulk] DB failed: ' . $e->getMessage());
        http_response_code(500);
        die(json_encode(['success' => false, 'error' => 'Database connection failed']));
    }
    return $pdo_instance;
}

if (!is_dir(TEMP_DIR)) {
    mkdir(TEMP_DIR, 0755, true);
}
