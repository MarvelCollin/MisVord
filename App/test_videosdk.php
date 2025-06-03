<?php

echo "VideoSDK Configuration Debug Test\n";
echo "================================\n\n";

// Test from the voice-section.php perspective
echo "1. Testing path resolution from voice-section.php perspective:\n";

// Simulate the path resolution from voice-section.php
$currentDir = dirname(__FILE__) . '/views/components/app-sections';
echo "   Simulated voice-section.php directory: $currentDir\n";

$configPath = realpath(dirname(__FILE__) . '/config/videosdk.php');
echo "   Realpath result: " . ($configPath ?: 'FALSE') . "\n";

if (!$configPath) {
    $configPath = dirname(__FILE__) . '/config/videosdk.php';
    echo "   Fallback path: $configPath\n";
}

echo "   File exists: " . (file_exists($configPath) ? 'YES' : 'NO') . "\n";
echo "   Is readable: " . (is_readable($configPath) ? 'YES' : 'NO') . "\n\n";

// Test 2: Load environment variables first
echo "2. Testing environment loading:\n";
try {
    require_once __DIR__ . '/config/env.php';
    echo "   ✓ env.php loaded successfully\n";
    echo "   EnvLoader loaded: " . (EnvLoader::isLoaded() ? 'YES' : 'NO') . "\n";
    
    $token = EnvLoader::get('VIDEOSDK_TOKEN');
    echo "   VIDEOSDK_TOKEN: " . ($token ? 'FOUND (' . strlen($token) . ' chars)' : 'NOT FOUND') . "\n";
    
    $apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
    echo "   VIDEOSDK_API_KEY: " . ($apiKey ? 'FOUND (' . strlen($apiKey) . ' chars)' : 'NOT FOUND') . "\n";
    
} catch (Exception $e) {
    echo "   ✗ Error loading environment: " . $e->getMessage() . "\n";
}

echo "\n3. Testing VideoSDK configuration loading:\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    echo "   ✓ videosdk.php loaded successfully\n";
    
    // Test initialization
    VideoSDKConfig::init();
    echo "   ✓ VideoSDK initialized successfully\n";
    
    // Test getting configuration
    $config = VideoSDKConfig::getFrontendConfig();
    echo "   ✓ Frontend config retrieved\n";
    echo "   Config keys: " . implode(', ', array_keys($config)) . "\n";
    
    // Test individual methods
    $apiKey = VideoSDKConfig::getApiKey();
    echo "   API Key: " . ($apiKey ? 'SET (' . substr($apiKey, 0, 8) . '...)' : 'NOT SET') . "\n";
    
    $token = VideoSDKConfig::getToken();
    echo "   Token: " . ($token ? 'SET (' . substr($token, 0, 20) . '...)' : 'NOT SET') . "\n";
    
} catch (Exception $e) {
    echo "   ✗ VideoSDK Error: " . $e->getMessage() . "\n";
    echo "   Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
    echo "   Stack trace:\n";
    echo "   " . str_replace("\n", "\n   ", $e->getTraceAsString()) . "\n";
}

echo "\n4. Testing alternative path resolution methods:\n";

$possiblePaths = [
    dirname(__FILE__) . '/config/videosdk.php',
    __DIR__ . '/config/videosdk.php',
    dirname(__DIR__) . '/config/videosdk.php',
    dirname(dirname(__DIR__)) . '/config/videosdk.php',
    dirname(dirname(dirname(__DIR__))) . '/config/videosdk.php',
];

foreach ($possiblePaths as $i => $path) {
    echo "   Path " . ($i + 1) . ": $path\n";
    echo "   Exists: " . (file_exists($path) ? 'YES' : 'NO') . "\n";
    if (file_exists($path)) {
        echo "   Real path: " . realpath($path) . "\n";
    }
    echo "\n";
}

echo "Test completed!\n";
