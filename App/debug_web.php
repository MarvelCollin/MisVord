<?php
// Web context debug script to test VideoSDK configuration

echo "<html><head><title>VideoSDK Web Debug</title></head><body>";
echo "<h1>VideoSDK Web Context Debug</h1>";

// Test 1: Environment loading
echo "<h2>1. Environment Variables Loading</h2>";
try {
    require_once __DIR__ . '/config/env.php';
    echo "<p style='color: green;'>✓ Environment loader included successfully</p>";
    
    $token = EnvLoader::get('VIDEOSDK_TOKEN');
    $apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
    
    echo "<p>VIDEOSDK_TOKEN: " . ($token ? "FOUND (" . strlen($token) . " chars)" : "NOT FOUND") . "</p>";
    echo "<p>VIDEOSDK_API_KEY: " . ($apiKey ? "FOUND (" . strlen($apiKey) . " chars)" : "NOT FOUND") . "</p>";
    
    // Show current working directory
    echo "<p>Current working directory: " . getcwd() . "</p>";
    echo "<p>Script file: " . __FILE__ . "</p>";
    echo "<p>Script directory: " . __DIR__ . "</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Environment error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Test 2: VideoSDK Configuration
echo "<h2>2. VideoSDK Configuration</h2>";
try {
    require_once __DIR__ . '/config/videosdk.php';
    echo "<p style='color: green;'>✓ VideoSDK config included successfully</p>";
    
    VideoSDKConfig::init();
    echo "<p style='color: green;'>✓ VideoSDK initialized successfully</p>";
    
    $config = VideoSDKConfig::getFrontendConfig();
    echo "<p>Frontend config retrieved: " . (count($config) > 0 ? "YES" : "NO") . "</p>";
    echo "<pre>" . print_r($config, true) . "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ VideoSDK error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")</p>";
}

// Test 3: Voice section simulation
echo "<h2>3. Voice Section Path Simulation</h2>";
$voiceSectionPath = __DIR__ . '/views/components/app-sections/voice-section.php';
echo "<p>Voice section path: " . $voiceSectionPath . "</p>";
echo "<p>Voice section exists: " . (file_exists($voiceSectionPath) ? "YES" : "NO") . "</p>";

if (file_exists($voiceSectionPath)) {
    echo "<h3>Simulating voice-section.php include:</h3>";
    
    // Simulate the exact path resolution from voice-section.php
    $configPathFromVoice = realpath(dirname($voiceSectionPath, 3) . '/config/videosdk.php');
    echo "<p>Config path from voice-section: " . ($configPathFromVoice ?: 'FALSE') . "</p>";
    
    if (!$configPathFromVoice) {
        $configPathFromVoice = dirname($voiceSectionPath, 3) . '/config/videosdk.php';
        echo "<p>Fallback config path: " . $configPathFromVoice . "</p>";
    }
    
    echo "<p>Config file exists from voice perspective: " . (file_exists($configPathFromVoice) ? "YES" : "NO") . "</p>";
}

// Test 4: Check different environment access methods
echo "<h2>4. Environment Access Methods</h2>";
echo "<p>getenv('VIDEOSDK_TOKEN'): " . (getenv('VIDEOSDK_TOKEN') ? "SET" : "NOT SET") . "</p>";
echo "<p>\$_SERVER['VIDEOSDK_TOKEN']: " . (isset($_SERVER['VIDEOSDK_TOKEN']) ? "SET" : "NOT SET") . "</p>";
echo "<p>\$_ENV['VIDEOSDK_TOKEN']: " . (isset($_ENV['VIDEOSDK_TOKEN']) ? "SET" : "NOT SET") . "</p>";

echo "</body></html>";
?>
