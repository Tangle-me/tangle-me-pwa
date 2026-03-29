<?php
// HHB Catalog — Database Configuration
// Edit these values with your Hostinger MySQL credentials

define('DB_HOST', 'localhost');
define('DB_NAME', 'u143213086_tangleme');  // Your existing Tangle-me DB
define('DB_USER', 'u143213086_admin');     // Your DB username
define('DB_PASS', 'fake.name.forever@3eLNma');     // Your DB password
define('ADMIN_PIN', '1320');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
    return $pdo;
}
