<?php

if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Load app configuration early (includes session settings)
require_once APP_ROOT . '/config/app.php';


$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, '/api/') !== false) {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

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


$webConfigPath = APP_ROOT . '/config/web.php';

if (file_exists($webConfigPath)) {
    require_once $webConfigPath;
} else {
    http_response_code(500);
    echo "Server configuration error: web.php not found";
}
