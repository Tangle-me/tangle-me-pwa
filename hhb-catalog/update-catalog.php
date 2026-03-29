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

$action = $data['action'] ?? '';

// ── UPDATE PRICES ──
if ($action === 'update_prices') {
    $prices = $data['prices'] ?? []; // [{code: "1001", price: 95.90}, ...]
    if (empty($prices)) {
        echo json_encode(['error' => 'No prices provided']);
        exit;
    }

    // Read current catalog-data.js
    $catalogFile = __DIR__ . '/catalog-data.js';
    if (!file_exists($catalogFile)) {
        echo json_encode(['error' => 'catalog-data.js not found']);
        exit;
    }
    $content = file_get_contents($catalogFile);

    // Build price lookup
    $priceLookup = [];
    foreach ($prices as $p) {
        $priceLookup[trim($p['code'])] = floatval($p['price']);
    }

    $updated = 0;
    $notFound = 0;

    // Update prices in the JS content using regex
    // Products look like: {"c":"P999","d":"description","p":3282.18} or without "p"
    $content = preg_replace_callback(
        '/"c":"([^"]+)"(.*?)(?="c"|$)/s',
        function ($match) use ($priceLookup, &$updated, &$notFound) {
            $code = $match[1];
            if (!isset($priceLookup[$code])) return $match[0];

            $newPrice = $priceLookup[$code];
            $block = $match[0];

            // Replace existing price
            if (preg_match('/"p":[0-9.]+/', $block)) {
                $block = preg_replace('/"p":[0-9.]+/', '"p":' . $newPrice, $block);
                $updated++;
            } else {
                // Add price before the closing }
                // Find the last } before the next "c" or end
                $block = preg_replace('/}/', ',"p":' . $newPrice . '}', $block, 1);
                $updated++;
            }
            return $block;
        },
        $content
    );

    // Update the date comment
    $date = date('Y-m-d');
    $content = preg_replace('/\/\/ Last updated: [0-9-]+/', '// Last updated: ' . $date, $content);

    // Write back
    $backup = $catalogFile . '.backup-' . date('Ymd-His');
    copy($catalogFile, $backup);
    file_put_contents($catalogFile, $content);

    echo json_encode([
        'ok' => true,
        'updated' => $updated,
        'total_prices' => count($prices),
        'backup' => basename($backup)
    ]);
    exit;
}

// ── UPDATE PHOTO MAP ──
if ($action === 'update_photo_map') {
    $map = $data['map'] ?? null;
    if (!$map) {
        echo json_encode(['error' => 'No map provided']);
        exit;
    }
    $mapFile = __DIR__ . '/photo_map.json';
    $backup = $mapFile . '.backup-' . date('Ymd-His');
    if (file_exists($mapFile)) copy($mapFile, $backup);
    file_put_contents($mapFile, json_encode($map));
    echo json_encode(['ok' => true]);
    exit;
}

// ── ADD PRODUCT ──
if ($action === 'add_product') {
    $product = $data['product'] ?? null;
    if (!$product || !$product['code'] || !$product['section'] || !$product['brand']) {
        echo json_encode(['error' => 'Missing product data']);
        exit;
    }

    $catalogFile = __DIR__ . '/catalog-data.js';
    $content = file_get_contents($catalogFile);

    // Build JSON for the new product
    $newProd = '{"c":"' . addslashes($product['code']) . '","d":"' . addslashes($product['description']) . '"';
    if (!empty($product['size'])) $newProd .= ',"s":"' . addslashes($product['size']) . '"';
    if (!empty($product['price'])) $newProd .= ',"p":' . floatval($product['price']);
    $newProd .= '}';

    // Find the section+brand in the content and append
    $section = $product['section'];
    $brand = $product['brand'];

    // This is a simplified approach — for robustness, a JSON-based catalog would be better
    // For now, backup and let admin know
    $backup = $catalogFile . '.backup-' . date('Ymd-His');
    copy($catalogFile, $backup);

    echo json_encode([
        'ok' => true,
        'note' => 'Product prepared. For adding new products, use the full catalog rebuild via Excel upload.',
        'product' => $newProd
    ]);
    exit;
}

// ── DISCONTINUE PRODUCT ──
if ($action === 'discontinue') {
    $code = $data['code'] ?? '';
    if (!$code) {
        echo json_encode(['error' => 'No code']);
        exit;
    }

    $catalogFile = __DIR__ . '/catalog-data.js';
    $content = file_get_contents($catalogFile);
    $backup = $catalogFile . '.backup-' . date('Ymd-His');
    copy($catalogFile, $backup);

    // Remove the product entry — find {"c":"CODE",...} and remove it
    // This regex matches a product object for the given code
    $escaped = preg_quote($code, '/');
    $pattern = '/\{"c":"' . $escaped . '"[^}]*\},?/';
    $newContent = preg_replace($pattern, '', $content);

    // Clean up any trailing commas before ]
    $newContent = preg_replace('/,\s*\]/', ']', $newContent);

    if ($newContent !== $content) {
        file_put_contents($catalogFile, $newContent);
        echo json_encode(['ok' => true, 'removed' => $code, 'backup' => basename($backup)]);
    } else {
        echo json_encode(['error' => 'Code not found: ' . $code]);
    }
    exit;
}

echo json_encode(['error' => 'Unknown action']);
