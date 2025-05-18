<?php
// Define the application root directory
define('APP_ROOT', dirname(__DIR__));

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Enable error display for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log the request for debugging
error_log("Request: " . $_SERVER['REQUEST_URI']);
error_log("APP_ROOT: " . APP_ROOT);

// Use the local version of router.php in the public directory
require_once __DIR__ . '/router.php'; 