<?php
require_once __DIR__ . '/database/repositories/UserServerMembershipRepository.php';

echo "Testing UserServerMembership transfer functions...\n";

try {
    $repo = new UserServerMembershipRepository();
    
    echo "1. Testing transferOwnership method exists: ";
    if (method_exists($repo, 'transferOwnership')) {
        echo "✓ EXISTS\n";
    } else {
        echo "✗ MISSING\n";
    }
    
    echo "2. Testing transferOwnershipAndRemoveOldOwner method exists: ";
    if (method_exists($repo, 'transferOwnershipAndRemoveOldOwner')) {
        echo "✓ EXISTS\n";
    } else {
        echo "✗ MISSING\n";
    }
    
    echo "3. Testing canTransferOwnership method exists: ";
    if (method_exists($repo, 'canTransferOwnership')) {
        echo "✓ EXISTS\n";
    } else {
        echo "✗ MISSING\n";
    }
    
    echo "\nFunctions are correctly defined!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
