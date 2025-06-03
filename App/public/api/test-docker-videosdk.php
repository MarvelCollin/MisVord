<?php
// Docker Environment Test for VideoSDK Configuration

header('Content-Type: application/json');

$response = [
    'success' => false,
    'environment' => 'unknown',
    'debug' => [],
    'config' => [],
    'error' => null
];

try {
    // Detect environment
    $isDocker = getenv('IS_DOCKER') === 'true' || isset($_SERVER['IS_DOCKER']);
    $response['environment'] = $isDocker ? 'docker' : 'local';
    $response['debug']['is_docker'] = $isDocker;
    $response['debug']['working_directory'] = getcwd();
    $response['debug']['script_path'] = __FILE__;
    
    // Check environment variables directly
    $response['debug']['env_vars'] = [
        'VIDEOSDK_TOKEN_server' => isset($_SERVER['VIDEOSDK_TOKEN']) ? 'SET' : 'NOT_SET',
        'VIDEOSDK_API_KEY_server' => isset($_SERVER['VIDEOSDK_API_KEY']) ? 'SET' : 'NOT_SET',
        'VIDEOSDK_TOKEN_getenv' => getenv('VIDEOSDK_TOKEN') ? 'SET' : 'NOT_SET',
        'VIDEOSDK_API_KEY_getenv' => getenv('VIDEOSDK_API_KEY') ? 'SET' : 'NOT_SET',
    ];
    
    // Load environment configuration
    $configPath = dirname(__DIR__) . '/config/env.php';
    if (file_exists($configPath)) {
        require_once $configPath;
        $response['debug']['env_config_loaded'] = true;
        
        // Test EnvLoader
        $token = EnvLoader::get('VIDEOSDK_TOKEN');
        $apiKey = EnvLoader::get('VIDEOSDK_API_KEY');
        
        $response['debug']['envloader_results'] = [
            'token' => $token ? 'FOUND (' . strlen($token) . ' chars)' : 'NOT_FOUND',
            'api_key' => $apiKey ? 'FOUND (' . strlen($apiKey) . ' chars)' : 'NOT_FOUND',
        ];
    } else {
        $response['debug']['env_config_loaded'] = false;
        $response['debug']['env_config_path'] = $configPath;
    }
    
    // Test VideoSDK configuration
    $videoSdkPath = dirname(__DIR__) . '/config/videosdk.php';
    if (file_exists($videoSdkPath)) {
        require_once $videoSdkPath;
        $response['debug']['videosdk_config_loaded'] = true;
        
        VideoSDKConfig::init();
        $response['debug']['videosdk_initialized'] = true;
        
        $config = VideoSDKConfig::getFrontendConfig();
        $response['config'] = [
            'apiKey' => isset($config['apiKey']) && $config['apiKey'] ? 'SET' : 'NOT_SET',
            'token' => isset($config['token']) && $config['token'] ? 'SET' : 'NOT_SET',
            'isProduction' => $config['isProduction'] ?? false
        ];
        
        $response['success'] = true;
        
    } else {
        $response['debug']['videosdk_config_loaded'] = false;
        $response['debug']['videosdk_config_path'] = $videoSdkPath;
    }
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    $response['debug']['error_file'] = $e->getFile();
    $response['debug']['error_line'] = $e->getLine();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
