<?php
/**
 * Main Application Entry Point
 * Redirects to public/index.php for proper web server setup
 */

// Define APP_ROOT for the application
define('APP_ROOT', __DIR__);

// Check if we're being accessed directly (not through web server document root)
if (php_sapi_name() !== 'cli-server' && 
    !isset($_SERVER['DOCUMENT_ROOT']) && 
    !preg_match('/\/public\/index.php$/', $_SERVER['SCRIPT_FILENAME'])) {
    
    // Redirect to proper entry point
    require_once __DIR__ . '/public/index.php';
} else {
    // Normal application initialization
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Initialize application configuration
    require_once __DIR__ . '/config/app.php';    // Application router
    require_once __DIR__ . '/router.php';
}