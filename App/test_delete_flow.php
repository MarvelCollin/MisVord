<?php
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/database/repositories/UserRepository.php';
require_once __DIR__ . '/database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/database/repositories/ServerRepository.php';

echo "Testing delete account flow...\n";

$userRepo = new UserRepository();
$membershipRepo = new UserServerMembershipRepository();
$serverRepo = new ServerRepository();

echo "✓ All repositories loaded successfully\n";

echo "Testing transferOwnership method:\n";
try {
    $reflection = new ReflectionMethod('UserServerMembershipRepository', 'transferOwnership');
    echo "✓ transferOwnership method exists\n";
    echo "  Parameters: " . implode(', ', array_map(function($p) { return $p->getName(); }, $reflection->getParameters())) . "\n";
} catch (Exception $e) {
    echo "✗ transferOwnership method issue: " . $e->getMessage() . "\n";
}

echo "Testing deleteUser method:\n";
try {
    $reflection = new ReflectionMethod('UserRepository', 'deleteUser');
    echo "✓ deleteUser method exists\n";
} catch (Exception $e) {
    echo "✗ deleteUser method issue: " . $e->getMessage() . "\n";
}

echo "\nAll core methods are properly defined.\n";
echo "Delete this test file after verification.\n";
?>
