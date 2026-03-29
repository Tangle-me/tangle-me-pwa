<?php
/**
 * translate-ad.php — AI Ad Translation with MySQL Caching
 * 
 * POST /api/translate-ad.php
 * Body: { "ad_id": 123, "target_lang": "zh", "text": "...", "contact": "..." }
 * 
 * Flow:
 *   1. Check ad_translations cache table
 *   2. If cached → return immediately
 *   3. If not cached → call Claude Haiku → cache result → return
 * 
 * Cost: ~$0.003 per translation (first time only, then free from cache)
 * 
 * REQUIRED: Run this SQL once on your database:
 * 
 *   CREATE TABLE IF NOT EXISTS ad_translations (
 *       id INT AUTO_INCREMENT PRIMARY KEY,
 *       ad_id INT NOT NULL,
 *       target_lang VARCHAR(5) NOT NULL,
 *       translated_text TEXT NOT NULL,
 *       translated_contact TEXT,
 *       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *       UNIQUE KEY unique_translation (ad_id, target_lang),
 *       INDEX idx_ad_id (ad_id)
 *   );
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

// Inline DB + API credentials (no config.php exists on Hostinger)
$db = new PDO(
    "mysql:host=localhost;dbname=u143213086_tangleme;charset=utf8mb4",
    "u143213086_tangleme",
    "fake.name.forever@3eLNma",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// ⚠️ SET YOUR CLAUDE API KEY HERE
$apiKey = getenv('CLAUDE_API_KEY');

// Also try loading from tangle-bulk config if it exists
$bulkConfig = __DIR__ . '/../tangle-bulk/config.php';
if (file_exists($bulkConfig)) {
    require_once $bulkConfig;
    if (defined('CLAUDE_API_KEY')) $apiKey = CLAUDE_API_KEY;
    elseif (defined('ANTHROPIC_API_KEY')) $apiKey = ANTHROPIC_API_KEY;
}

// Parse request
$input = json_decode(file_get_contents('php://input'), true);
$adId = intval($input['ad_id'] ?? 0);
$targetLang = trim($input['target_lang'] ?? '');
$sourceText = trim($input['text'] ?? '');
$sourceContact = trim($input['contact'] ?? '');

// Validate
if (!$adId || !$targetLang || !$sourceText) {
    echo json_encode(['success' => false, 'error' => 'Missing ad_id, target_lang, or text']);
    exit;
}

// Language names for the AI prompt
$langNames = [
    'en' => 'English',
    'es' => 'Spanish',
    'fr' => 'French',
    'de' => 'German',
    'pt' => 'Portuguese',
    'zh' => 'Chinese (Simplified)',
    'ar' => 'Arabic',
    'hi' => 'Hindi',
    'ru' => 'Russian',
    'ja' => 'Japanese',
    'ko' => 'Korean',
    'id' => 'Indonesian'
];

$targetLangName = $langNames[$targetLang] ?? $targetLang;

// ─── STEP 1: Check cache ───

// Ensure table exists
$db->exec("CREATE TABLE IF NOT EXISTS ad_translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_id INT NOT NULL,
    target_lang VARCHAR(5) NOT NULL,
    translated_text TEXT NOT NULL,
    translated_contact TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_translation (ad_id, target_lang),
    INDEX idx_ad_id (ad_id)
)");

$stmt = $db->prepare("SELECT translated_text, translated_contact FROM ad_translations WHERE ad_id = ? AND target_lang = ?");
$stmt->execute([$adId, $targetLang]);
$cached = $stmt->fetch(PDO::FETCH_ASSOC);

if ($cached) {
    echo json_encode([
        'success' => true,
        'translated_text' => $cached['translated_text'],
        'translated_contact' => $cached['translated_contact'] ?? '',
        'cached' => true
    ]);
    exit;
}

// ─── STEP 2: Call Claude Haiku for translation ───

if (empty($apiKey) || $apiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    echo json_encode(['success' => false, 'error' => 'Translation API key not configured. Set $apiKey in translate-ad.php']);
    exit;
}

$prompt = "Translate this classified advertisement to {$targetLangName}. Keep it natural and concise — this is a product/service listing, not prose. Preserve any numbers, prices, measurements, brand names, and contact details exactly as they are. Return ONLY the translated text with no explanation or preamble.\n\nAd text:\n{$sourceText}";

if (!empty($sourceContact)) {
    $prompt .= "\n\nContact info (translate labels but preserve actual contact details like phone numbers, emails, WhatsApp numbers):\n{$sourceContact}";
}

$payload = [
    'model' => 'claude-haiku-4-5-20251001',
    'max_tokens' => 1000,
    'messages' => [
        ['role' => 'user', 'content' => $prompt]
    ]
];

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01'
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    error_log("Translation API error: HTTP {$httpCode} - " . substr($response, 0, 500));
    echo json_encode(['success' => false, 'error' => 'Translation service temporarily unavailable']);
    exit;
}

$result = json_decode($response, true);
$translatedFull = '';

if (isset($result['content']) && is_array($result['content'])) {
    foreach ($result['content'] as $block) {
        if (($block['type'] ?? '') === 'text') {
            $translatedFull .= $block['text'];
        }
    }
}

if (empty($translatedFull)) {
    echo json_encode(['success' => false, 'error' => 'Translation returned empty result']);
    exit;
}

// Split translated text and contact if contact was included
$translatedText = $translatedFull;
$translatedContact = '';

// ─── STEP 3: Cache and return ───
try {
    $stmt = $db->prepare("INSERT INTO ad_translations (ad_id, target_lang, translated_text, translated_contact) 
                           VALUES (?, ?, ?, ?) 
                           ON DUPLICATE KEY UPDATE translated_text = VALUES(translated_text), translated_contact = VALUES(translated_contact)");
    $stmt->execute([$adId, $targetLang, $translatedText, $translatedContact]);
} catch (PDOException $e) {
    error_log("Translation cache write error: " . $e->getMessage());
    // Non-fatal — still return the translation
}

echo json_encode([
    'success' => true,
    'translated_text' => $translatedText,
    'translated_contact' => $translatedContact,
    'cached' => false
]);
