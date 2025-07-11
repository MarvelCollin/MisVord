<?php

if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

if (getenv('APP_ENV') === 'production' || (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'production')) {
    error_reporting(E_ERROR | E_PARSE);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

try {
    require_once APP_ROOT . '/config/app.php';
} catch (Exception $e) {
    error_log("Failed to load app configuration: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error']);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'];
$parsedUri = parse_url($requestUri, PHP_URL_PATH);

if (strpos($parsedUri, '/api/') === 0) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    error_log("Router processing API request: " . $parsedUri);
    error_log("Session data: " . json_encode($_SESSION));
    
    $_SERVER['REQUEST_URI'] = $parsedUri;

    $webConfigPath = APP_ROOT . '/config/web.php';
    if (file_exists($webConfigPath)) {
        require_once $webConfigPath;
    } else {
        error_log("Web config not found: " . $webConfigPath);
        http_response_code(500);
        echo json_encode(['error' => 'Configuration error']);
        exit;
    }
    exit;
}

if (file_exists(__DIR__ . $parsedUri) && is_file(__DIR__ . $parsedUri)) {
    return false;
}

require_once APP_ROOT . '/config/web.php';

if (preg_match('/\\.(?:css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|webp|map)$/', $_SERVER["REQUEST_URI"])) {
    $requestFile = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    $requestFile = ltrim($requestFile, '/');
    $extension = pathinfo($requestFile, PATHINFO_EXTENSION);

    $contentTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'ico' => 'image/x-icon',
        'svg' => 'image/svg+xml',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'webp' => 'image/webp',
        'map' => 'application/json'
    ];

    if (isset($contentTypes[$extension])) {
        header('Content-Type: ' . $contentTypes[$extension]);
    }    $searchPaths = [
        $_SERVER['DOCUMENT_ROOT'] . '/',
        __DIR__ . '/',
        dirname(__DIR__) . '/public/',
        dirname(__DIR__) . '/',
    ];
    foreach ($searchPaths as $searchPath) {
        $fullPath = $searchPath . $requestFile;
        if (file_exists($fullPath) && is_file($fullPath)) {
            readfile($fullPath);
            exit;
        }
    }

    error_log("Static file not found: {$requestFile}");
    error_log("Searched paths: " . implode(', ', array_map(function($path) use ($requestFile) {
        return $path . $requestFile . ' (exists: ' . (file_exists($path . $requestFile) ? 'yes' : 'no') . ')';
    }, $searchPaths)));
    
    header("HTTP/1.0 404 Not Found");
    exit("Static file not found: {$requestFile}");
}
