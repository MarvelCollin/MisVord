<?php
/**
 * Simple VideoSDK Debug Script
 * This will help us identify the exact issue with environment loading
 */

echo "=== VideoSDK Environment Debug ===\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Working Directory: " . getcwd() . "\n";
echo "Script Directory: " . __DIR__ . "\n\n";

// Check if .env file exists
$envFile = __DIR__ . '/.env';
echo "Checking .env file at: $envFile\n";
echo ".env file exists: " . (file_exists($envFile) ? "YES" : "NO") . "\n";

if (file_exists($envFile)) {
    echo "Reading .env file directly...\n";
    $content = file_get_contents($envFile);
    $lines = explode("\n", $content);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, 'VIDEOSDK_') === 0) {
            echo "Found: $line\n";
        }
    }
}

echo "\n=== Testing getenv() function ===\n";
echo "VIDEOSDK_API_KEY (getenv): " . (getenv('VIDEOSDK_API_KEY') ?: 'NOT FOUND') . "\n";
echo "VIDEOSDK_SECRET_KEY (getenv): " . (getenv('VIDEOSDK_SECRET_KEY') ?: 'NOT FOUND') . "\n";

echo "\n=== Testing \$_ENV superglobal ===\n";
echo "VIDEOSDK_API_KEY (\$_ENV): " . ($_ENV['VIDEOSDK_API_KEY'] ?? 'NOT FOUND') . "\n";
echo "VIDEOSDK_SECRET_KEY (\$_ENV): " . ($_ENV['VIDEOSDK_SECRET_KEY'] ?? 'NOT FOUND') . "\n";

echo "\n=== Testing VideoSDK Config Class ===\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    
    echo "VideoSDK config file loaded successfully\n";
    
    // Try to initialize
    VideoSDKConfig::init();
    echo "VideoSDK init successful\n";
    
    $apiKey = VideoSDKConfig::getApiKey();
    $secretKey = VideoSDKConfig::getSecretKey();
    
    echo "API Key: " . ($apiKey ? substr($apiKey, 0, 8) . "..." : 'NOT FOUND') . "\n";
    echo "Secret Key: " . ($secretKey ? substr($secretKey, 0, 8) . "..." : 'NOT FOUND') . "\n";
    
    // Try to generate token
    $token = VideoSDKConfig::generateToken();
    echo "Token generation: " . ($token ? "SUCCESS (" . substr($token, 0, 20) . "...)" : "FAILED") . "\n";
    
    // Get frontend config
    $frontendConfig = VideoSDKConfig::getFrontendConfig();
    echo "Frontend config: " . ($frontendConfig ? "SUCCESS" : "FAILED") . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Environment Variables Dump ===\n";
foreach ($_ENV as $key => $value) {
    if (strpos($key, 'VIDEOSDK') !== false) {
        echo "$key = $value\n";
    }
}

echo "\n=== Testing putenv() ===\n";
// Manually set environment variables
putenv("VIDEOSDK_API_KEY=8ad2dbcd-638d-4fbb-999c-9a48a83caa15");
putenv("VIDEOSDK_SECRET_KEY=2894abac68603be19aa80b781cad6683eebfb922f496c22cc46b19ad91647d4e");

echo "After putenv() - API Key: " . getenv('VIDEOSDK_API_KEY') . "\n";
echo "After putenv() - Secret Key: " . getenv('VIDEOSDK_SECRET_KEY') . "\n";

// Test VideoSDK config again
try {
    // Reset static variables
    $reflection = new ReflectionClass('VideoSDKConfig');
    $apiKeyProperty = $reflection->getProperty('apiKey');
    $apiKeyProperty->setAccessible(true);
    $apiKeyProperty->setValue(null, null);
    
    $secretKeyProperty = $reflection->getProperty('secretKey');
    $secretKeyProperty->setAccessible(true);
    $secretKeyProperty->setValue(null, null);
    
    VideoSDKConfig::init();
    echo "VideoSDK config with putenv(): SUCCESS\n";
    
} catch (Exception $e) {
    echo "VideoSDK config with putenv(): FAILED - " . $e->getMessage() . "\n";
}
