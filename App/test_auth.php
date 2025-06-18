<?php
// Quick test script for the authentication flow
define('APP_ROOT', __DIR__);
require_once __DIR__ . '/controllers/AuthenticationController.php';

// Mock a login POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = [
    'email' => 'test@example.com',
    'password' => 'password123'
];

$authController = new AuthenticationController();

try {
    // Test the authentication flow
    echo "Testing authentication flow...\n";
    echo "This should help verify if the session and user object handling works correctly.\n";
    
    // For now, just testing if we can instantiate the controller without errors
    echo "AuthenticationController created successfully\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
