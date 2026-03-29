<?php
// get-words.php - Get 2000-word list for autocomplete
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');

require_once 'words-list-2000.php';

try {
    $words = WordList2000::getAllWords();
    
    // Sort alphabetically for better autocomplete
    sort($words);
    
    echo json_encode([
        'success' => true,
        'words' => $words,
        'count' => count($words),
        'combinations' => WordList2000::getTotalCombinations(),
        'categories' => WordList2000::getCategoryCounts()
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error'
    ]);
}
?>
