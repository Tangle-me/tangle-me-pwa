<?php
// get-country.php - Detect user's country from IP address
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');

try {
    // Get user's IP address
    $ip = $_SERVER['REMOTE_ADDR'];
    
    // Handle localhost/development
    if ($ip === '127.0.0.1' || $ip === '::1' || strpos($ip, '192.168.') === 0) {
        // Default to South Africa for local development
        echo json_encode([
            'success' => true,
            'country_code' => 'ZA',
            'country_name' => 'South Africa',
            'country_flag' => '🇿🇦',
            'ip' => $ip,
            'localhost' => true
        ]);
        exit;
    }
    
    // Use ip-api.com for geolocation (free, no API key needed)
    $geoUrl = "http://ip-api.com/json/{$ip}?fields=status,country,countryCode";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $geoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        // Fallback to default
        echo json_encode([
            'success' => true,
            'country_code' => 'ZA',
            'country_name' => 'South Africa',
            'country_flag' => '🇿🇦',
            'fallback' => true
        ]);
        exit;
    }
    
    $data = json_decode($response, true);
    
    if ($data && $data['status'] === 'success') {
        $countryCode = $data['countryCode'];
        $countryName = $data['country'];
        
        // Convert country code to flag emoji
        $flag = countryCodeToFlag($countryCode);
        
        echo json_encode([
            'success' => true,
            'country_code' => $countryCode,
            'country_name' => $countryName,
            'country_flag' => $flag,
            'ip' => $ip
        ]);
    } else {
        // Fallback
        echo json_encode([
            'success' => true,
            'country_code' => 'ZA',
            'country_name' => 'South Africa',
            'country_flag' => '🇿🇦',
            'fallback' => true
        ]);
    }
    
} catch(Exception $e) {
    // Fallback on error
    echo json_encode([
        'success' => true,
        'country_code' => 'ZA',
        'country_name' => 'South Africa',
        'country_flag' => '🇿🇦',
        'error' => 'Server error',
        'fallback' => true
    ]);
}

// Convert country code to flag emoji
function countryCodeToFlag($code) {
    $code = strtoupper($code);
    
    // Convert letters to regional indicator symbols
    $firstLetter = mb_chr(ord($code[0]) - ord('A') + 0x1F1E6);
    $secondLetter = mb_chr(ord($code[1]) - ord('A') + 0x1F1E6);
    
    return $firstLetter . $secondLetter;
}
?>
