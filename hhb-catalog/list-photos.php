<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

if (($_GET['pin'] ?? '') !== ADMIN_PIN) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$photosDir = __DIR__ . '/photos/';
$photos = [];

if (is_dir($photosDir)) {
    $files = scandir($photosDir);
    foreach ($files as $f) {
        if (preg_match('/\.(jpg|jpeg|png|webp)$/i', $f)) {
            $photos[] = $f;
        }
    }
}

sort($photos);
echo json_encode(['count' => count($photos), 'photos' => $photos]);
