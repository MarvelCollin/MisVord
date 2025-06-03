<?php
/**
 * Enhanced Docker VideoSDK Fix Test Endpoint
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
        $serverVal = $_SERVER[$var] ?? null;
        $getenvVal = getenv($var);
        $envVal = $_ENV[$var] ?? null;
        
        $directAccess[$var] = [
            'server' => $serverVal ? 'SET (' . strlen($serverVal) . ' chars)' : 'NOT_SET',
            'getenv' => $getenvVal ? 'SET (' . strlen($getenvVal) . ' chars)' : 'NOT_SET',
            'env' => $envVal ? 'SET (' . strlen($envVal) . ' chars)' : 'NOT_SET'
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
            $envloaderResults[$var] = $value ? 'FOUND (' . strlen($value) . ' chars)' : 'NOT_FOUND';
        }
        
        $response['tests']['envloader'] = [
            'loaded' => true,
            'variables' => $envloaderResults,
            'is_loaded' => EnvLoader::isLoaded(),
            'all_vars_count' => count(EnvLoader::getAll())
        ];
    } else {
        $response['tests']['envloader'] = [
            'loaded' => false,
            'error' => 'EnvLoader config not found at: ' . $configPath
        ];
    }
    
    // Test 4: VideoSDK Configuration
    $videoSdkPath = dirname(__DIR__, 2) . '/config/videosdk.php';
    if (file_exists($videoSdkPath)) {
        require_once $videoSdkPath;
        
        try {
            VideoSDKConfig::init();
            
            $config = VideoSDKConfig::getFrontendConfig();
            $response['tests']['videosdk'] = [
                'initialized' => true,
                'config' => [
                    'apiKey' => isset($config['apiKey']) && $config['apiKey'] ? 'SET (' . strlen($config['apiKey']) . ' chars)' : 'NOT_SET',
                    'token' => isset($config['token']) && $config['token'] ? 'SET (' . strlen($config['token']) . ' chars)' : 'NOT_SET',
                    'isProduction' => $config['isProduction'] ?? false
                ],
                'methods' => [
                    'getApiKey' => VideoSDKConfig::getApiKey() ? 'SET' : 'NOT_SET',
                    'getToken' => VideoSDKConfig::getToken() ? 'SET' : 'NOT_SET',
                    'getSecretKey' => VideoSDKConfig::getSecretKey() ? 'SET' : 'NOT_SET'
                ]
            ];
            
            $response['success'] = (
                isset($config['apiKey']) && $config['apiKey'] &&
                isset($config['token']) && $config['token']
            );
            
        } catch (Exception $e) {
            $response['tests']['videosdk'] = [
                'initialized' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ];
        }
        
    } else {
        $response['tests']['videosdk'] = [
            'initialized' => false,
            'error' => 'VideoSDK config not found at: ' . $videoSdkPath
        ];
    }
    
    // Test 5: Working Directory Context
    $response['debug']['paths'] = [
        'working_directory' => getcwd(),
        'script_path' => __FILE__,
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET',
        'config_path' => $configPath,
        'videosdk_path' => $videoSdkPath
    ];
    
    // Test 6: Voice Section Path Simulation
    $voiceSectionPath = dirname(__DIR__, 2) . '/views/components/app-sections/voice-section.php';
    $response['tests']['voice_section'] = [
        'path' => $voiceSectionPath,
        'exists' => file_exists($voiceSectionPath),
        'readable' => file_exists($voiceSectionPath) && is_readable($voiceSectionPath)
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
