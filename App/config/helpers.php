<?php

// Define paths
define('ROOT_PATH', dirname(__DIR__));
define('VIEWS_PATH', ROOT_PATH . '/views');
define('PUBLIC_PATH', ROOT_PATH . '/public');


function asset($path) {
    // Remove any leading slashes for consistency
    $path = ltrim($path, '/');
    
    // Get the base URL from server variables
    $baseUrl = getBaseUrl();
    
    // Construct and return the full URL with assets directory
    return "{$baseUrl}/public/assets/{$path}";
}


function css($path) {
    // Remove any leading slashes and ensure .css extension
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.css')) {
        $path .= '.css';
    }
    
    // Get the base URL from server variables
    $baseUrl = getBaseUrl();
    
    // Construct and return the full URL
    return "{$baseUrl}/public/css/{$path}";
}


function js($path) {
    // Remove any leading slashes and ensure .js extension
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.js')) {
        $path .= '.js';
    }
    
    // Get the base URL from server variables
    $baseUrl = getBaseUrl();
    
    // Construct and return the full URL
    return "{$baseUrl}/public/js/{$path}";
}

function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    
    return "{$protocol}://{$host}";
}