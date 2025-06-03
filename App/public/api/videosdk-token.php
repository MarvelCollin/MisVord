<?php
// Set response type to JSON
header('Content-Type: application/json');

// Include the VideoSDK config class with proper path handling
$configPath = realpath(dirname(__DIR__, 2) . '/config/videosdk.php');
if (!$configPath) {
    // Fallback path resolution
    $configPath = dirname(__DIR__, 2) . '/config/videosdk.php';
}
require_once $configPath;

try {
    // Initialize VideoSDK
    VideoSDKConfig::init();
    
    // Prepare response
    $response = [
        'success' => true,
        'token' => VideoSDKConfig::getToken(),
        'apiKey' => VideoSDKConfig::getApiKey()
    ];
    
    // Output response
    echo json_encode($response);
} catch (Exception $e) {
    error_log('VideoSDK API error: ' . $e->getMessage());
    error_log('Config path attempted: ' . $configPath);
    // Handle errors
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    
    // Output error response
    http_response_code(500);
    echo json_encode($response);
}
?>