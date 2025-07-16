<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/database/query.php';
require_once __DIR__ . '/database/repositories/UserServerMembershipRepository.php';

echo "=== Testing Transfer Ownership Database Operations ===\n";

try {
    $repo = new UserServerMembershipRepository();
    echo "Repository created successfully\n";
    
    $serverId = 8;
    $currentOwnerId = 1; // Assuming user 1 is current owner
    $newOwnerId = 2;     // Assuming user 2 will be new owner
    
    echo "Testing with Server: $serverId, Current Owner: $currentOwnerId, New Owner: $newOwnerId\n";
    
    // Check current memberships
    echo "\n--- Current Memberships ---\n";
    $currentOwnerMembership = $repo->findByUserAndServer($currentOwnerId, $serverId);
    if ($currentOwnerMembership) {
        echo "Current Owner ($currentOwnerId) role: {$currentOwnerMembership->role}\n";
    } else {
        echo "Current Owner ($currentOwnerId) not found in server\n";
    }
    
    $newOwnerMembership = $repo->findByUserAndServer($newOwnerId, $serverId);
    if ($newOwnerMembership) {
        echo "New Owner ($newOwnerId) role: {$newOwnerMembership->role}\n";
    } else {
        echo "New Owner ($newOwnerId) not found in server\n";
    }
    
    // Test the transfer
    echo "\n--- Attempting Transfer ---\n";
    $result = $repo->transferOwnership($serverId, $currentOwnerId, $newOwnerId);
    
    if ($result) {
        echo "SUCCESS: Transfer completed\n";
        
        // Verify the results
        echo "\n--- Verification ---\n";
        $currentOwnerAfter = $repo->findByUserAndServer($currentOwnerId, $serverId);
        $newOwnerAfter = $repo->findByUserAndServer($newOwnerId, $serverId);
        
        echo "Current Owner ($currentOwnerId) new role: " . ($currentOwnerAfter ? $currentOwnerAfter->role : 'NOT FOUND') . "\n";
        echo "New Owner ($newOwnerId) new role: " . ($newOwnerAfter ? $newOwnerAfter->role : 'NOT FOUND') . "\n";
    } else {
        echo "FAILED: Transfer failed\n";
    }
    
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
