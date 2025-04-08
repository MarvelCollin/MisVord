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