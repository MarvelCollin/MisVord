<?php
// Simulate the API endpoint call
session_start();

// Set up a mock session
$_SESSION['user_id'] = 1;

echo "Testing API endpoint simulation...\n";

try {
    require_once __DIR__ . '/controllers/ServerController.php';
    
    $controller = new ServerController();
    
    echo "Testing getServerDetails method with server ID 1...\n";
    
    // Capture output
    ob_start();
    $controller->getServerDetails(1);
    $output = ob_get_clean();
    
    echo "API Response:\n";
    echo $output . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
?>
