<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || ($data['pin'] ?? '') !== ADMIN_PIN) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare('UPDATE hhb_orders SET status = ? WHERE id = ?');
    $stmt->execute([$data['status'], $data['id']]);
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
