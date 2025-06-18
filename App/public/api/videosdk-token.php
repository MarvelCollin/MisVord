<?php
header('Content-Type: application/json');

$configPath = realpath(dirname(__DIR__, 2) . '/config/videosdk.php');
if (!$configPath) {
    $configPath = dirname(__DIR__, 2) . '/config/videosdk.php';
}
require_once $configPath;

try {
    $response = [
        'success' => true,
        'token' => VideoSDKConfig::getAuthToken(),
        'apiKey' => VideoSDKConfig::getApiKey()
    ];
    
    echo json_encode($response);
} catch (Exception $e) {
    error_log('VideoSDK API error: ' . $e->getMessage());
    error_log('Config path attempted: ' . $configPath);
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
    
    http_response_code(500);
    echo json_encode($response);
}
?>