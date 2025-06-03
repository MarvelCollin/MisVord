<?php
// Test endpoint for VideoSDK configuration in web context
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = [
    'success' => false,
    'debug' => [],
    'error' => null
];

try {
    // Debug information
    $response['debug']['working_directory'] = getcwd();
    $response['debug']['script_path'] = __FILE__;
    $response['debug']['document_root'] = $_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET';
    $response['debug']['app_root_defined'] = defined('APP_ROOT');
    
    if (defined('APP_ROOT')) {
        $response['debug']['app_root_value'] = APP_ROOT;
    }
    
    // Test path resolution
    $configPaths = [
        'relative_up2' => dirname(__DIR__, 2) . '/config/videosdk.php',
        'app_root' => (defined('APP_ROOT') ? APP_ROOT : '') . '/config/videosdk.php',
        'doc_root_up1' => $_SERVER['DOCUMENT_ROOT'] . '/../config/videosdk.php',
    ];
    
    foreach ($configPaths as $name => $path) {
        $response['debug']['paths'][$name] = [
            'path' => $path,
            'exists' => !empty($path) && file_exists($path)
        ];
    }
    
    // Find working config path
    $configPath = null;
    foreach ($configPaths as $path) {
        if (!empty($path) && file_exists($path)) {
            $configPath = $path;
            break;
        }
    }
    
    if (!$configPath) {
        throw new Exception('VideoSDK config file not found in any expected location');
    }
    
    $response['debug']['config_path_used'] = $configPath;
    
    // Load VideoSDK configuration
    require_once $configPath;
    $response['debug']['config_loaded'] = true;
    
    // Initialize VideoSDK
    VideoSDKConfig::init();
    $response['debug']['videosdk_initialized'] = true;
    
    // Get configuration
    $config = VideoSDKConfig::getFrontendConfig();
    $response['success'] = true;
    $response['config'] = [
        'apiKey' => $config['apiKey'] ?? null,
        'token' => $config['token'] ? '[SET]' : '[NOT SET]',
        'isProduction' => $config['isProduction'] ?? false
    ];
    $response['debug']['config_keys'] = array_keys($config);
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    $response['debug']['error_file'] = $e->getFile();
    $response['debug']['error_line'] = $e->getLine();
    $response['debug']['error_trace'] = $e->getTraceAsString();
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
