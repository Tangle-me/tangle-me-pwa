<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['customer']) || !isset($data['items'])) {
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare('INSERT INTO hhb_orders (customer, items, date, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $data['customer'],
        json_encode($data['items']),
        $data['date'] ?? date('Y-m-d H:i'),
        'pending'
    ]);
    echo json_encode(['ok' => true, 'id' => $db->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
