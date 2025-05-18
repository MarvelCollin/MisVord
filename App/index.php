<?php
/**
 * Main Application Entry Point
 *
 * This file redirects all requests to the public/index.php file
 * which is the proper entry point for the application when using Apache.
 */

// Set autoplay permission policy
header("Permissions-Policy: autoplay=*");

// Check if accessed directly (should happen only during development)
if (php_sapi_name() !== 'cli-server' && 
    !isset($_SERVER['DOCUMENT_ROOT']) && 
    !preg_match('/\/public\/index.php$/', $_SERVER['SCRIPT_FILENAME'])) {
    
    // Log accessing index.php directly
    error_log("Main index.php accessed directly - redirecting to public/index.php");
    
    // Define app root to be used in public/index.php
    define('APP_ROOT', __DIR__);
    
    // Require the public/index.php file
    require_once __DIR__ . '/public/index.php';
} else {
    // Define app root
    define('APP_ROOT', __DIR__);
    
    // Start session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Include the main router
    require_once __DIR__ . '/router.php';
}
