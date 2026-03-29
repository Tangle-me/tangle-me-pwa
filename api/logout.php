<?php
// logout.php - User Logout
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Credentials: true');

// Destroy session
session_destroy();
session_unset();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>
