<?php
// Debug utility to check socket configuration
require_once dirname(__DIR__) . '/config/env.php';

header('Content-Type: application/json');

$debug = [
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => [
        'IS_DOCKER' => EnvLoader::get('IS_DOCKER', 'false'),
        'IS_VPS' => EnvLoader::get('IS_VPS', 'false'),
        'USE_HTTPS' => EnvLoader::get('USE_HTTPS', 'false'),
        'DOMAIN' => EnvLoader::get('DOMAIN', 'localhost'),
        'APP_ENV' => EnvLoader::get('APP_ENV', 'development'),
    ],
    'socket_config' => [
        'SOCKET_HOST' => EnvLoader::get('SOCKET_HOST', 'localhost'),
        'SOCKET_PORT' => EnvLoader::get('SOCKET_PORT', '1002'),
        'SOCKET_SECURE' => EnvLoader::get('SOCKET_SECURE', 'false'),
        'SOCKET_BASE_PATH' => EnvLoader::get('SOCKET_BASE_PATH', '/socket.io'),
        'SOCKET_BIND_HOST' => EnvLoader::get('SOCKET_BIND_HOST', '0.0.0.0'),
    ],
    'server_info' => [
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'not_set',
        'SERVER_NAME' => $_SERVER['SERVER_NAME'] ?? 'not_set',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not_set',
        'HTTPS' => isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'not_set',
    ],
    'computed_frontend_config' => []
];

// Replicate the logic from head.php
$socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
$socketPort = EnvLoader::get('SOCKET_PORT', '1002');
$socketSecure = EnvLoader::get('SOCKET_SECURE', 'false');
$socketBasePath = EnvLoader::get('SOCKET_BASE_PATH', '/socket.io');
$isDocker = EnvLoader::get('IS_DOCKER', 'false') === 'true';

$currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
$useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';
$vpsHost = EnvLoader::get('DOMAIN', 'localhost');
$isVPSDomain = ($isVPS || strpos($currentHost, $vpsHost) !== false) && $vpsHost !== 'localhost';

if ($isDocker) {
    $frontendSocketHost = 'localhost';
    $frontendSocketPort = $socketPort;
    $frontendSocketSecure = $socketSecure;
    $configType = 'docker';
} elseif ($isVPSDomain) {
    $frontendSocketHost = $currentHost;
    $frontendSocketPort = '';
    $frontendSocketSecure = 'true';
    $configType = 'vps';
} else {
    $frontendSocketHost = 'localhost';
    $frontendSocketPort = $socketPort;
    $frontendSocketSecure = $socketSecure;
    $configType = 'local_development';
}

$debug['computed_frontend_config'] = [
    'config_type' => $configType,
    'frontend_socket_host' => $frontendSocketHost,
    'frontend_socket_port' => $frontendSocketPort,
    'frontend_socket_secure' => $frontendSocketSecure,
    'frontend_socket_url' => $frontendSocketPort ? 
        ($frontendSocketSecure === 'true' ? 'https' : 'http') . '://' . $frontendSocketHost . ':' . $frontendSocketPort :
        ($frontendSocketSecure === 'true' ? 'https' : 'http') . '://' . $frontendSocketHost,
    'detection_flags' => [
        'is_docker' => $isDocker,
        'is_vps' => $isVPS,
        'is_vps_domain' => $isVPSDomain,
        'use_https' => $useHttps,
    ]
];

// Test socket server connectivity
$socketServerUrl = "http://{$socketHost}:{$socketPort}/health";
$debug['socket_server_test'] = [
    'test_url' => $socketServerUrl,
    'reachable' => false,
    'response' => null,
    'error' => null
];

try {
    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'method' => 'GET'
        ]
    ]);
    
    $response = @file_get_contents($socketServerUrl, false, $context);
    if ($response !== false) {
        $debug['socket_server_test']['reachable'] = true;
        $debug['socket_server_test']['response'] = json_decode($response, true) ?: $response;
    } else {
        $debug['socket_server_test']['error'] = 'Failed to connect or empty response';
    }
} catch (Exception $e) {
    $debug['socket_server_test']['error'] = $e->getMessage();
}

// Add recommendations
$debug['recommendations'] = [];

if (!$debug['socket_server_test']['reachable']) {
    $debug['recommendations'][] = "Socket server is not reachable at {$socketServerUrl}. Make sure it's running.";
}

if ($debug['computed_frontend_config']['frontend_socket_host'] !== 'localhost' && !$isVPSDomain) {
    $debug['recommendations'][] = "Frontend socket host is not localhost in local development. This might cause issues.";
}

if ($frontendSocketPort !== $socketPort && !$isVPSDomain) {
    $debug['recommendations'][] = "Frontend socket port differs from backend socket port. This will cause connection failures.";
}

echo json_encode($debug, JSON_PRETTY_PRINT);
