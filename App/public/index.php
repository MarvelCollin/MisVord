<?php
/**
 * MiscVord Application Front Controller
 * 
 * This is the main entry point for the MiscVord application.
 * All HTTP requests are routed through this file.
 */

// Define the application base path
define('APP_BASE_PATH', dirname(__DIR__));

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load configuration files - uncomment if you have helpers.php
// require_once APP_BASE_PATH . '/config/helpers.php';

// Load the router directly
require_once APP_BASE_PATH . '/config/web.php';

// Health check endpoint for Docker
if ($_SERVER['REQUEST_URI'] === '/health') {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok', 'time' => time()]);
    exit;
}

// This code will only run if the router didn't handle the request
echo "Error: Request could not be processed";
exit;