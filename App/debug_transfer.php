<?php
if (!defined('APP_ROOT')) {
    define('APP_ROOT', __DIR__);
}

require_once __DIR__ . '/database/query.php';
require_once __DIR__ . '/database/repositories/UserServerMembershipRepository.php';

error_log("=== DEBUG TRANSFER OWNERSHIP START ===");

try {
    $repository = new UserServerMembershipRepository();
    
    echo "1. Testing database connection...\n";
    $query = new Query();
    $testQuery = $query->table('user_server_memberships')->limit(1)->get();
    echo "Database connection: " . (count($testQuery) >= 0 ? "OK" : "FAILED") . "\n";
    
    echo "\n2. Checking specific transfer scenario...\n";
    
    $serverId = 5;
    $currentOwnerId = 1; 
    $newOwnerId = 5;
    
    echo "Server ID: $serverId\n";
    echo "Current Owner ID: $currentOwnerId\n";
    echo "New Owner ID: $newOwnerId\n";
    
    echo "\n3. Checking memberships...\n";
    $currentOwnerMembership = $repository->findByUserAndServer($currentOwnerId, $serverId);
    $newOwnerMembership = $repository->findByUserAndServer($newOwnerId, $serverId);
    
    echo "Current owner membership: " . ($currentOwnerMembership ? "Found (role: {$currentOwnerMembership->role})" : "NOT FOUND") . "\n";
    echo "New owner membership: " . ($newOwnerMembership ? "Found (role: {$newOwnerMembership->role})" : "NOT FOUND") . "\n";
    
    if (!$currentOwnerMembership) {
        echo "ERROR: Current owner not found in server\n";
        exit;
    }
    
    if (!$newOwnerMembership) {
        echo "ERROR: New owner not found in server\n";
        exit;
    }
    
    if ($currentOwnerMembership->role !== 'owner') {
        echo "ERROR: Current user is not owner (role: {$currentOwnerMembership->role})\n";
        exit;
    }
    
    if ($newOwnerMembership->role !== 'admin') {
        echo "ERROR: New owner is not admin (role: {$newOwnerMembership->role})\n";
        exit;
    }
    
    echo "\n4. All checks passed, attempting transfer...\n";
    
    $result = $repository->transferOwnership($serverId, $currentOwnerId, $newOwnerId);
    
    echo "Transfer result: " . ($result ? "SUCCESS" : "FAILED") . "\n";
    
    if ($result) {
        echo "\n5. Verifying transfer...\n";
        $verifyCurrentOwner = $repository->findByUserAndServer($currentOwnerId, $serverId);
        $verifyNewOwner = $repository->findByUserAndServer($newOwnerId, $serverId);
        
        echo "Current owner new role: " . ($verifyCurrentOwner ? $verifyCurrentOwner->role : "NOT FOUND") . "\n";
        echo "New owner new role: " . ($verifyNewOwner ? $verifyNewOwner->role : "NOT FOUND") . "\n";
    }
    
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo "TRACE: " . $e->getTraceAsString() . "\n";
}

error_log("=== DEBUG TRANSFER OWNERSHIP END ===");
?>
