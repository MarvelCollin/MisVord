<?php
// Simple Docker Configuration Test Script

echo "=== VideoSDK Docker Configuration Test ===\n\n";

// Test environment detection
$isDocker = getenv('IS_DOCKER') === 'true' || isset($_SERVER['IS_DOCKER']);
echo "Running in Docker: " . ($isDocker ? 'YES' : 'NO') . "\n";
echo "Current working directory: " . getcwd() . "\n\n";

// Test direct environment variable access
echo "=== Direct Environment Variable Access ===\n";
$envVars = ['VIDEOSDK_TOKEN', 'VIDEOSDK_API_KEY', 'VIDEOSDK_SECRET_KEY'];

foreach ($envVars as $var) {
    $serverValue = $_SERVER[$var] ?? null;
    $getenvValue = getenv($var);
    $envValue = $_ENV[$var] ?? null;
    
    echo "$var:\n";
    echo "  \$_SERVER: " . ($serverValue ? 'SET (' . strlen($serverValue) . ' chars)' : 'NOT SET') . "\n";
    echo "  getenv(): " . ($getenvValue ? 'SET (' . strlen($getenvValue) . ' chars)' : 'NOT SET') . "\n";
    echo "  \$_ENV: " . ($envValue ? 'SET (' . strlen($envValue) . ' chars)' : 'NOT SET') . "\n\n";
}

// Test environment loader
echo "=== Environment Loader Test ===\n";
try {
    require_once __DIR__ . '/config/env.php';
    echo "✓ Environment loader included\n";
    
    foreach ($envVars as $var) {
        $value = EnvLoader::get($var);
        echo "$var via EnvLoader: " . ($value ? 'FOUND (' . strlen($value) . ' chars)' : 'NOT FOUND') . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ Environment loader error: " . $e->getMessage() . "\n";
}

// Test VideoSDK configuration
echo "\n=== VideoSDK Configuration Test ===\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    echo "✓ VideoSDK config included\n";
    
    VideoSDKConfig::init();
    echo "✓ VideoSDK initialized\n";
    
    $token = VideoSDKConfig::getToken();
    $apiKey = VideoSDKConfig::getApiKey();
    
    echo "API Key: " . ($apiKey ? 'SET' : 'NOT SET') . "\n";
    echo "Token: " . ($token ? 'SET' : 'NOT SET') . "\n";
    
    $config = VideoSDKConfig::getFrontendConfig();
    echo "Frontend config keys: " . implode(', ', array_keys($config)) . "\n";
    
} catch (Exception $e) {
    echo "✗ VideoSDK error: " . $e->getMessage() . "\n";
    echo "Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
}

echo "\n=== Test Complete ===\n";
?>
