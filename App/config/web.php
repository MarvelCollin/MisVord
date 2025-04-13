<?php

/**
 * Web Routes Configuration
 * 
 * This file defines the routes for the MiscVord application.
 * Each route is mapped to a specific file in the views directory.
 */

// Load routes from routes.php 
$routes = require_once __DIR__ . '/routes.php';

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
    
    // Debug log for troubleshooting
    error_log("Handling route: " . $uri);
    
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
    
    error_log("Normalized URI: " . $uri);
    
    // Set the active route in the global variable
    $GLOBALS['active_route'] = $uri;
    
    // Try to match exact routes first
    if (isset($routes[$methodRoute])) {
        error_log("Found exact method route match: " . $methodRoute);
        if (is_callable($routes[$methodRoute])) {
            // Execute the route function
            $routes[$methodRoute]();
            return;
        }
        $viewFile = $routes[$methodRoute];
        $matchedRoute = $methodRoute;
    } 
    // Check if route exists without method prefix
    elseif (isset($routes[$uri])) {
        error_log("Found exact route match: " . $uri);
        if (is_callable($routes[$uri])) {
            // Execute the route function
            $routes[$uri]();
            return;
        }
        $viewFile = $routes[$uri];
        $matchedRoute = $uri;
    } 
    // Check for parameterized routes with improved logic
    else {
        $matched = false;
        
        foreach ($routes as $pattern => $handler) {
            // Skip non-parameterized routes - they were already checked
            if (strpos($pattern, '{') === false) {
                continue;
            }
            
            // Check if this is a method-specific route
            $methodPattern = null;
            if (strpos($pattern, ':') !== false) {
                list($methodName, $urlPattern) = explode(':', $pattern, 2);
                if ($methodName !== $method) {
                    continue; // Skip if method doesn't match
                }
                $methodPattern = $methodName;
                $pattern = $urlPattern;
            }
            
            // Convert route pattern to regex
            $patternRegex = preg_quote($pattern, '#');
            $patternRegex = preg_replace('/\\\{([a-zA-Z0-9_]+)\\\}/', '(?P<$1>[^/]+)', $patternRegex);
            $patternRegex = '#^' . $patternRegex . '$#';
            
            error_log("Testing pattern: " . $pattern . " against URI: " . $uri . " with regex: " . $patternRegex);
            
            // Try to match the route
            if (preg_match($patternRegex, $uri, $matches)) {
                error_log("Pattern matched! Extracting parameters: " . json_encode($matches));
                
                $params = [];
                
                // Extract named parameters
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = $value;
                    }
                }
                
                // If it's a method-specific route, reconstruct the full pattern
                if ($methodPattern !== null) {
                    $pattern = $methodPattern . ':' . $pattern;
                }
                
                // Execute the handler
                if (is_callable($handler)) {
                    error_log("Executing handler for: " . $pattern . " with params: " . json_encode($params));
                    $handler($params);
                    $matched = true;
                    return;
                } else {
                    error_log("Handler is not callable for: " . $pattern);
                    $viewFile = $handler;
                    $matchedRoute = $pattern;
                    $matched = true;
                    break;
                }
            }
        }
        
        // If no route matched
        if (!$matched) {
            error_log("No route matched for: " . $uri);
            $viewFile = $routes['404'];
            $matchedRoute = '404 (Not Found)';
            http_response_code(404);
        }
    }
    
    // Base path for view files
    $viewsPath = dirname(__DIR__) . '/views/';
    
    // Full path to the view file
    $fullPath = $viewsPath . $viewFile;
    error_log("Loading view file: " . $fullPath);
    
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
