<?php

return [
    'api_driven' => true,
    'traditional_ajax' => false,
    'debug' => false,
    'default_response_format' => 'json',
    'csrf_protection' => true,
    'cors' => [
        'enabled' => true,
        'allowed_origins' => ['*'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
        'expose_headers' => [],
        'max_age' => 86400,
        'supports_credentials' => true
    ],
    'response_codes' => [
        'success' => 200,
        'created' => 201,
        'accepted' => 202,
        'no_content' => 204,
        'bad_request' => 400,
        'unauthorized' => 401,
        'forbidden' => 403,
        'not_found' => 404,
        'method_not_allowed' => 405,
        'validation_error' => 422,
        'server_error' => 500
    ],
    'socket' => [
        'enabled' => true,
        'host' => getenv('SOCKET_HOST') ?: 'localhost',
        'port' => getenv('SOCKET_PORT') ?: 1002,
        'path' => getenv('SOCKET_BASE_PATH') ?: '/socket.io',
        'timeout' => 5,
        'debug' => getenv('APP_ENV') !== 'production'
    ],
    'cache' => [
        'enabled' => true,
        'ttl' => 300
    ]
];

function isApiRequest() {
    return !empty($_SERVER['HTTP_ACCEPT']) && 
           strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
}

function apiResponse($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode([
        'success' => $status >= 200 && $status < 300,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

function apiError($message, $status = 400, $errors = null) {
    header('Content-Type: application/json');
    http_response_code($status);
    
    $response = [
        'success' => false,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    
    echo json_encode($response);
    exit;
}

function getApiConfig($key = null) {
    static $config = null;
    
    if ($config === null) {
        $config = require __DIR__ . '/ajax.php';
    }
    
    if ($key === null) {
        return $config;
    }
    
    return $config[$key] ?? null;
}
