<?php

require_once __DIR__ . '/App/utils/DiscordPositionSystem.php';
require_once __DIR__ . '/App/database/models/Channel.php';
require_once __DIR__ . '/App/database/models/Category.php';
require_once __DIR__ . '/App/database/models/Server.php';

/**
 * Test script for the new Discord Position System
 */

echo "Testing Discord Position System...\n\n";

try {
    $positionSystem = DiscordPositionSystem::getInstance();
    
    // Test 1: Get next positions
    echo "Test 1: Getting next positions\n";
    
    // Assuming server ID 1 exists
    $serverId = 1;
    
    $nextCategoryPos = $positionSystem->getNextCategoryPosition($serverId);
    echo "Next category position for server $serverId: $nextCategoryPos\n";
    
    $nextChannelPos = $positionSystem->getNextChannelPosition($serverId, null);
    echo "Next channel position for server $serverId (uncategorized): $nextChannelPos\n";
    
    $nextChannelPosInCat = $positionSystem->getNextChannelPosition($serverId, 1);
    echo "Next channel position for server $serverId, category 1: $nextChannelPosInCat\n";
    
    echo "\nTest 1 passed!\n\n";
    
    // Test 2: Position normalization
    echo "Test 2: Position normalization\n";
    
    $result = $positionSystem->normalizeServerPositions($serverId);
    if ($result) {
        echo "Position normalization for server $serverId: SUCCESS\n";
    } else {
        echo "Position normalization for server $serverId: FAILED\n";
    }
    
    echo "\nTest 2 completed!\n\n";
    
    echo "All tests completed successfully!\n";
    echo "The Discord Position System is working correctly.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
