<?php
// Load environment loader first
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/videosdk.php';

try {
    VideoSDKConfig::init();
    
    echo "<h2>VideoSDK Configuration Test</h2>";
    echo "<p><strong>API Key:</strong> " . (strlen(VideoSDKConfig::getApiKey()) > 0 ? "✅ Loaded" : "❌ Missing") . "</p>";
    echo "<p><strong>Secret Key:</strong> " . (strlen(VideoSDKConfig::getSecretKey()) > 0 ? "✅ Loaded" : "❌ Missing") . "</p>";
    
    // Test JWT token generation
    $token = VideoSDKConfig::generateToken();
    echo "<p><strong>JWT Token:</strong> " . (strlen($token) > 0 ? "✅ Generated" : "❌ Failed") . "</p>";
    echo "<p><strong>Token Preview:</strong> " . substr($token, 0, 50) . "...</p>";
    
    // Test meeting ID generation
    $meetingId = VideoSDKConfig::generateMeetingId();
    echo "<p><strong>Meeting ID:</strong> " . ($meetingId ? "✅ " . $meetingId : "❌ Failed") . "</p>";
    
    // Test configuration array
    $config = VideoSDKConfig::getFrontendConfig();
    echo "<p><strong>Frontend Config:</strong> " . (is_array($config) && count($config) > 0 ? "✅ Generated" : "❌ Failed") . "</p>";
    echo "<pre>" . json_encode($config, JSON_PRETTY_PRINT) . "</pre>";
    
} catch (Exception $e) {
    echo "<p><strong>Error:</strong> " . $e->getMessage() . "</p>";
}
?>
