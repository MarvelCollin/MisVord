<?php
session_start();

$_SESSION['user_id'] = 0;
$_SESSION['username'] = 'Admin';
$_SESSION['discriminator'] = '0000';
$_SESSION['email'] = 'admin@admin.com';

require_once __DIR__ . '/../../controllers/AdminController.php';

$adminController = new AdminController();

echo "Testing Admin User Management API\n";
echo "==================================\n\n";

try {
    echo "1. Testing getSystemStats():\n";
    $stats = $adminController->getSystemStats();
    echo "Stats Response: " . json_encode($stats, JSON_PRETTY_PRINT) . "\n\n";
    
    echo "2. Testing getUsers():\n";
    $_GET['page'] = 1;
    $_GET['limit'] = 5;
    $users = $adminController->getUsers();
    echo "Users Response: " . json_encode($users, JSON_PRETTY_PRINT) . "\n\n";
    
    echo "3. Testing getUsers() with status filter:\n";
    $_GET['status'] = 'active';
    $activeUsers = $adminController->getUsers();
    echo "Active Users Response: " . json_encode($activeUsers, JSON_PRETTY_PRINT) . "\n\n";
    
    echo "All tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} 