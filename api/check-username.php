<?php
// check-username.php - Validate custom username (2000-word system)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');

require_once 'words-list-2000.php';

// Database configuration
$host = 'localhost';
$dbname = 'u143213086_tangleme';
$username_db = 'u143213086_tangleme';
$password = 'fake.name.forever@3eLNma';  // ⬅️ INSERT YOUR PASSWORD!

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username_db, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get username from request
    $username = isset($_GET['username']) ? trim($_GET['username']) : '';
    
    if (empty($username)) {
        echo json_encode([
            'success' => false,
            'available' => false,
            'error' => 'Username required'
        ]);
        exit;
    }
    
    // Validate format: word.word.word
    if (!preg_match('/^[a-z]+\.[a-z]+\.[a-z]+$/', $username)) {
        echo json_encode([
            'success' => false,
            'available' => false,
            'error' => 'Invalid format. Use: word.word.word (lowercase only)'
        ]);
        exit;
    }
    
    // Split into three words
    $parts = explode('.', $username);
    
    if (count($parts) !== 3) {
        echo json_encode([
            'success' => false,
            'available' => false,
            'error' => 'Username must have exactly 3 words'
        ]);
        exit;
    }
    
    // Validate each word exists in 2000-word dictionary
    foreach ($parts as $word) {
        if (!WordList2000::isValidWord($word)) {
            echo json_encode([
                'success' => false,
                'available' => false,
                'error' => "'{$word}' is not in our 2000-word dictionary. Please choose from available words."
            ]);
            exit;
        }
    }
    
    // Check against blacklist patterns
    $stmt = $pdo->prepare("SELECT pattern, reason FROM username_blacklist");
    $stmt->execute();
    $blacklist = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($blacklist as $blocked) {
        $pattern = str_replace('*', '[a-z]+', $blocked['pattern']);
        if (preg_match("/^{$pattern}$/", $username)) {
            echo json_encode([
                'success' => false,
                'available' => false,
                'error' => 'This combination is not allowed'
            ]);
            exit;
        }
    }
    
    // Check if username already taken
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'available' => false,
            'message' => 'Username already taken'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'available' => true,
            'message' => 'Username available!'
        ]);
    }
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
