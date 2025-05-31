<?php
// Final API test
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['user_id'] = 1; // Simulate logged in user

// Simulate POST request
$_POST['name'] = 'Test Server ' . time();
$_POST['description'] = 'Test description';
$_SERVER['REQUEST_METHOD'] = 'POST';

// Test the API
ob_start();
try {
    require_once __DIR__ . '/controllers/api/ServerController.php';
    $controller = new ServerController();
    $controller->create();
    $output = ob_get_clean();
    
    // Check if it's valid JSON
    $decoded = json_decode($output, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✓ API Test Successful!\n";
        echo "Response: " . $output . "\n";
        
        if (isset($decoded['success']) && $decoded['success']) {
            echo "✓ Server created successfully!\n";
        } else {
            echo "✗ Server creation failed: " . ($decoded['message'] ?? 'Unknown error') . "\n";
        }
    } else {
        echo "✗ Invalid JSON response\n";
        echo "Raw output: " . $output . "\n";
    }
} catch (Exception $e) {
    if (ob_get_level()) ob_end_clean();
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?>
