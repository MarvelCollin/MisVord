<?php

/**
 * Development Server Script
 * 
 * This script allows testing with PHP's built-in server and
 * handles routing properly to emulate Apache's mod_rewrite behavior
 * 
 * Run with: php -S localhost:8000 serve.php
 */

// Detect static file requests
if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js|ico|woff|woff2|svg|ttf)$/', $_SERVER["REQUEST_URI"])) {
    $basePath = __DIR__ . '/public';
    $file = $basePath . $_SERVER["REQUEST_URI"];
    
    if (file_exists($file)) {
        return false; // Let the built-in server handle the request
    }
}

// Define APP_ROOT constant
define('APP_ROOT', __DIR__);

// Log all requests in dev mode
error_log("[DEV SERVER] " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);

// Set the document root to public
chdir(__DIR__ . '/public');

// All non-static requests go to index.php
require_once 'index.php';
