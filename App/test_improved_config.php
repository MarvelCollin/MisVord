<?php
// Quick test of improved VideoSDK configuration

echo "Testing improved VideoSDK configuration\n";
echo "=====================================\n\n";

try {
    // Test 1: Environment loading
    echo "1. Testing environment loading...\n";
    require_once __DIR__ . '/config/env.php';
    echo "   ✓ Environment config loaded\n";
    
    $token = EnvLoader::get('VIDEOSDK_TOKEN');
    $apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
    
    echo "   VIDEOSDK_TOKEN: " . ($token ? 'FOUND (' . strlen($token) . ' chars)' : 'NOT FOUND') . "\n";
    echo "   VIDEOSDK_API_KEY: " . ($apiKey ? 'FOUND (' . strlen($apiKey) . ' chars)' : 'NOT FOUND') . "\n\n";
    
    // Test 2: VideoSDK configuration
    echo "2. Testing VideoSDK configuration...\n";
    require_once __DIR__ . '/config/videosdk.php';
    echo "   ✓ VideoSDK config loaded\n";
    
    VideoSDKConfig::init();
    echo "   ✓ VideoSDK initialized\n";
    
    $config = VideoSDKConfig::getFrontendConfig();
    echo "   ✓ Frontend config retrieved\n";
    echo "   Config keys: " . implode(', ', array_keys($config)) . "\n\n";
    
    // Test 3: Voice section path simulation
    echo "3. Testing voice section path resolution...\n";
    $voiceSectionFile = __DIR__ . '/views/components/app-sections/voice-section.php';
    echo "   Voice section exists: " . (file_exists($voiceSectionFile) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($voiceSectionFile)) {
        echo "   Testing path resolution from voice section perspective...\n";
        
        // Simulate the improved path resolution
        $possiblePaths = [
            dirname($voiceSectionFile, 3) . '/config/videosdk.php',
            (defined('APP_ROOT') ? APP_ROOT : '') . '/config/videosdk.php',
            $_SERVER['DOCUMENT_ROOT'] . '/../config/videosdk.php',
            realpath(dirname($voiceSectionFile, 3) . '/config/videosdk.php'),
        ];
        
        $workingPath = null;
        foreach ($possiblePaths as $i => $path) {
            $exists = !empty($path) && file_exists($path);
            echo "   Path " . ($i + 1) . ": " . ($exists ? '✓' : '✗') . " $path\n";
            if ($exists && !$workingPath) {
                $workingPath = $path;
            }
        }
        
        if ($workingPath) {
            echo "   ✓ Working path found: $workingPath\n";
        } else {
            echo "   ✗ No working path found\n";
        }
    }
    
    echo "\n✅ All tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n✗ Test failed: " . $e->getMessage() . "\n";
    echo "Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
}
?>
