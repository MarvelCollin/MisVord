<?php
/**
 * Comprehensive Docker VideoSDK Configuration Test
 * This script tests the VideoSDK configuration fix in Docker environment
 */

echo "🐳 Docker VideoSDK Configuration Fix Test\n";
echo "=========================================\n\n";

// Test 1: Environment Detection
echo "1. Environment Detection Test:\n";
$detectionMethods = [
    'getenv(IS_DOCKER)' => getenv('IS_DOCKER'),
    '$_SERVER[IS_DOCKER]' => $_SERVER['IS_DOCKER'] ?? 'NOT SET',
    'getenv(CONTAINER)' => getenv('CONTAINER'),
    '$_SERVER[CONTAINER]' => $_SERVER['CONTAINER'] ?? 'NOT SET',
    'file_exists(/.dockerenv)' => file_exists('/.dockerenv') ? 'true' : 'false'
];

foreach ($detectionMethods as $method => $value) {
    echo "   $method: " . ($value ? $value : 'NOT SET') . "\n";
}

$isDocker = (
    getenv('IS_DOCKER') === 'true' || 
    isset($_SERVER['IS_DOCKER']) || 
    getenv('CONTAINER') !== false ||
    isset($_SERVER['CONTAINER']) ||
    file_exists('/.dockerenv')
);

echo "   Final Docker Detection: " . ($isDocker ? '✅ DOCKER' : '❌ NOT DOCKER') . "\n\n";

// Test 2: Direct Environment Variable Access
echo "2. Direct Environment Variable Access Test:\n";
$envVars = ['VIDEOSDK_TOKEN', 'VIDEOSDK_API_KEY', 'VIDEOSDK_SECRET_KEY'];

foreach ($envVars as $var) {
    echo "   $var:\n";
    echo "     \$_SERVER: " . (isset($_SERVER[$var]) ? 'SET (' . strlen($_SERVER[$var]) . ' chars)' : 'NOT SET') . "\n";
    echo "     getenv(): " . (getenv($var) ? 'SET (' . strlen(getenv($var)) . ' chars)' : 'NOT SET') . "\n";
    echo "     \$_ENV: " . (isset($_ENV[$var]) ? 'SET (' . strlen($_ENV[$var]) . ' chars)' : 'NOT SET') . "\n";
}
echo "\n";

// Test 3: EnvLoader Test
echo "3. EnvLoader Configuration Test:\n";
try {
    require_once __DIR__ . '/config/env.php';
    echo "   ✅ EnvLoader loaded successfully\n";
    
    // Force reload
    EnvLoader::load();
    echo "   ✅ Environment variables loaded\n";
    
    // Test specific variables
    foreach ($envVars as $var) {
        $value = EnvLoader::get($var);
        echo "   $var: " . ($value ? 'FOUND (' . strlen($value) . ' chars)' : 'NOT FOUND') . "\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ EnvLoader error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: VideoSDK Configuration Test
echo "4. VideoSDK Configuration Test:\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    echo "   ✅ VideoSDK config loaded\n";
    
    VideoSDKConfig::init();
    echo "   ✅ VideoSDK initialized successfully\n";
    
    $apiKey = VideoSDKConfig::getApiKey();
    $token = VideoSDKConfig::getToken();
    $secretKey = VideoSDKConfig::getSecretKey();
    
    echo "   API Key: " . ($apiKey ? 'SET (' . strlen($apiKey) . ' chars)' : 'NOT SET') . "\n";
    echo "   Token: " . ($token ? 'SET (' . strlen($token) . ' chars)' : 'NOT SET') . "\n";
    echo "   Secret Key: " . ($secretKey ? 'SET (' . strlen($secretKey) . ' chars)' : 'NOT SET') . "\n";
    
    // Test frontend config
    $config = VideoSDKConfig::getFrontendConfig();
    echo "   Frontend Config Keys: " . implode(', ', array_keys($config)) . "\n";
    
} catch (Exception $e) {
    echo "   ❌ VideoSDK error: " . $e->getMessage() . "\n";
    echo "   Error file: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
}
echo "\n";

// Test 5: Voice Section Simulation
echo "5. Voice Section Path Simulation Test:\n";
$voiceSectionPath = __DIR__ . '/views/components/app-sections/voice-section.php';
echo "   Voice section exists: " . (file_exists($voiceSectionPath) ? 'YES' : 'NO') . "\n";

if (file_exists($voiceSectionPath)) {
    echo "   Testing path resolution strategies...\n";
    
    $possiblePaths = [
        dirname($voiceSectionPath, 3) . '/config/videosdk.php',
        (defined('APP_ROOT') ? APP_ROOT : '') . '/config/videosdk.php',
        $_SERVER['DOCUMENT_ROOT'] . '/../config/videosdk.php',
        realpath(dirname($voiceSectionPath, 3) . '/config/videosdk.php'),
    ];
    
    foreach ($possiblePaths as $i => $path) {
        if (!empty($path)) {
            echo "     Path " . ($i + 1) . ": " . (file_exists($path) ? '✅' : '❌') . " $path\n";
        }
    }
}

echo "\n🏁 Test completed!\n";

// Test 6: Error Log Check (if available)
echo "\n6. Recent Error Log Entries:\n";
$logFile = '/var/log/php_errors.log';
if (file_exists($logFile) && is_readable($logFile)) {
    $logs = file_get_contents($logFile);
    $recentLogs = substr($logs, -2000); // Last 2KB
    $lines = explode("\n", $recentLogs);
    $videosdkLogs = array_filter($lines, function($line) {
        return strpos($line, 'VideoSDK') !== false || strpos($line, 'EnvLoader') !== false;
    });
    
    if (count($videosdkLogs) > 0) {
        echo "   Recent VideoSDK/EnvLoader logs:\n";
        foreach (array_slice($videosdkLogs, -10) as $log) {
            echo "   " . trim($log) . "\n";
        }
    } else {
        echo "   No recent VideoSDK/EnvLoader logs found\n";
    }
} else {
    echo "   Error log not accessible\n";
}

echo "\n";
?>
