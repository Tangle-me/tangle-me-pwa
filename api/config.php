<?php
/**
 * Tangle-me Database Configuration
 * Build 008 - Centralized credentials
 * 
 * ALL API files should include this file:
 * require_once __DIR__ . '/config.php';
 * 
 * Then use: $db_host, $db_name, $db_user, $db_pass
 */

// Database credentials - SINGLE SOURCE OF TRUTH
$db_host = 'localhost';
$db_name = 'u143213086_tangleme';
$db_user = 'u143213086_tangleme';
$db_pass = 'fake.name.forever@3eLNma';

/**
 * Helper function to create PDO connection
 * Usage: $pdo = getDbConnection();
 */
function getDbConnection() {
    global $db_host, $db_name, $db_user, $db_pass;
    
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    return $pdo;
}
?>
