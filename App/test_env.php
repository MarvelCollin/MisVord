<?php

// Test environment loading
echo "Testing Environment Variable Loading\n";
echo "====================================\n\n";

// Include the environment loader
require_once __DIR__ . '/config/env.php';

// Test if .env file is loaded
echo "1. EnvLoader Status:\n";
echo "   - Loaded: " . (EnvLoader::isLoaded() ? "YES" : "NO") . "\n";
echo "   - All variables count: " . count(EnvLoader::getAll()) . "\n\n";

// Test specific variables
$testVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_USER',
    'DB_PASS',
    'DB_NAME',
    'APP_URL',
    'APP_ENV',
    'VIDEOSDK_API_KEY',
    'VIDEOSDK_TOKEN',
    'GOOGLE_CLIENT_ID'
];

echo "2. Individual Variable Tests:\n";
foreach ($testVars as $var) {
    $value = EnvLoader::get($var);
    if ($value) {
        // Mask sensitive data
        if (in_array($var, ['DB_PASS', 'VIDEOSDK_TOKEN', 'GOOGLE_CLIENT_SECRET'])) {
            $displayValue = substr($value, 0, 8) . '...(masked)';
        } else {
            $displayValue = $value;
        }
        echo "   ✓ $var: $displayValue\n";
    } else {
        echo "   ✗ $var: NOT SET\n";
    }
}

echo "\n3. Database Configuration Test:\n";
try {
    $dbConfig = [
        'host' => EnvLoader::get('DB_HOST', 'db'),
        'port' => EnvLoader::get('DB_PORT', '1003'),
        'dbname' => EnvLoader::get('DB_NAME', 'misvord'),
        'username' => EnvLoader::get('DB_USER', 'root'),
        'password' => EnvLoader::get('DB_PASS', 'kolin123'),
    ];
    
    echo "   Database config loaded successfully:\n";
    echo "   - Host: " . $dbConfig['host'] . "\n";
    echo "   - Port: " . $dbConfig['port'] . "\n";
    echo "   - Database: " . $dbConfig['dbname'] . "\n";
    echo "   - Username: " . $dbConfig['username'] . "\n";
    echo "   - Password: " . (strlen($dbConfig['password']) > 0 ? "[SET]" : "[NOT SET]") . "\n";
} catch (Exception $e) {
    echo "   ✗ Error loading database config: " . $e->getMessage() . "\n";
}

echo "\n4. VideoSDK Configuration Test:\n";
try {
    require_once __DIR__ . '/config/videosdk.php';
    VideoSDKConfig::init();
    
    echo "   ✓ VideoSDK initialized successfully\n";
    echo "   - API Key: " . (VideoSDKConfig::getApiKey() ? "[SET]" : "[NOT SET]") . "\n";
    echo "   - Token: " . (VideoSDKConfig::getToken() ? "[SET]" : "[NOT SET]") . "\n";
} catch (Exception $e) {
    echo "   ✗ VideoSDK Error: " . $e->getMessage() . "\n";
}

echo "\n5. All Environment Variables:\n";
$allVars = EnvLoader::getAll();
foreach ($allVars as $key => $value) {
    // Mask sensitive data
    if (strpos($key, 'PASS') !== false || 
        strpos($key, 'SECRET') !== false || 
        strpos($key, 'TOKEN') !== false) {
        $displayValue = substr($value, 0, 8) . '...(masked)';
    } else {
        $displayValue = $value;
    }
    echo "   $key = $displayValue\n";
}

echo "\nTest completed!\n";
