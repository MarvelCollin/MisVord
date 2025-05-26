<?php
// Simple test to verify VideoSDK configuration in call page
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/videosdk.php';

echo "=== VideoSDK Call Page Configuration Test ===\n";

try {
    VideoSDKConfig::init();
    $videoSDKConfig = VideoSDKConfig::getFrontendConfig();
    
    if ($videoSDKConfig) {
        echo "✅ VideoSDK Configuration Generated Successfully\n";
        echo "API Key: " . substr($videoSDKConfig['apiKey'], 0, 8) . "...\n";
        echo "Token: " . substr($videoSDKConfig['token'], 0, 20) . "...\n";
        echo "Is Production: " . ($videoSDKConfig['isProduction'] ? 'true' : 'false') . "\n";
        echo "Domain: " . $videoSDKConfig['domain'] . "\n";
        
        // Test meta tag generation
        echo "\n=== Meta Tag Test ===\n";
        echo '<meta name="videosdk-api-key" content="' . $videoSDKConfig['apiKey'] . '">' . "\n";
        echo '<meta name="videosdk-token" content="' . $videoSDKConfig['token'] . '">' . "\n";
        
    } else {
        echo "❌ VideoSDK Configuration Failed\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
?>
