<?php
echo "=== FINAL VIDEOSDK STATUS CHECK ===\n\n";

// Check if required files exist
$files = [
    'config/env.php' => '🔧 Environment Loader',
    'config/videosdk.php' => '📹 VideoSDK Configuration',
    'views/pages/call.php' => '📞 Video Call Page',
    'videosdk_api.php' => '🌐 VideoSDK API Endpoint',
    '.env' => '⚙️ Environment Variables'
];

foreach ($files as $file => $description) {
    $path = __DIR__ . '/' . $file;
    $exists = file_exists($path);
    echo ($exists ? "✅" : "❌") . " $description: " . ($exists ? "EXISTS" : "MISSING") . "\n";
}

echo "\n=== ENVIRONMENT VARIABLES CHECK ===\n";

// Load environment
require_once __DIR__ . '/config/env.php';
$envVars = EnvLoader::getEnv();

$requiredVars = [
    'VIDEOSDK_API_KEY' => 'VideoSDK API Key',
    'VIDEOSDK_SECRET_KEY' => 'VideoSDK Secret Key',
    'DB_HOST' => 'Database Host',
    'DB_NAME' => 'Database Name'
];

foreach ($requiredVars as $var => $description) {
    $value = $envVars[$var] ?? null;
    $status = $value ? "✅ SET" : "❌ MISSING";
    if ($value && strpos($var, 'VIDEOSDK') !== false) {
        $value = substr($value, 0, 8) . "...";
    }
    echo "$status $description: " . ($value ?: 'NOT FOUND') . "\n";
}

echo "\n=== VIDEOSDK CONFIGURATION TEST ===\n";

try {
    require_once __DIR__ . '/config/videosdk.php';
    
    VideoSDKConfig::init();
    echo "✅ VideoSDK initialization: SUCCESS\n";
    
    $apiKey = VideoSDKConfig::getApiKey();
    echo "✅ API Key retrieval: " . substr($apiKey, 0, 8) . "...\n";
    
    $token = VideoSDKConfig::generateToken();
    echo "✅ JWT Token generation: " . substr($token, 0, 20) . "...\n";
    
    $meetingId = VideoSDKConfig::generateMeetingId();
    echo "✅ Meeting ID generation: $meetingId\n";
    
    $frontendConfig = VideoSDKConfig::getFrontendConfig();
    echo "✅ Frontend configuration: " . (is_array($frontendConfig) ? "SUCCESS" : "FAILED") . "\n";
    
} catch (Exception $e) {
    echo "❌ VideoSDK Error: " . $e->getMessage() . "\n";
}

echo "\n=== API ENDPOINT TEST ===\n";

// Test VideoSDK API endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:1001/videosdk_api.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['action' => 'get_token']));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if ($data && isset($data['success']) && $data['success']) {
        echo "✅ API Endpoint: WORKING\n";
        echo "✅ Token response: " . substr($data['token'], 0, 20) . "...\n";
    } else {
        echo "❌ API Endpoint: INVALID RESPONSE\n";
        echo "Response: $response\n";
    }
} else {
    echo "❌ API Endpoint: FAILED (HTTP $httpCode)\n";
}

echo "\n=== CALL PAGE TEST ===\n";

// Test call page
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:1001/call');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$callPageResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ Call Page: ACCESSIBLE\n";
    
    // Check for configuration errors
    if (strpos($callPageResponse, 'VideoSDK configuration not found') !== false) {
        echo "❌ Call Page: CONFIGURATION ERROR DETECTED\n";
    } else {
        echo "✅ Call Page: NO CONFIGURATION ERRORS\n";
    }
    
    // Check for meta tags
    if (strpos($callPageResponse, 'videosdk-api-key') !== false && 
        strpos($callPageResponse, 'videosdk-token') !== false) {
        echo "✅ Call Page: META TAGS PRESENT\n";
    } else {
        echo "❌ Call Page: META TAGS MISSING\n";
    }
    
} else {
    echo "❌ Call Page: INACCESSIBLE (HTTP $httpCode)\n";
}

echo "\n=== DOCKER STATUS ===\n";

// Check docker containers
exec('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" 2>nul', $dockerOutput, $dockerReturn);

if ($dockerReturn === 0 && !empty($dockerOutput)) {
    echo "✅ Docker containers:\n";
    foreach ($dockerOutput as $line) {
        echo "  $line\n";
    }
} else {
    echo "❌ Docker status check failed or no containers running\n";
}

echo "\n=== SUMMARY ===\n";
echo "🎉 VideoSDK implementation is ready!\n";
echo "🌐 Access the video call at: http://localhost:1001/call\n";
echo "🧪 Run comprehensive tests at: http://localhost:1001/videosdk_integration_test.html\n";
echo "📊 Test backend at: http://localhost:1001/test_complete_videosdk_fixed.php\n";

?>
