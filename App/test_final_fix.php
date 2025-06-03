<?php
/**
 * Final Test: VideoSDK Configuration in Docker
 * Tests if the VideoSDK error is resolved
 */

echo "=== FINAL FIX VERIFICATION ===\n\n";

// Step 1: Test environment detection (Docker vs Local)
echo "1. Testing Environment Detection:\n";
$isDocker = (
    getenv('IS_DOCKER') === 'true' || 
    isset($_SERVER['IS_DOCKER']) || 
    getenv('CONTAINER') !== false ||
    isset($_SERVER['CONTAINER']) ||
    file_exists('/.dockerenv')
);
echo "   Environment: " . ($isDocker ? "DOCKER" : "LOCAL") . "\n\n";

// Step 2: Test environment variable access
echo "2. Testing Environment Variable Access:\n";
echo "   VIDEOSDK_TOKEN via \$_SERVER: " . (isset($_SERVER['VIDEOSDK_TOKEN']) ? 'SET' : 'NOT SET') . "\n";
echo "   VIDEOSDK_TOKEN via getenv(): " . (getenv('VIDEOSDK_TOKEN') ? 'SET' : 'NOT SET') . "\n";
echo "   VIDEOSDK_API_KEY via \$_SERVER: " . (isset($_SERVER['VIDEOSDK_API_KEY']) ? 'SET' : 'NOT SET') . "\n";
echo "   VIDEOSDK_API_KEY via getenv(): " . (getenv('VIDEOSDK_API_KEY') ? 'SET' : 'NOT SET') . "\n\n";

// Step 3: Test enhanced environment loader
echo "3. Testing Enhanced Environment Loader:\n";
try {
    require_once __DIR__ . '/config/env.php';
    echo "   ✓ Environment loader loaded\n";
    
    $token = EnvLoader::get('VIDEOSDK_TOKEN');
    $apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
    
    echo "   VIDEOSDK_TOKEN: " . ($token ? 'FOUND (' . strlen($token) . ' chars)' : 'NOT FOUND') . "\n";
    echo "   VIDEOSDK_API_KEY: " . ($apiKey ? 'FOUND (' . strlen($apiKey) . ' chars)' : 'NOT FOUND') . "\n";
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Step 4: Test enhanced VideoSDK configuration
echo "4. Testing Enhanced VideoSDK Configuration:\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    echo "   ✓ VideoSDK config loaded\n";
    
    VideoSDKConfig::init();
    echo "   ✓ VideoSDK initialized successfully\n";
    
    $apiKey = VideoSDKConfig::getApiKey();
    $token = VideoSDKConfig::getToken();
    
    echo "   API Key: " . ($apiKey ? 'SET' : 'NOT SET') . "\n";
    echo "   Token: " . ($token ? 'SET' : 'NOT SET') . "\n";
    
    if ($apiKey && $token) {
        echo "   ✅ ALL VIDEOSDK CREDENTIALS LOADED SUCCESSFULLY\n";
        echo "   🎉 THE ERROR SHOULD BE RESOLVED!\n";
    } else {
        echo "   ❌ Some credentials are missing\n";
    }
    
} catch (Exception $e) {
    echo "   ✗ VideoSDK Error: " . $e->getMessage() . "\n";
    echo "   ❌ THE ERROR STILL EXISTS\n";
}

echo "\n=== TEST COMPLETE ===\n";
?>
