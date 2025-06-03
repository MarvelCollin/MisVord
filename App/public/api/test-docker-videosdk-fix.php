<?php
/**
 * Docker VideoSDK Fix Test Endpoint
 * Tests the VideoSDK configuration fix in Docker web context
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = [
    'success' => false,
    'environment' => 'unknown',
    'debug' => [],
    'tests' => [],
    'error' => null,
    'timestamp' => date('Y-m-d H:i:s')
];

try {
    // Test 1: Environment Detection
    $detectionMethods = [
        'getenv_is_docker' => getenv('IS_DOCKER'),
        'server_is_docker' => $_SERVER['IS_DOCKER'] ?? null,
        'getenv_container' => getenv('CONTAINER'),
        'server_container' => $_SERVER['CONTAINER'] ?? null,
        'dockerenv_file' => file_exists('/.dockerenv')
    ];
    
    $isDocker = (
        getenv('IS_DOCKER') === 'true' || 
        isset($_SERVER['IS_DOCKER']) || 
        getenv('CONTAINER') !== false ||
        isset($_SERVER['CONTAINER']) ||
        file_exists('/.dockerenv')
    );
    
    $response['environment'] = $isDocker ? 'docker' : 'local';
    $response['debug']['detection_methods'] = $detectionMethods;
    $response['debug']['is_docker'] = $isDocker;
    
    // Test 2: Direct Environment Variable Access
    $envVars = ['VIDEOSDK_TOKEN', 'VIDEOSDK_API_KEY', 'VIDEOSDK_SECRET_KEY'];
    $directAccess = [];
    
    foreach ($envVars as $var) {
        $directAccess[$var] = [
            'server' => isset($_SERVER[$var]) ? 'SET' : 'NOT_SET',
            'getenv' => getenv($var) ? 'SET' : 'NOT_SET',
            'env' => isset($_ENV[$var]) ? 'SET' : 'NOT_SET'
        ];
    }
    
    $response['tests']['direct_access'] = $directAccess;
    
    // Test 3: EnvLoader Test
    $configPath = dirname(__DIR__, 2) . '/config/env.php';
    if (file_exists($configPath)) {
        require_once $configPath;
        
        $envloaderResults = [];
        foreach ($envVars as $var) {
            $value = EnvLoader::get($var);
            $envloaderResults[$var] = $value ? 'FOUND' : 'NOT_FOUND';
        }
        
        $response['tests']['envloader'] = [
            'loaded' => true,
            'variables' => $envloaderResults
        ];
    } else {
        $response['tests']['envloader'] = [
            'loaded' => false,
            'error' => 'EnvLoader config not found'
        ];
    }
    
    // Test 4: VideoSDK Configuration
    $videoSdkPath = dirname(__DIR__, 2) . '/config/videosdk.php';
    if (file_exists($videoSdkPath)) {
        require_once $videoSdkPath;
        
        VideoSDKConfig::init();
        
        $config = VideoSDKConfig::getFrontendConfig();
        $response['tests']['videosdk'] = [
            'initialized' => true,
            'config' => [
                'apiKey' => isset($config['apiKey']) && $config['apiKey'] ? 'SET' : 'NOT_SET',
                'token' => isset($config['token']) && $config['token'] ? 'SET' : 'NOT_SET',
                'isProduction' => $config['isProduction'] ?? false
            ]
        ];
        
        $response['success'] = true;
        
    } else {
        $response['tests']['videosdk'] = [
            'initialized' => false,
            'error' => 'VideoSDK config not found'
        ];
    }
    
    // Test 5: Working Directory Context
    $response['debug']['paths'] = [
        'working_directory' => getcwd(),
        'script_path' => __FILE__,
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET'
    ];
    
} catch (Exception $e) {
    $response['error'] = $e->getMessage();
    $response['debug']['error_details'] = [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => array_slice(explode("\n", $e->getTraceAsString()), 0, 5)
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
