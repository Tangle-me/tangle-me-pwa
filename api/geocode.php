<?php
/**
 * GEOCODE PROXY API - Build 008
 * Proxies requests to Nominatim to avoid CORS issues
 * 
 * GET /api/geocode.php?lat=X&lng=Y (reverse geocode)
 * GET /api/geocode.php?q=address (forward geocode)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: GET');

// Rate limiting: simple file-based (prevent abuse)
$rateLimitFile = sys_get_temp_dir() . '/tangle_geocode_' . date('YmdH') . '.txt';
$requestCount = file_exists($rateLimitFile) ? intval(file_get_contents($rateLimitFile)) : 0;

if ($requestCount > 500) { // 500 requests per hour max
    echo json_encode(['error' => 'Rate limit exceeded. Please try again later.']);
    exit;
}

file_put_contents($rateLimitFile, $requestCount + 1);

// Nominatim requires a valid User-Agent
$userAgent = 'Tangle-me/1.0 (https://tangle-me.com; contact@tangle-me.com)';

// Check request type
$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lng = isset($_GET['lng']) ? floatval($_GET['lng']) : null;
$query = isset($_GET['q']) ? trim($_GET['q']) : null;

if ($lat !== null && $lng !== null) {
    // Reverse geocode: coordinates to address
    $url = "https://nominatim.openstreetmap.org/reverse?format=json&lat={$lat}&lon={$lng}&addressdetails=1";
    
} elseif ($query !== null && strlen($query) >= 3) {
    // Forward geocode: address to coordinates
    $encodedQuery = urlencode($query);
    $url = "https://nominatim.openstreetmap.org/search?format=json&q={$encodedQuery}&limit=5&addressdetails=1";
    
} else {
    echo json_encode(['error' => 'Invalid request. Provide lat/lng or q parameter.']);
    exit;
}

// Make request to Nominatim
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            "User-Agent: {$userAgent}",
            "Accept: application/json",
            "Accept-Language: en"
        ],
        'timeout' => 10
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    // Try with cURL as fallback
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => $userAgent,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Accept-Language: en'
            ]
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false || $httpCode !== 200) {
            echo json_encode(['error' => 'Geocoding service unavailable']);
            exit;
        }
    } else {
        echo json_encode(['error' => 'Geocoding service unavailable']);
        exit;
    }
}

// Parse and enhance response
$data = json_decode($response, true);

if ($data === null) {
    echo json_encode(['error' => 'Invalid response from geocoding service']);
    exit;
}

// For reverse geocoding, add friendly_name
if ($lat !== null && $lng !== null && isset($data['address'])) {
    $address = $data['address'];
    
    // Build friendly name from address components
    $parts = [];
    
    // Get locality (most specific first)
    $locality = $address['suburb'] ?? $address['neighbourhood'] ?? $address['village'] ?? 
                $address['town'] ?? $address['city'] ?? $address['municipality'] ?? null;
    
    // Get region
    $region = $address['state'] ?? $address['province'] ?? $address['region'] ?? 
              $address['county'] ?? null;
    
    // Get country
    $country = $address['country'] ?? null;
    
    if ($locality) $parts[] = $locality;
    if ($region && $region !== $locality) $parts[] = $region;
    if ($country) $parts[] = $country;
    
    if (!empty($parts)) {
        $data['friendly_name'] = 'Near ' . implode(', ', $parts);
    } else {
        // Check if it's water/ocean
        $waterTypes = ['ocean', 'sea', 'water', 'bay', 'gulf', 'strait'];
        $placeType = strtolower($data['type'] ?? '');
        $displayName = strtolower($data['display_name'] ?? '');
        
        $isWater = false;
        foreach ($waterTypes as $water) {
            if (strpos($placeType, $water) !== false || strpos($displayName, $water) !== false) {
                $isWater = true;
                break;
            }
        }
        
        if ($isWater) {
            $data['friendly_name'] = 'Somewhere in the ' . ucwords($data['display_name'] ?? 'Ocean');
        } else {
            $data['friendly_name'] = "Location at " . number_format($lat, 6) . ", " . number_format($lng, 6);
        }
    }
}

echo json_encode($data);
?>
