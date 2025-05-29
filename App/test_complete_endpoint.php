<?php
// Test the specific endpoint that was failing
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Testing API endpoint /api/servers/1...\n\n";

// Start session and simulate logged-in user
session_start();
$_SESSION['user_id'] = 1; // Assuming user 1 exists

try {
    // Include all necessary files
    require_once __DIR__ . '/database/models/Server.php';
    require_once __DIR__ . '/database/models/ServerInvite.php';
    require_once __DIR__ . '/database/models/UserServerMembership.php';
    require_once __DIR__ . '/controllers/ServerController.php';
    
    echo "All files loaded successfully.\n";
    
    // Test ServerInvite::findActiveByServer directly
    echo "Testing ServerInvite::findActiveByServer(1)...\n";
    $invite = ServerInvite::findActiveByServer(1);
    echo "Result: " . json_encode($invite) . "\n\n";
    
    // Test the full controller method
    echo "Testing ServerController::getServerDetails(1)...\n";
    $controller = new ServerController();
    
    // Capture the output
    ob_start();
    $controller->getServerDetails(1);
    $output = ob_get_clean();
    
    echo "Controller output:\n";
    echo $output . "\n";
    
} catch (Throwable $e) {
    echo "ERROR CAUGHT:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
