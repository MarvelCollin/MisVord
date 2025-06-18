<?php
// Debug script to check server data types
require_once __DIR__ . '/database/repositories/ServerRepository.php';
require_once __DIR__ . '/controllers/BaseController.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo "No user logged in\n";
    exit;
}

try {
    $serverRepository = new ServerRepository();
    $userServers = $serverRepository->getForUser($_SESSION['user_id']);
    
    echo "User servers type: " . gettype($userServers) . "\n";
    echo "Count: " . count($userServers) . "\n";
    
    if (!empty($userServers)) {
        $firstServer = $userServers[0];
        echo "First server type: " . gettype($firstServer) . "\n";
        echo "First server class: " . get_class($firstServer) . "\n";
        echo "Has id property: " . (property_exists($firstServer, 'id') ? 'yes' : 'no') . "\n";
        echo "ID via magic method: " . (isset($firstServer->id) ? $firstServer->id : 'null') . "\n";
        echo "Name via magic method: " . (isset($firstServer->name) ? $firstServer->name : 'null') . "\n";        echo "Attributes: ";
        if (property_exists($firstServer, 'attributes')) {
            var_dump($firstServer->attributes);
        } else {
            echo "No attributes property\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
