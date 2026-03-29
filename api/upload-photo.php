<?php
/**
 * Tangle-me Photo Upload API
 * Build 023 Fix: inline DB credentials (removed require_once config.php)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

function logDebug($message) {
    error_log("[UPLOAD-PHOTO] " . date('Y-m-d H:i:s') . " - " . $message);
}

logDebug("=== NEW UPLOAD REQUEST ===");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'POST method required']); exit();
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    $errorCode = isset($_FILES['photo']) ? $_FILES['photo']['error'] : 'No file';
    $msgs = [
        UPLOAD_ERR_INI_SIZE  => 'File exceeds upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL   => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE   => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR=> 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE=> 'Failed to write file to disk',
    ];
    $msg = $msgs[$errorCode] ?? 'Unknown upload error';
    echo json_encode(['success' => false, 'error' => $msg]); exit();
}

$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$tier   = isset($_POST['tier'])    ? $_POST['tier']            : 'free';

if ($userId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid user ID']); exit();
}

$file         = $_FILES['photo'];
$originalName = $file['name'];
$tmpPath      = $file['tmp_name'];
$fileSize     = $file['size'];

// Validate image
$imageInfo = @getimagesize($tmpPath);
if ($imageInfo === false) {
    echo json_encode(['success' => false, 'error' => 'Cannot read image file']); exit();
}

$allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
if (!in_array($imageInfo[2], $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Unsupported image format. Use JPG, PNG, GIF or WebP']); exit();
}

if ($fileSize > 10 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'File too large. Maximum 10MB']); exit();
}

// Load source image
switch ($imageInfo[2]) {
    case IMAGETYPE_JPEG: $src = @imagecreatefromjpeg($tmpPath); break;
    case IMAGETYPE_PNG:  $src = @imagecreatefrompng($tmpPath);  break;
    case IMAGETYPE_GIF:  $src = @imagecreatefromgif($tmpPath);  break;
    case IMAGETYPE_WEBP: $src = @imagecreatefromwebp($tmpPath); break;
    default: $src = false;
}
if (!$src) {
    echo json_encode(['success' => false, 'error' => 'Failed to process image']); exit();
}

// Build 023: Fix EXIF orientation (phone portrait photos saved sideways)
if ($imageInfo[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
    $exif = @exif_read_data($tmpPath);
    $orientation = $exif['Orientation'] ?? 1;
    switch ($orientation) {
        case 3: $src = imagerotate($src, 180, 0); break;
        case 6: $src = imagerotate($src,  -90, 0); break;
        case 8: $src = imagerotate($src,   90, 0); break;
    }
    // Re-read dimensions after rotation (they swap on 90/270)
}

// Directories
$uploadDir = dirname(__DIR__) . '/uploads/photos/';
$thumbDir  = $uploadDir . 'thumbs/';
if (!file_exists($uploadDir)) mkdir($uploadDir, 0755, true);
if (!file_exists($thumbDir))  mkdir($thumbDir,  0755, true);

$uid          = uniqid('photo_', true);
$filename     = $uid . '.webp';
$fullPath     = $uploadDir . $filename;
$thumbPath    = $thumbDir  . $filename;
$relativeFull = 'uploads/photos/' . $filename;
$relativeThumb= 'uploads/photos/thumbs/' . $filename;

// Read dimensions AFTER rotation (90°/270° swaps width and height)
$origW = imagesx($src);
$origH = imagesy($src);
imagesavealpha($src, true);

// Save full-size
if (!imagewebp($src, $fullPath, 90)) {
    imagedestroy($src);
    echo json_encode(['success' => false, 'error' => 'Failed to save image']); exit();
}

// Thumbnail (max 800px — used as main card image, needs to be sharp)
$maxThumb = 800;
if ($origW > $maxThumb || $origH > $maxThumb) {
    if ($origW >= $origH) {
        $tw = $maxThumb; $th = intval($origH * ($maxThumb / $origW));
    } else {
        $th = $maxThumb; $tw = intval($origW * ($maxThumb / $origH));
    }
} else {
    $tw = $origW; $th = $origH;
}

$thumb = imagecreatetruecolor($tw, $th);
imagesavealpha($thumb, true);
imagefill($thumb, 0, 0, imagecolorallocatealpha($thumb, 0, 0, 0, 127));
imagecopyresampled($thumb, $src, 0, 0, 0, 0, $tw, $th, $origW, $origH);
imagewebp($thumb, $thumbPath, 85);
imagedestroy($src);
imagedestroy($thumb);

// Database — Build 023: inline credentials, no config.php
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4',
        'u143213086_tangleme',
        'fake.name.forever@3eLNma',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // BASIC tier limit check
    if ($tier === 'basic') {
        $chk = $pdo->prepare("SELECT COUNT(*) AS cnt FROM photos WHERE user_id = ?");
        $chk->execute([$userId]);
        if ($chk->fetch(PDO::FETCH_ASSOC)['cnt'] >= 20) {
            @unlink($fullPath); @unlink($thumbPath);
            echo json_encode(['success' => false, 'error' => 'Photo limit reached (20). Upgrade to PRO for unlimited photos!']); exit();
        }
    }

    $stmt = $pdo->prepare("
        INSERT INTO photos (user_id, filename, thumb_path, full_path, original_name, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$userId, $filename, $relativeThumb, $relativeFull, $originalName, $fileSize]);
    $photoId = $pdo->lastInsertId();

    logDebug("Photo saved: $filename, ID: $photoId");

    echo json_encode([
        'success' => true,
        'photo'   => [
            'id'            => $photoId,
            'filename'      => $filename,
            'thumb'         => $relativeThumb,
            'full'          => $relativeFull,
            'original_name' => $originalName,
            'size'          => $fileSize
        ]
    ]);

} catch (PDOException $e) {
    logDebug("DB error: " . $e->getMessage());
    @unlink($fullPath); @unlink($thumbPath);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
