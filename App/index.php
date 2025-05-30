<?php
/**
 * Main Application Entry Point
 *
 * This file redirects all requests to the public/index.php file
 * which is the proper entry point for the application when using Apache.
 */

header("Permissions-Policy: autoplay=*");

if (php_sapi_name() !== 'cli-server' && 
    !isset($_SERVER['DOCUMENT_ROOT']) && 
    !preg_match('/\/public\/index.php$/', $_SERVER['SCRIPT_FILENAME'])) {

    error_log("Main index.php accessed directly - redirecting to public/index.php");

    define('APP_ROOT', __DIR__);

    require_once __DIR__ . '/public/index.php';
} else {

    define('APP_ROOT', __DIR__);

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Initialize application configuration
    require_once __DIR__ . '/config/app.php';

    // Database tables are already created via migrations
    // Table initialization has been moved to the migration system
    // require_once __DIR__ . '/database/models/User.php';
    // require_once __DIR__ . '/database/models/Server.php';
    // require_once __DIR__ . '/database/models/UserServerMembership.php';
    
    // Initialize tables in the proper order to handle foreign key constraints
    // User::initialize();
    // Server::initialize();
    // UserServerMembership::initialize();

    // Application router
    require_once __DIR__ . '/router.php';
}