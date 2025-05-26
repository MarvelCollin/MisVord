<?php
// Load environment loader first
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/videosdk.php';

$config = null; // Use static methods directly

echo "<!DOCTYPE html>";
echo "<html><head><title>Complete VideoSDK Test</title>";
echo "<style>";
echo "body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }";
echo ".test-section { background: #2d2d2d; padding: 20px; margin: 10px 0; border-radius: 8px; }";
echo ".success { color: #4CAF50; }";
echo ".error { color: #F44336; }";
echo ".info { color: #2196F3; }";
echo "</style></head><body>";

echo "<h1>🧪 Complete VideoSDK Integration Test</h1>";

// Test 1: Environment Variables
echo "<div class='test-section'>";
echo "<h2>1. Environment Variables Test</h2>";
$apiKey = $config->getApiKey();
$secretKey = $config->getSecretKey();

if ($apiKey && $secretKey) {
    echo "<p class='success'>✅ API Key: " . substr($apiKey, 0, 10) . "...</p>";
    echo "<p class='success'>✅ Secret Key: " . substr($secretKey, 0, 10) . "...</p>";
} else {
    echo "<p class='error'>❌ Missing API credentials</p>";
}
echo "</div>";

// Test 2: JWT Token Generation
echo "<div class='test-section'>";
echo "<h2>2. JWT Token Generation Test</h2>";
try {
    $token = $config->generateToken();
    if ($token) {
        echo "<p class='success'>✅ JWT Token Generated Successfully</p>";
        echo "<p class='info'>Token: " . substr($token, 0, 50) . "...</p>";
    } else {
        echo "<p class='error'>❌ Failed to generate JWT token</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ JWT Error: " . $e->getMessage() . "</p>";
}
echo "</div>";

// Test 3: Meeting ID Creation
echo "<div class='test-section'>";
echo "<h2>3. Meeting ID Creation Test</h2>";
try {
    $meetingId = $config->createMeeting();
    if ($meetingId) {
        echo "<p class='success'>✅ Meeting ID Created: " . $meetingId . "</p>";
    } else {
        echo "<p class='error'>❌ Failed to create meeting ID</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Meeting Creation Error: " . $e->getMessage() . "</p>";
}
echo "</div>";

// Test 4: Frontend Configuration
echo "<div class='test-section'>";
echo "<h2>4. Frontend Configuration Test</h2>";
try {
    $frontendConfig = $config->getFrontendConfig();
    if ($frontendConfig && isset($frontendConfig['token']) && isset($frontendConfig['meetingId'])) {
        echo "<p class='success'>✅ Frontend Configuration Generated</p>";
        echo "<pre style='background: #1a1a1a; padding: 10px; border-radius: 4px;'>";
        echo json_encode($frontendConfig, JSON_PRETTY_PRINT);
        echo "</pre>";
    } else {
        echo "<p class='error'>❌ Failed to generate frontend configuration</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Frontend Config Error: " . $e->getMessage() . "</p>";
}
echo "</div>";

// Test 5: VideoSDK API Connectivity
echo "<div class='test-section'>";
echo "<h2>5. VideoSDK API Connectivity Test</h2>";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.videosdk.live/v2/rooms');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: ' . $config->generateToken(),
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['region' => 'sg001']));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "<p class='success'>✅ VideoSDK API Connected Successfully</p>";
    $data = json_decode($response, true);
    if (isset($data['roomId'])) {
        echo "<p class='info'>Room ID from API: " . $data['roomId'] . "</p>";
    }
} else {
    echo "<p class='error'>❌ VideoSDK API Connection Failed (HTTP $httpCode)</p>";
    echo "<p class='error'>Response: " . $response . "</p>";
}
echo "</div>";

// Test 6: JavaScript Integration Test
echo "<div class='test-section'>";
echo "<h2>6. JavaScript Integration Test</h2>";
echo "<p>Loading VideoSDK JavaScript SDK...</p>";
echo "<div id='js-test-result'></div>";
echo "</div>";

echo "<script src='https://sdk.videosdk.live/js-sdk/0.1.6/videosdk.js'></script>";
echo "<script>";
echo "setTimeout(() => {";
echo "  const resultDiv = document.getElementById('js-test-result');";
echo "  if (typeof VideoSDK !== 'undefined') {";
echo "    resultDiv.innerHTML = '<p class=\"success\">✅ VideoSDK JavaScript SDK Loaded Successfully</p>';";
echo "    console.log('VideoSDK version:', VideoSDK.version || 'Unknown');";
echo "  } else {";
echo "    resultDiv.innerHTML = '<p class=\"error\">❌ VideoSDK JavaScript SDK Failed to Load</p>';";
echo "  }";
echo "}, 3000);";
echo "</script>";

echo "<div class='test-section'>";
echo "<h2>📋 Test Summary</h2>";
echo "<p>All tests completed. Check the results above to ensure VideoSDK is properly configured.</p>";
echo "<p><a href='/call' style='color: #4CAF50;'>🎥 Go to Video Call Page</a></p>";
echo "</div>";

echo "</body></html>";
?>
