<?php
// Test server object creation
require_once __DIR__ . '/database/models/Server.php';

try {
    // Test creating a Server object with sample data
    $testData = [
        'id' => 1,
        'name' => 'Test Server',
        'image_url' => 'test.jpg',
        'description' => 'Test description'
    ];
    
    $server = new Server($testData);
    
    echo "Server object created successfully\n";
    echo "Type: " . gettype($server) . "\n";
    echo "Class: " . get_class($server) . "\n";
    echo "ID: " . $server->id . "\n";
    echo "Name: " . $server->name . "\n";
    echo "Image URL: " . $server->image_url . "\n";
    
    // Test array creation
    $serverArray = ['id' => 1, 'name' => 'Test Server', 'image_url' => 'test.jpg'];
    echo "\nArray test:\n";
    echo "Type: " . gettype($serverArray) . "\n";
    echo "ID: " . $serverArray['id'] . "\n";
    echo "Name: " . $serverArray['name'] . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
