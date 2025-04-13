<?php
/**
 * Web Routes Configuration
 * 
 * This file defines the routes for the MiscVord application.
 * Each route is mapped to a specific file in the views directory.
 */

// Define application routes
$routes = [
    // Landing page route
    '/' => 'pages/landing-page.php',
    
    // Authentication routes
    '/auth' => 'pages/authentication-page.php',
    '/login' => 'pages/authentication-page.php',
    '/register' => 'pages/authentication-page.php',
    '/forgot-password' => 'pages/authentication-page.php',
    
    // Server routes
    '/server' => 'pages/server-page.php',
    '/voice' => 'server/voice-channel.php',
    
    // 404 page - shown when no route matches
    '404' => 'pages/404.php'
];

/**
 * Route Handler Function
 * 
 * Processes the current URL and loads the appropriate view file
 * 
 * @param array $routes The defined routes
 * @return void
 */
function handleRoute($routes) {
    // Get the request URI and remove query string if present
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Handle subfolder installation by removing the base path
    $baseFolder = dirname($_SERVER['SCRIPT_NAME']);
    if ($baseFolder !== '/' && $baseFolder !== '\\') {
        $uri = str_replace($baseFolder, '', $uri);
    }
    
    // Ensure the URI starts with a slash
    if ($uri !== '/') {
        $uri = '/' . ltrim($uri, '/');
    }
    
    // Check if route exists
    if (isset($routes[$uri])) {
        $viewFile = $routes[$uri];
    } else {
        // Route not found - show 404 page
        $viewFile = $routes['404'];
        http_response_code(404);
    }
    
    // Base path for view files
    $viewsPath = dirname(__DIR__) . '/views/';
    
    // Full path to the view file
    $fullPath = $viewsPath . $viewFile;
    
    // Check if file exists
    if (file_exists($fullPath)) {
        // Include the file
        require $fullPath;
    } else {
        // View file not found
        echo "Error: View file not found at {$fullPath}";
    }
    
    // Exit to prevent further processing
    exit;
}

// Don't run the router during CLI processing
if (php_sapi_name() !== 'cli') {
    handleRoute($routes);
}
