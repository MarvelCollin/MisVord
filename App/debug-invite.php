<?php
// Debug script for invite link generation
header('Content-Type: text/plain');
session_start();

// Set a user ID for testing
$_SESSION['user_id'] = 1;

// Include required files
require_once __DIR__ . '/database/models/Server.php';
require_once __DIR__ . '/database/models/ServerInvite.php';
require_once __DIR__ . '/database/models/UserServerMembership.php';
require_once __DIR__ . '/database/query.php';

// Set up error handling
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "Starting invite link debug...\n\n";

try {
    // Load the server
    $serverId = 1;
    
    echo "1. Testing Server::find() method\n";
    $server = Server::find($serverId);
    
    if (!$server) {
        echo "ERROR: Server not found\n";
        exit;
    }
    
    echo "Server found: ID={$server->id}, Name={$server->name}\n";
    echo "Current invite_link: " . ($server->invite_link ?? 'null') . "\n\n";
    
    echo "2. Testing UserServerMembership::isMember()\n";
    $isMember = UserServerMembership::isMember($_SESSION['user_id'], $serverId);
    echo "Is user {$_SESSION['user_id']} a member of server {$serverId}? " . ($isMember ? "Yes" : "No") . "\n\n";
    
    if (!$isMember) {
        echo "ERROR: Not a member of this server\n";
        exit;
    }
    
    echo "3. Testing generateUniqueInviteCode\n";
    try {
        $newInviteCode = bin2hex(random_bytes(8));
        echo "Generated new code: {$newInviteCode}\n\n";
    } catch (Exception $e) {
        echo "ERROR generating code: " . $e->getMessage() . "\n";
        exit;
    }
    
    echo "4. Testing direct SQL query update\n";
    try {
        $query = new Query();
        $pdo = $query->getPdo();
        
        echo "Database connection established\n";
        
        echo "Running query: UPDATE servers SET invite_link = '{$newInviteCode}' WHERE id = {$serverId}\n";
        
        // Method 1: Using Query class
        $updated = $query->table('servers')
            ->where('id', $serverId)
            ->update(['invite_link' => $newInviteCode]);
            
        echo "Update result using Query class: " . ($updated ? "Success" : "Failed") . "\n";
        
        // Method 2: Using direct PDO (fallback)
        if (!$updated) {
            echo "Trying direct PDO query as fallback\n";
            $stmt = $pdo->prepare("UPDATE servers SET invite_link = ? WHERE id = ?");
            $pdoResult = $stmt->execute([$newInviteCode, $serverId]);
            echo "Update result using direct PDO: " . ($pdoResult ? "Success" : "Failed") . "\n";
            
            if (!$pdoResult) {
                echo "PDO Error Info: " . print_r($stmt->errorInfo(), true) . "\n";
            }
        }
    } catch (Exception $e) {
        echo "ERROR with database: " . $e->getMessage() . "\n";
        echo "Stack trace: " . $e->getTraceAsString() . "\n";
    }
    
    echo "\n5. Verifying the update worked\n";
    $updatedServer = Server::find($serverId);
    echo "Updated server invite_link: " . ($updatedServer->invite_link ?? 'null') . "\n";
    echo "Did it update correctly? " . ($updatedServer->invite_link === $newInviteCode ? "Yes" : "No") . "\n";
    
} catch (Exception $e) {
    echo "GENERAL ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\nDebug complete.\n"; 