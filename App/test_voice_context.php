<?php

echo "Simulating voice-section.php include context\n";
echo "==========================================\n\n";

// Simulate being included from app-layout.php
echo "1. Current working directory: " . getcwd() . "\n";
echo "2. Script file: " . __FILE__ . "\n";
echo "3. Script directory: " . dirname(__FILE__) . "\n\n";

// Test the exact path resolution as done in voice-section.php
echo "4. Testing path resolution from simulated include context:\n";

// From voice-section.php: dirname(__DIR__, 3) . '/config/videosdk.php'
// where __DIR__ would be the voice-section.php directory

// Simulate voice-section.php __DIR__
$voiceSectionDir = dirname(__FILE__) . '/views/components/app-sections';
echo "   Voice section __DIR__ simulation: $voiceSectionDir\n";

// dirname(__DIR__, 3) from voice-section.php
$configPath1 = dirname($voiceSectionDir, 3) . '/config/videosdk.php';
echo "   Path attempt 1: $configPath1\n";
echo "   Exists: " . (file_exists($configPath1) ? 'YES' : 'NO') . "\n";

$realPath1 = realpath($configPath1);
echo "   Realpath: " . ($realPath1 ?: 'FALSE') . "\n";

if (!$realPath1) {
    $fallbackPath = dirname($voiceSectionDir, 3) . '/config/videosdk.php';
    echo "   Fallback path: $fallbackPath\n";
    echo "   Fallback exists: " . (file_exists($fallbackPath) ? 'YES' : 'NO') . "\n";
}

echo "\n5. Testing actual include simulation:\n";

// Create a temporary file that simulates the voice-section.php include
$tempContent = '<?php
// Simulate voice-section.php content
echo "Inside simulated voice-section.php\\n";
echo "Working directory: " . getcwd() . "\\n";
echo "__FILE__: " . __FILE__ . "\\n";
echo "__DIR__: " . __DIR__ . "\\n";

// Test path resolution as in original
$configPath = realpath(dirname(__DIR__, 3) . "/config/videosdk.php");
echo "Realpath result: " . ($configPath ?: "FALSE") . "\\n";

if (!$configPath) {
    $configPath = dirname(__DIR__, 3) . "/config/videosdk.php";
    echo "Fallback path: " . $configPath . "\\n";
}

echo "Final config path: " . $configPath . "\\n";
echo "Path exists: " . (file_exists($configPath) ? "YES" : "NO") . "\\n";

if (file_exists($configPath)) {
    try {
        require_once $configPath;
        echo "videosdk.php loaded successfully\\n";
        
        VideoSDKConfig::init();
        echo "VideoSDK initialized successfully\\n";
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\\n";
    }
} else {
    echo "Config file not found!\\n";
}
?>';

// Write temporary test file to simulate voice-section.php location
$tempDir = __DIR__ . '/views/components/app-sections';
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
}

$tempFile = $tempDir . '/test_voice_context.php';
file_put_contents($tempFile, $tempContent);

echo "   Created temporary test file: $tempFile\n";

// Include the temporary file to simulate the exact context
echo "   Including temporary file to test context:\n";
include $tempFile;

// Clean up
unlink($tempFile);

echo "\n6. Testing environment variables in current context:\n";
try {
    require_once __DIR__ . '/config/env.php';
    echo "   VIDEOSDK_TOKEN: " . (EnvLoader::get('VIDEOSDK_TOKEN') ? 'FOUND' : 'NOT FOUND') . "\n";
    echo "   VIDEOSDK_API_KEY: " . (EnvLoader::get('VIDEOSDK_API_KEY') ? 'FOUND' : 'NOT FOUND') . "\n";
} catch (Exception $e) {
    echo "   Error loading env: " . $e->getMessage() . "\n";
}

echo "\nTest completed!\n";
