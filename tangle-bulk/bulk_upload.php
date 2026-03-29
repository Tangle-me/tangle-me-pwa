<?php
/**
 * bulk_upload.php  —  Tangle-me Universal Bulk Upload Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Single endpoint for all bulk import actions.
 *
 * POST bulk_file + action=preview   → analyse file, return preview JSON
 * POST temp_token + action=confirm  → write rows + photos to database
 * POST temp_token + action=cancel   → clean up temp files
 *
 * Accepts: ZIP (with photos), CSV, XLSX, TXT, JSON, direct images
 * Auto-maps ANY column schema using Claude API (Haiku ~ $0.004/upload)
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ClaudeMapper.php';
require_once __DIR__ . '/FileProcessor.php';
require_once __DIR__ . '/AdImporter.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { fail('Method not allowed', 405); }

session_start();

// ── Session fallback: if PHP session cookie is missing (e.g. PWA cross-origin),
//    accept user_id posted from JS and verify it against the DB ────────────────
if (empty($_SESSION['user_id']) && !empty($_POST['user_id'])) {
    $posted_id = intval($_POST['user_id']);
    if ($posted_id > 0) {
        try {
            $pdo_check = getDbConnection();
            $stmt = $pdo_check->prepare(
                "SELECT id, username FROM users WHERE id = ? AND active = 1 LIMIT 1"
            );
            $stmt->execute([$posted_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $_SESSION['user_id']  = (int)    $row['id'];
                $_SESSION['username'] = (string) ($row['username'] ?? 'unknown');
            }
        } catch (Throwable $e) {
            error_log('[bulk_upload] Session fallback DB error: ' . $e->getMessage());
        }
    }
}

if (empty($_SESSION['user_id'])) fail('Not authenticated', 401);

$userId   = (int)    $_SESSION['user_id'];
$username = (string) ($_SESSION['username'] ?? 'unknown');
$action   = (string) ($_POST['action']      ?? 'preview');

// ─────────────────────────────────────────────────────────────────────────────
try {
    $pdo = getDbConnection();

    // ── PREVIEW ───────────────────────────────────────────────────────────────
    if ($action === 'preview') {

        if (empty($_FILES['bulk_file'])) fail('No file uploaded. Use field name: bulk_file');
        $file = $_FILES['bulk_file'];
        if ($file['error'] !== UPLOAD_ERR_OK)    fail('Upload error code: ' . $file['error']);
        if ($file['size']  > MAX_UPLOAD_BYTES)   fail('File too large. Max ' . (MAX_UPLOAD_BYTES/1024/1024) . 'MB');

        $processor = new FileProcessor($file);
        $extracted = $processor->extract();

        $dataFile  = $extracted['data_file'];
        $images    = $extracted['images'];
        $token     = $extracted['temp_token'];

        if ($dataFile === null && empty($images)) {
            fail('No recognisable data or images found in the uploaded file.');
        }

        $result = [
            'status'          => 'preview',
            'temp_token'      => $token,
            'total_rows'      => 0,
            'total_images'    => count($images),
            'source_platform' => null,
            'mapping'         => null,
            'preview_rows'    => [],
            'warnings'        => [],
        ];

        if ($dataFile !== null) {
            $rawRows   = $processor->parseDataFile($dataFile);
            $mapper    = new ClaudeMapper(CLAUDE_API_KEY);
            $mapResult = $mapper->mapSchema($rawRows, count($images));

            $result['total_rows']      = count($rawRows);
            $result['source_platform'] = $mapResult['detected_platform'];
            $result['mapping']         = $mapResult['mapping'];
            $result['preview_rows']    = $mapResult['preview_rows'];
            $result['warnings']        = $mapResult['warnings'];
        }

        // Stash data in session for the confirm step
        $_SESSION['bulk_import'][$token] = [
            'data_file'  => $dataFile,
            'images'     => $images,
            'mapping'    => $result['mapping'],
            'created_at' => time(),
        ];

        ok([
            'status'          => 'preview',
            'temp_token'      => $token,
            'ads'             => $result['preview_rows'],
            'total_rows'      => $result['total_rows'],
            'total_images'    => $result['total_images'],
            'source_platform' => $result['source_platform'],
            'mapping'         => $result['mapping'],
            'preview_rows'    => $result['preview_rows'],
            'warnings'        => $result['warnings'],
        ]);

    // ── CONFIRM ───────────────────────────────────────────────────────────────
    } elseif ($action === 'confirm') {

        $token    = (string) ($_POST['temp_token'] ?? '');
        $override = !empty($_POST['mapping']) ? json_decode($_POST['mapping'], true) : null;

        if (empty($token) || empty($_SESSION['bulk_import'][$token])) {
            fail('Invalid or expired import session. Please re-upload.');
        }

        $sess = $_SESSION['bulk_import'][$token];
        if (time() - $sess['created_at'] > 1800) {
            unset($_SESSION['bulk_import'][$token]);
            fail('Session expired (30 min). Please re-upload.');
        }

        // Get location + user data from POST (sent by frontend)
        $locLat     = !empty($_POST['location_lat'])     ? (float)$_POST['location_lat']  : null;
        $locLng     = !empty($_POST['location_lng'])     ? (float)$_POST['location_lng']  : null;
        $locAddress = (string) ($_POST['location_address'] ?? '');
        $postUsername    = (string) ($_POST['username']      ?? $username);
        $postCountryCode = (string) ($_POST['country_code']  ?? '');
        $postCountryName = (string) ($_POST['country_name']  ?? '');
        $postCountryFlag = (string) ($_POST['country_flag']  ?? '');

        // Use posted username if available, otherwise session username
        $finalUsername = !empty($postUsername) ? $postUsername : $username;

        $mapping  = $override ?? $sess['mapping'];

        // Re-parse the data file
        $dummyFile = ['tmp_name' => '', 'name' => 'dummy.txt'];
        $processor = new FileProcessor($dummyFile);
        $rawRows   = $processor->parseDataFile($sess['data_file']);

        // Create importer with full user + location context
        $importer = new AdImporter(
            $pdo, $userId, $finalUsername,
            $postCountryCode, $postCountryName, $postCountryFlag,
            $locLat, $locLng, $locAddress
        );

        $importResult = $importer->importRows($rawRows, $mapping, $sess['images']);

        // Clean up temp files
        $processor->cleanup($sess['data_file'], $sess['images']);
        unset($_SESSION['bulk_import'][$token]);

        ok([
            'status'       => 'imported',
            'created'      => $importResult['created'],
            'ads'          => $importResult['created'],
            'ads_created'  => $importResult['created'],
            'ads_skipped'  => $importResult['skipped'],
            'photos_saved' => $importResult['photos'],
            'errors'       => $importResult['errors'],
        ]);

    // ── CANCEL ────────────────────────────────────────────────────────────────
    } elseif ($action === 'cancel') {

        $token = (string) ($_POST['temp_token'] ?? '');
        if (!empty($token) && !empty($_SESSION['bulk_import'][$token])) {
            $sess = $_SESSION['bulk_import'][$token];
            $file = ['tmp_name' => '', 'name' => ''];
            (new FileProcessor($file))->cleanup($sess['data_file'], $sess['images']);
            unset($_SESSION['bulk_import'][$token]);
        }
        ok(['status' => 'cancelled']);

    } else {
        fail('Unknown action: ' . $action);
    }

} catch (Throwable $e) {
    error_log('[bulk_upload] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    fail($e->getMessage(), 500);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ok(array $data): void
{
    echo json_encode(['success' => true] + $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(string $msg, int $code = 400): void
{
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg], JSON_PRETTY_PRINT);
    exit;
}
