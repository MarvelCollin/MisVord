<?php

if (!defined('APP_ROOT')) {
define('APP_ROOT', __DIR__);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

$parsedUrl = parse_url($_SERVER["REQUEST_URI"]);
error_log("Router processing URL parts: " . json_encode($parsedUrl));
error_log("Request method: " . $_SERVER["REQUEST_METHOD"]);

error_log("Router processing request: " . $_SERVER['REQUEST_URI']);
error_log("Script Name: " . $_SERVER['SCRIPT_NAME']);
error_log("Document Root: " . $_SERVER['DOCUMENT_ROOT']);

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
    }

    $searchPaths = [
        __DIR__ . '/public/',          
        __DIR__ . '/',                  
        __DIR__ . '/public/' . dirname($requestFile) . '/', 
    ];

    error_log("Looking for file: " . $requestFile);

    foreach ($searchPaths as $basePath) {
        $filePath = $basePath . $requestFile;
        error_log("Checking path: " . $filePath);

        if (file_exists($filePath)) {
            error_log("Found file at: " . $filePath);
            readfile($filePath);
            exit;
        }
    }

    error_log("Static file not found: {$requestFile}");
    header("HTTP/1.0 404 Not Found");
    exit("Static file not found: {$requestFile}");
}

error_log("[" . date("Y-m-d H:i:s") . "] " . $_SERVER['REQUEST_METHOD'] . " request to " . $_SERVER['REQUEST_URI']);

if (file_exists(__DIR__ . '/config/web.php')) {
    error_log("Loading web.php configuration");
    require_once __DIR__ . '/config/web.php';
    exit; 
} else {
    error_log("Fatal error: Cannot find web.php configuration file.");
    http_response_code(500);
    echo "Server configuration error: web.php not found";
    exit;
}

http_response_code(404);
echo "Page not found";