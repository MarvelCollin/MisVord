<?php
require_once __DIR__ . '/database/models/ServerInvite.php';
require_once __DIR__ . '/database/models/Server.php';

echo "Testing ServerInvite::findActiveByServer method...\n";

try {
    // Test with a server ID that exists
    $result = ServerInvite::findActiveByServer(1);
    echo "SUCCESS: Method executed without errors\n";
    echo "Result: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}

echo "\nTesting ServerInvite::create method...\n";

try {
    $data = [
        'server_id' => 1,
        'inviter_user_id' => 1,
        'invite_link' => 'test_' . time()
    ];
    
    $result = ServerInvite::create($data);
    echo "SUCCESS: Create method executed without errors\n";
    echo "Result: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}
?>
