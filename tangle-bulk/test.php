<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/config.php';
    $pdo = getDbConnection();
    echo json_encode(['ok' => true, 'step' => 'db connected']);
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage(), 'type' => get_class($e), 'file' => $e->getFile(), 'line' => $e->getLine()]);
}
