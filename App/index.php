<?php
/**
 * MiscVord Application Entry Point
 * 
 * This file serves as the main entry point for the MiscVord application.
 * It routes all requests to the web.php router.
 */

// Define application root directory
define('APP_ROOT', __DIR__);

// Start session if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Handle the request through our router
require_once __DIR__ . '/config/web.php';
