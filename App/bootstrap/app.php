<?php
/**
 * Application Bootstrap File
 * 
 * This file initializes the application by loading necessary components,
 * setting up error handling, and starting the routing system.
 */

// Load configuration files
require_once dirname(__DIR__) . '/config/helpers.php';

// Set up error handling for development environment
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Enable more comprehensive error logging
error_log("App bootstrapping started");

// Load environment variables
require_once dirname(__DIR__) . '/config/env.php';
$env = EnvLoader::getEnv();

// Initialize database connection early
try {
    $pdo = EnvLoader::getPDOConnection();
    error_log("Database connection successful");
} catch (Exception $e) {
    error_log("Database connection failed: " . $e->getMessage());
}

// Load the router configuration and start routing
require_once dirname(__DIR__) . '/config/web.php';
