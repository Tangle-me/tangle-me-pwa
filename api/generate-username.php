<?php
// generate-username.php - Generate random PWA username (2000-word system)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');

require_once 'words-list-2000.php';

// Database configuration
$host = 'localhost';
$dbname = 'u143213086_tangleme';
$username = 'u143213086_tangleme';
$password = 'fake.name.forever@3eLNma';  // ⬅️ INSERT YOUR PASSWORD!

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $maxAttempts = 20; // Try 20 times to find unique username
    $attempt = 0;
    
    while ($attempt < $maxAttempts) {
        // Generate random username using 2000-word system
        $generatedUsername = WordList2000::generateUsername();
        
        // Check if username already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$generatedUsername]);
        
        if (!$stmt->fetch()) {
            // Username is available!
            echo json_encode([
                'success' => true,
                'username' => $generatedUsername,
                'wordCount' => WordList2000::getWordCount(),
                'totalCombinations' => WordList2000::getTotalCombinations(),
                'categoryCounts' => WordList2000::getCategoryCounts()
            ]);
            exit;
        }
        
        $attempt++;
    }
    
    // If we get here, we couldn't find a unique username (extremely unlikely!)
    echo json_encode([
        'success' => false,
        'error' => 'Could not generate unique username. Please try again.'
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error'
    ]);
}
?>
