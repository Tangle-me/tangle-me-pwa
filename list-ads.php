<?php
/**
 * Quick script to list existing ad IDs
 */
require_once 'api/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    
    echo "<h2>Existing Ads</h2>";
    
    // First, let's see what columns exist in the ads table
    echo "<h3>Ads Table Structure:</h3>";
    $columns = $pdo->query("DESCRIBE ads")->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    foreach ($columns as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }
    echo "</pre>";
    
    // Now list ads without assuming deleted_at exists
    echo "<h3>All Ads:</h3>";
    $stmt = $pdo->query("SELECT * FROM ads ORDER BY id DESC LIMIT 20");
    $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($ads)) {
        echo "<p>No ads found in database.</p>";
    } else {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
        echo "<tr style='background: #667eea; color: white;'><th>ID</th><th>Keywords</th><th>Created</th><th>Test Link</th></tr>";
        
        foreach ($ads as $ad) {
            $keywords = $ad['keywords'] ?? $ad['title'] ?? 'No title';
            $created = $ad['created_at'] ?? $ad['date_posted'] ?? 'Unknown';
            echo "<tr>";
            echo "<td><strong>{$ad['id']}</strong></td>";
            echo "<td>" . htmlspecialchars(substr($keywords, 0, 50)) . "</td>";
            echo "<td>{$created}</td>";
            echo "<td><a href='/ad.php?id={$ad['id']}' style='color: #667eea;'>View Ad #{$ad['id']}</a></td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
