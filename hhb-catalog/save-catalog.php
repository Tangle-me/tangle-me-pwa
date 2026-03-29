<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'config.php';

// Accept large POST data
ini_set('post_max_size', '10M');
ini_set('upload_max_filesize', '10M');

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || ($data['pin'] ?? '') !== ADMIN_PIN) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $data['action'] ?? '';

if ($action === 'save_catalog') {
    $catalogContent = $data['content'] ?? '';
    if (strlen($catalogContent) < 1000) {
        echo json_encode(['error' => 'Content too small — safety check failed']);
        exit;
    }

    $catalogFile = __DIR__ . '/catalog-data.js';
    
    // Create backup
    $backup = $catalogFile . '.backup-' . date('Ymd-His');
    if (file_exists($catalogFile)) {
        copy($catalogFile, $backup);
    }

    // Write new catalog
    $bytes = file_put_contents($catalogFile, $catalogContent);
    
    if ($bytes === false) {
        echo json_encode(['error' => 'Failed to write file']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'bytes' => $bytes,
        'backup' => basename($backup),
        'date' => date('Y-m-d H:i:s')
    ]);
    exit;
}

if ($action === 'save_mappings') {
    $mappingsContent = $data['content'] ?? '';
    if (strlen($mappingsContent) < 100) {
        echo json_encode(['error' => 'Content too small']);
        exit;
    }
    $file = __DIR__ . '/catalog-mappings.js';
    $backup = $file . '.backup-' . date('Ymd-His');
    if (file_exists($file)) copy($file, $backup);
    file_put_contents($file, $mappingsContent);
    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['error' => 'Unknown action']);
