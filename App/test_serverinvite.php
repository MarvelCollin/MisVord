<?php
// Test script to verify ServerInvite model is working
require_once __DIR__ . '/database/models/ServerInvite.php';

echo "Testing ServerInvite model...\n";

try {
    // Test finding active invite by server
    $invite = ServerInvite::findActiveByServer(1);
    
    if ($invite) {
        echo "✅ Found invite: " . $invite->invite_link . "\n";
    } else {
        echo "⚠️ No invite found for server 1\n";
    }
    
    echo "✅ ServerInvite model is working correctly!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
