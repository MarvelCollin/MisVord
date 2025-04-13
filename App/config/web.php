<?php

/**
 * Web Routes Configuration
 * 
 * This file defines the routes for the MiscVord application.
 * Each route is mapped to a specific file in the views directory.
 */

// Include the Controllers
require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';

// Define application routes
$routes = [
    // Landing page route
    '/' => 'pages/landing-page.php',
    
    // Authentication view routes
    '/auth' => 'pages/authentication-page.php',
    '/login' => 'pages/authentication-page.php',
    '/register' => 'pages/authentication-page.php',
    '/forgot-password' => 'pages/authentication-page.php',
    
    // Application routes
    '/app' => 'pages/server-page.php', // Direct /app to server-page
    '/server' => 'pages/server-page.php',
    '/server/{id}' => function($params) {
        $controller = new ServerController();
        $controller->show($params['id']);
    },
    '/voice' => 'server/voice-channel.php',
    
    // Server API routes
    'POST:/api/servers' => function() {
        $controller = new ServerController();
        $controller->create();
    },
    'GET:/join/{invite}' => function($params) {
        $controller = new ServerController();
        $controller->join($params['invite']);
    },
    'POST:/api/servers/{id}/leave' => function($params) {
        $controller = new ServerController();
        $controller->leave($params['id']);
    },
    
    // Authentication action routes (POST)
    'POST:/register' => function() {
        $controller = new AuthenticationController();
        $controller->register();
    },
    'POST:/login' => function() {
        $controller = new AuthenticationController();
        $controller->login();
    },
    'POST:/forgot-password' => function() {
        $controller = new AuthenticationController();
        $controller->forgotPassword();
    },
    'GET:/logout' => function() {
        $controller = new AuthenticationController();
        $controller->logout();
    },
    
    // 404 page - shown when no route matches
    '404' => 'pages/404.php'
];

// Create a global variable to store the active route
$GLOBALS['active_route'] = null;

/**
 * Function to display the current active route
 * This will show a floating panel with the active route information
 */
function displayActiveRoute($uri, $matchedRoute, $viewFile) {
    $style = "
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 300px;
        word-break: break-all;
    ";
    
    echo "<div style=\"{$style}\">";
    echo "<strong>Active Route Info:</strong><br>";
    echo "Request URI: {$uri}<br>";
    echo "Matched Route: {$matchedRoute}<br>";
    echo "View File: {$viewFile}";
    echo "</div>";
}

/**
 * Route Handler Function
 * 
 * Processes the current URL and loads the appropriate view file
 * 
 * @param array $routes The defined routes
 * @return void
 */
function handleRoute($routes) {
    // Enable error reporting for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    
    // Get the request URI and remove query string if present
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Get the HTTP method
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Create method-specific route key
    $methodRoute = $method . ':' . $uri;
    
    // Get the script name (the entry point file)
    $scriptName = $_SERVER['SCRIPT_NAME'];
    
    // Extract the directory part
    $scriptDir = dirname($scriptName);
    
    // Remove the script directory from the beginning of the URI if it exists
    if ($scriptDir !== '/' && !empty($scriptDir)) {
        // Make sure we only replace at the beginning of the string
        if (strpos($uri, $scriptDir) === 0) {
            $uri = substr($uri, strlen($scriptDir));
        }
    }
    
    // Ensure the URI starts with a slash and doesn't have trailing slashes
    $uri = '/' . trim($uri, '/');
    
    // If it's just a slash, it's the home page
    if ($uri === '//') {
        $uri = '/';
    }
    
    // Set the active route in the global variable
    $GLOBALS['active_route'] = $uri;
    
    // Check if method-specific route exists
    if (isset($routes[$methodRoute])) {
        if (is_callable($routes[$methodRoute])) {
            // Execute the route function
            $routes[$methodRoute]();
            return;
        }
        $viewFile = $routes[$methodRoute];
        $matchedRoute = $methodRoute;
    }
    // Check if route exists
    elseif (isset($routes[$uri])) {
        if (is_callable($routes[$uri])) {
            // Execute the route function
            $routes[$uri]();
            return;
        }
        $viewFile = $routes[$uri];
        $matchedRoute = $uri;
    } else {
        // Route not found - show 404 page
        $viewFile = $routes['404'];
        $matchedRoute = '404 (Not Found)';
        http_response_code(404);
    }
    
    // Base path for view files
    $viewsPath = dirname(__DIR__) . '/views/';
    
    // Full path to the view file
    $fullPath = $viewsPath . $viewFile;
    
    // Store the route info for display
    $routeInfo = [
        'uri' => $uri,
        'matchedRoute' => $matchedRoute,
        'viewFile' => $viewFile
    ];
    
    // Store route info in a global variable for access in view files
    $GLOBALS['route_info'] = $routeInfo;
    
    // Check if file exists
    if (file_exists($fullPath)) {
        // Display active route information if in debug mode
        if (isset($_GET['debug']) && $_GET['debug'] === '1') {
            // Register shutdown function to display route info at the end
            register_shutdown_function(function() use ($uri, $matchedRoute, $viewFile) {
                displayActiveRoute($uri, $matchedRoute, $viewFile);
            });
        }
        
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
