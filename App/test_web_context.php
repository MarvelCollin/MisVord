<?php
// Test VideoSDK configuration from different working directory (simulating web context)

echo "Testing VideoSDK from different working directory\n";
echo "===============================================\n\n";

// Change to public directory to simulate web context
$publicDir = __DIR__ . '/public';
echo "Original working directory: " . getcwd() . "\n";

if (is_dir($publicDir)) {
    chdir($publicDir);
    echo "Changed to public directory: " . getcwd() . "\n\n";
} else {
    echo "Public directory not found, staying in current directory\n\n";
}

try {
    // Test path resolution from web context
    echo "1. Testing path resolution from public directory...\n";
    
    $configPaths = [
        'up1_config' => dirname(__DIR__) . '/config/videosdk.php',
        'up2_config' => dirname(__DIR__, 2) . '/config/videosdk.php',
    ];
    
    $workingPath = null;
    foreach ($configPaths as $name => $path) {
        $exists = file_exists($path);
        echo "   $name: " . ($exists ? '✓' : '✗') . " $path\n";
        if ($exists && !$workingPath) {
            $workingPath = $path;
        }
    }
    
    if (!$workingPath) {
        throw new Exception('No VideoSDK config path found from public directory');
    }
    
    echo "   Using: $workingPath\n\n";
    
    // Test loading configuration
    echo "2. Testing configuration loading...\n";
    require_once $workingPath;
    echo "   ✓ VideoSDK config loaded\n";
    
    VideoSDKConfig::init();
    echo "   ✓ VideoSDK initialized\n";
    
    $config = VideoSDKConfig::getFrontendConfig();
    echo "   ✓ Frontend config retrieved\n";
    echo "   Config keys: " . implode(', ', array_keys($config)) . "\n";
    
    // Test token availability
    $token = VideoSDKConfig::getToken();
    $apiKey = VideoSDKConfig::getApiKey();
    
    echo "   API Key: " . ($apiKey ? 'SET' : 'NOT SET') . "\n";
    echo "   Token: " . ($token ? 'SET' : 'NOT SET') . "\n";
    
    echo "\n✅ VideoSDK configuration works from web context!\n";
    
} catch (Exception $e) {
    echo "\n✗ Test failed: " . $e->getMessage() . "\n";
    echo "Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

// Restore original working directory
chdir(dirname(__DIR__));
echo "\nRestored working directory: " . getcwd() . "\n";
?>
