<?php
// Simple test to check if the API endpoint returns JSON

// Start session first before any output
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Simulate a logged-in user
$_SESSION['user_id'] = 1;

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing API endpoint...\n\n";

// Simulate the API call internally
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/servers/create';
$_POST['name'] = 'Test Server ' . time(); // Add timestamp to make it unique
$_POST['description'] = 'Test Description';

// Start output buffering to capture the response
ob_start();

try {
    require_once __DIR__ . '/controllers/api/ServerController.php';
    $controller = new ServerController();
    $controller->create();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$output = ob_get_clean();

echo "Response:\n";
echo $output . "\n\n";

// Check if it's valid JSON
$decoded = json_decode($output, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo "✓ Valid JSON response\n";
    echo "Response data: " . print_r($decoded, true) . "\n";
} else {
    echo "✗ Invalid JSON response\n";
    echo "JSON Error: " . json_last_error_msg() . "\n";
    echo "Raw output: " . $output . "\n";
}
?>
