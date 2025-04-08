<?php
/**
 * MiscVord - Helper Functions
 * This file contains helper functions used throughout the application
 */

// Define base paths if not already defined
if (!defined('BASE_PATH')) {
    define('BASE_PATH', dirname(__DIR__));
}
if (!defined('VIEWS_PATH')) {
    define('VIEWS_PATH', BASE_PATH . '/views');
}
if (!defined('PUBLIC_PATH')) {
    define('PUBLIC_PATH', BASE_PATH . '/public');
}

/**
 * Helper function to easily get asset URLs
 * 
 * @param string $path The relative path to the asset
 * @return string The full path to the asset
 */
function asset($path) {
    // Get the protocol and host
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'];
    
    // Always point to /public/assets/ regardless of the caller's location
    return $protocol . $host . '/public/assets' . $path;
}

/**
 * Get the base URL for the application
 * 
 * @return string The base URL
 */
function getBaseUrl() {
    // Get protocol
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    
    // Get host
    $host = $_SERVER['HTTP_HOST'];
    
    // Get script name and strip filename to get base directory
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    
    // If we're not at webroot, append path
    $baseUrl = $protocol . $host;
    if ($scriptDir !== '/' && $scriptDir !== '\\') {
        // Clean up path for different server configurations
        $baseUrl .= str_replace('\\', '/', $scriptDir);
    }
    
    return rtrim($baseUrl, '/');
}

/**
 * Helper function to include a view file
 * 
 * @param string $view The view file to include
 * @param array $data Variables to pass to the view
 * @return void
 */
function view($view, $data = []) {
    $viewPath = VIEWS_PATH . '/' . $view . '.php';
    if (file_exists($viewPath)) {
        extract($data);
        include $viewPath;
    } else {
        echo "View not found: $viewPath";
    }
}

/**
 * Redirect to another URL
 * 
 * @param string $url The URL to redirect to
 * @return void
 */
function redirect($url) {
    header("Location: $url");
    exit;
}
?>