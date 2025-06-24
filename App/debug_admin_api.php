<?php
define('APP_ROOT', __DIR__);
require_once 'controllers/AdminController.php';

echo "Debugging Admin API Endpoints\n";
echo "============================\n\n";

try {
    $controller = new AdminController();
    
    echo "1. Testing getServerStats():\n";
    echo "-------------------------\n";
    $serverStats = $controller->getServerStats();
    echo json_encode($serverStats, JSON_PRETTY_PRINT) . "\n\n";
    
    echo "2. Testing getUserStats():\n";
    echo "------------------------\n";
    $userStats = $controller->getUserStats();
    echo json_encode($userStats, JSON_PRETTY_PRINT) . "\n\n";
    
    echo "3. Testing getSystemStats():\n";
    echo "-------------------------\n";
    $systemStats = $controller->getSystemStats();
    echo json_encode($systemStats, JSON_PRETTY_PRINT) . "\n\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} 