<?php
/**
 * MiscVord - Main Router File
 * This file serves as the main entry point for the application
 * It handles dynamic routes and asset paths
 */

// Include helper functions
require_once dirname(__DIR__) . '/config/helpers.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Handle asset requests directly
if (preg_match('/\.(css|js|jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/', $_SERVER['REQUEST_URI'])) {
    $requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $filePath = dirname(__DIR__) . '/public' . $requestPath;
    
    // If file exists, serve it with proper content type
    if (file_exists($filePath)) {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        
        // Set content type header based on file extension
        $contentTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject'
        ];
        
        if (isset($contentTypes[$extension])) {
            header('Content-Type: ' . $contentTypes[$extension]);
        }
        
        // Set cache headers for better performance
        $maxAge = 60 * 60 * 24 * 7; // 1 week
        header('Cache-Control: max-age=' . $maxAge);
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + $maxAge) . ' GMT');
        
        // Output file contents
        readfile($filePath);
        exit;
    }
}

// Simple router function
function routeToPage($route) {
    $route = trim($route, '/');
    
    // Default to landing page if no route specified
    if (empty($route)) {
        $route = 'landing-page';
    }
    
    // Map routes to views
    $routes = [
        'landing-page' => VIEWS_PATH . '/pages/landing-page.php',
        'login' => VIEWS_PATH . '/auth/login.php',
        'register' => VIEWS_PATH . '/auth/register.php',
        'voice-channel' => VIEWS_PATH . '/server/voice-channel.php',
        // Add more routes as needed
    ];
    
    // Check if route exists
    if (isset($routes[$route])) {
        if (file_exists($routes[$route])) {
            include $routes[$route];
            return;
        }
    }
    
    // 404 - Page not found
    header("HTTP/1.0 404 Not Found");
    echo "<h1>404 - Page Not Found</h1>";
    echo "<p>The requested page could not be found.</p>";
    echo "<a href='/'>Return to homepage</a>";
}

// Extract the requested URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Route to the appropriate page
routeToPage($path);
?>