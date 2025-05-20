<?php
/**
 * Application Bootstrap File
 * 
 * This file initializes the application by loading necessary components,
 * setting up error handling, and starting the routing system.
 */

// Load configuration files
require_once dirname(__DIR__) . '/config/helpers.php';

// Load environment variables first to determine environment type
require_once dirname(__DIR__) . '/config/env.php';
$env = EnvLoader::getEnv(); // Assuming this loads .env and makes getenv() work

// Set up error handling based on environment
if (getenv('APP_ENV') === 'production') {
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    // Ensure error_log is configured in php.ini or web server to write to a file
    // For example, error_log = /var/log/php_errors.log or similar in your Docker PHP config
} else {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
}

// Enable more comprehensive error logging
error_log("App bootstrapping started. APP_ENV: " . (getenv('APP_ENV') ?: 'not_set'));

// Initialize database connection early
try {
    $pdo = EnvLoader::getPDOConnection();
    error_log("Database connection successful");
} catch (Exception $e) {
    error_log("Database connection failed: " . $e->getMessage());
}

// Load the router configuration and start routing
require_once dirname(__DIR__) . '/config/web.php';
