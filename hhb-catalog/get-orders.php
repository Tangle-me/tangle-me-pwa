<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

if (($_GET['pin'] ?? '') !== ADMIN_PIN) {
    echo json_encode([]);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->query('SELECT * FROM hhb_orders ORDER BY id DESC LIMIT 200');
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($orders);
} catch (Exception $e) {
    echo json_encode([]);
}
