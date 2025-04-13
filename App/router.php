<?php
/**
 * PHP Built-in Server Router
 * 
 * This file routes all requests to the web.php router when using PHP's built-in server.
 */

// Route static files directly
if (preg_match('/\.(?:css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|webp)$/', $_SERVER["REQUEST_URI"])) {
    return false; // Let the built-in server handle static files
}

// Log routing information for debugging
error_log("Router: Processing " . $_SERVER['REQUEST_METHOD'] . " request to " . $_SERVER['REQUEST_URI']);

// All other requests go through our router
require_once __DIR__ . '/config/web.php';
