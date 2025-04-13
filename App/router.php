<?php
/**
 * PHP Built-in Server Router
 * 
 * This file routes all requests to the web.php router when using PHP's built-in server.
 */

// Define base directory
define('APP_ROOT', __DIR__);

// Start session if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set full error reporting in development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Route static files directly
if (preg_match('/\.(?:css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|webp|map)$/', $_SERVER["REQUEST_URI"])) {
    // Extract the requested file path from the URI
    $requestFile = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    
    // Remove any leading slash
    $requestFile = ltrim($requestFile, '/');
    
    // Get file extension
    $extension = pathinfo($requestFile, PATHINFO_EXTENSION);
    
    // Set appropriate content type
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

    // Check if file exists in public folder
    $filePath = __DIR__ . '/public/' . $requestFile;
    if (file_exists($filePath)) {
        readfile($filePath);
        exit;
    }
    
    // Check if file exists directly (for assets not in public)
    if (file_exists(__DIR__ . '/' . $requestFile)) {
        readfile(__DIR__ . '/' . $requestFile);
        exit;
    }
    
    // If we reach here, the file wasn't found - return 404 for the static file
    header("HTTP/1.0 404 Not Found");
    exit("File not found: {$requestFile}");
}

// Log request details for debugging
error_log("[" . date("Y-m-d H:i:s") . "] " . $_SERVER['REQUEST_METHOD'] . " request to " . $_SERVER['REQUEST_URI']);

// Special handling for server routes
if (preg_match('/\/server\/(\d+)/', $_SERVER['REQUEST_URI'], $matches)) {
    error_log("Server route detected: Server ID = " . $matches[1]);
}

// Make sure we can find the config file
if (file_exists(__DIR__ . '/config/web.php')) {
    // All other requests go through our router
    require_once __DIR__ . '/config/web.php';
} else {
    error_log("Fatal error: Cannot find web.php configuration file.");
    http_response_code(500);
    echo "Server configuration error: web.php not found";
}

// If we reach here, no route was matched by web.php
http_response_code(404);
echo "Page not found";
