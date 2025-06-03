<?php
// Web context debug script for VideoSDK
header('Content-Type: text/html; charset=utf-8');

echo "<html><head><title>VideoSDK Web Debug</title></head><body>";
echo "<h1>VideoSDK Web Context Debug</h1>";

// Get current working directory context
echo "<h2>Working Directory Context</h2>";
echo "<p>Current working directory: " . getcwd() . "</p>";
echo "<p>Script file: " . __FILE__ . "</p>";
echo "<p>Script directory: " . __DIR__ . "</p>";
echo "<p>Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET') . "</p>";

// Test environment loading with explicit path resolution
echo "<h2>Environment Loading Test</h2>";
$configDir = dirname(__DIR__) . '/config';
echo "<p>Config directory: " . $configDir . "</p>";
echo "<p>Config directory exists: " . (is_dir($configDir) ? 'YES' : 'NO') . "</p>";

$envPath = $configDir . '/env.php';
echo "<p>Env config path: " . $envPath . "</p>";
echo "<p>Env config exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "</p>";

try {
    require_once $envPath;
    echo "<p style='color: green;'>✓ Environment loader included successfully</p>";
    
    // Force reload environment variables
    EnvLoader::load();
    echo "<p style='color: green;'>✓ Environment variables loaded</p>";
    
    $token = EnvLoader::get('VIDEOSDK_TOKEN');
    $apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
    
    echo "<p>VIDEOSDK_TOKEN: " . ($token ? "FOUND (" . strlen($token) . " chars)" : "NOT FOUND") . "</p>";
    echo "<p>VIDEOSDK_API_KEY: " . ($apiKey ? "FOUND (" . strlen($apiKey) . " chars)" : "NOT FOUND") . "</p>";
    
    // Show all environment variables for debugging
    echo "<h3>All Loaded Environment Variables:</h3>";
    $allVars = EnvLoader::getAll();
    echo "<p>Total variables loaded: " . count($allVars) . "</p>";
    
    foreach ($allVars as $key => $value) {
        // Mask sensitive data
        if (strpos($key, 'PASS') !== false || 
            strpos($key, 'SECRET') !== false || 
            strpos($key, 'TOKEN') !== false) {
            $displayValue = substr($value, 0, 8) . '...(masked)';
        } else {
            $displayValue = htmlspecialchars($value);
        }
        echo "<p>$key = $displayValue</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Environment error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")</p>";
}

// Test VideoSDK Configuration
echo "<h2>VideoSDK Configuration Test</h2>";
$videoSdkPath = $configDir . '/videosdk.php';
echo "<p>VideoSDK config path: " . $videoSdkPath . "</p>";
echo "<p>VideoSDK config exists: " . (file_exists($videoSdkPath) ? 'YES' : 'NO') . "</p>";

try {
    require_once $videoSdkPath;
    echo "<p style='color: green;'>✓ VideoSDK config included successfully</p>";
    
    VideoSDKConfig::init();
    echo "<p style='color: green;'>✓ VideoSDK initialized successfully</p>";
    
    $config = VideoSDKConfig::getFrontendConfig();
    echo "<p>Frontend config retrieved: " . (count($config) > 0 ? "YES" : "NO") . "</p>";
    echo "<h3>VideoSDK Configuration:</h3>";
    foreach ($config as $key => $value) {
        if ($key === 'token' || $key === 'apiKey') {
            $displayValue = $value ? substr($value, 0, 10) . '...(masked)' : 'NOT SET';
        } else {
            $displayValue = htmlspecialchars($value);
        }
        echo "<p>$key: $displayValue</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ VideoSDK error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")</p>";
    echo "<p>Stack trace:</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "</body></html>";
?>
