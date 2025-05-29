<?php
session_start();

require_once __DIR__ . '/database/query.php';
require_once __DIR__ . '/database/models/Server.php';
require_once __DIR__ . '/database/models/UserServerMembership.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    die("You must be logged in to run this test");
}

$userId = $_SESSION['user_id'];
echo "Testing server memberships for user ID: {$userId}\n";

try {
    // Direct database query for memberships
    $query = new Query();
    $memberships = $query->table('user_server_memberships')
        ->where('user_id', $userId)
        ->get();
    
    echo "Direct memberships query found: " . count($memberships) . " records\n";
    foreach ($memberships as $membership) {
        echo "- Server ID: {$membership['server_id']}, Role: {$membership['role']}\n";
    }
    
    echo "\n";
    
    // Get servers using the model function
    $servers = Server::getForUser($userId);
    echo "Server::getForUser found: " . count($servers) . " servers\n";
    foreach ($servers as $server) {
        echo "- Server ID: {$server->id}, Name: {$server->name}\n";
    }
    
    echo "\n";
    
    // Get formatted servers
    $formattedServers = Server::getFormattedServersForUser($userId);
    echo "Server::getFormattedServersForUser found: " . count($formattedServers) . " servers\n";
    foreach ($formattedServers as $server) {
        echo "- Server ID: {$server['id']}, Name: {$server['name']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
} 