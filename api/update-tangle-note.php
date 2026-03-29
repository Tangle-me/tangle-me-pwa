<?php
// update-tangle-note.php - Update notes for a saved Tangle
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://tangle-me.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Get JSON input early so we can use user_id fallback
$input = json_decode(file_get_contents('php://input'), true);

// Check if user is logged in - session first, then POST body fallback
$user_id = null;
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
} elseif ($input && isset($input['user_id'])) {
    $user_id = $input['user_id'];
}

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

// Database connection
$host = 'localhost';
$dbname = 'u143213086_tangleme';
$username = 'u143213086_tangleme';
$password = 'fake.name.forever@3eLNma';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Input already parsed above
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$saved_user_id = $input['saved_user_id'] ?? null;
$notes = $input['notes'] ?? '';

if (!$saved_user_id) {
    echo json_encode(['success' => false, 'error' => 'Missing saved_user_id']);
    exit;
}

// Update notes
$stmt = $pdo->prepare("
    UPDATE saved_tangles 
    SET notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND saved_user_id = ?
");
$stmt->execute([$notes, $user_id, $saved_user_id]);

if ($stmt->rowCount() > 0) {
    echo json_encode([
        'success' => true,
        'message' => 'Notes updated successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Tangle not found in favorites'
    ]);
}
