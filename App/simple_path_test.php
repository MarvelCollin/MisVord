<?php
// Simple path resolution test for VideoSDK issue

echo "=== VideoSDK Path Resolution Test ===\n\n";

// Test current working directory
echo "Current working directory: " . getcwd() . "\n";
echo "This script location: " . __FILE__ . "\n";
echo "This script directory: " . __DIR__ . "\n\n";

// Test path resolution from voice-section.php perspective
$voiceSectionPath = __DIR__ . '/views/components/app-sections/voice-section.php';
echo "Voice section full path: $voiceSectionPath\n";
echo "Voice section exists: " . (file_exists($voiceSectionPath) ? 'YES' : 'NO') . "\n";

if (file_exists($voiceSectionPath)) {
    $voiceDir = dirname($voiceSectionPath);
    echo "Voice section directory: $voiceDir\n";
    
    // Simulate dirname(__DIR__, 3) from voice-section.php
    $configDir = dirname($voiceDir, 3) . '/config';
    echo "Config directory (dirname 3 levels up): $configDir\n";
    echo "Config directory exists: " . (is_dir($configDir) ? 'YES' : 'NO') . "\n";
    
    $videoSdkConfigPath = $configDir . '/videosdk.php';
    echo "VideoSDK config path: $videoSdkConfigPath\n";
    echo "VideoSDK config exists: " . (file_exists($videoSdkConfigPath) ? 'YES' : 'NO') . "\n";
    
    $envConfigPath = $configDir . '/env.php';
    echo "Env config path: $envConfigPath\n";
    echo "Env config exists: " . (file_exists($envConfigPath) ? 'YES' : 'NO') . "\n\n";
    
    // Test loading the configuration
    echo "=== Testing Configuration Loading ===\n";
    
    if (file_exists($envConfigPath)) {
        try {
            require_once $envConfigPath;
            echo "✓ Environment config loaded successfully\n";
            
            $token = EnvLoader::get('VIDEOSDK_TOKEN');
            echo "VIDEOSDK_TOKEN found: " . ($token ? 'YES (' . strlen($token) . ' chars)' : 'NO') . "\n";
            
        } catch (Exception $e) {
            echo "✗ Environment config error: " . $e->getMessage() . "\n";
        }
    }
    
    if (file_exists($videoSdkConfigPath)) {
        try {
            require_once $videoSdkConfigPath;
            echo "✓ VideoSDK config loaded successfully\n";
            
            VideoSDKConfig::init();
            echo "✓ VideoSDK initialized successfully\n";
            
        } catch (Exception $e) {
            echo "✗ VideoSDK config error: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n=== Test Complete ===\n";
?>
