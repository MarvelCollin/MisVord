<?php
/**
 * Development Server Script for MiscVord
 * 
 * This script provides a simple development server for the MiscVord application.
 * Run this with: php serve.php
 */

$host = '127.0.0.1';
$port = 8000;
$root = __DIR__;  // Use the current directory as document root

// Check if PHP's built-in web server is available
if (in_array('--server', $_SERVER['argv'])) {
    // This block runs when PHP's built-in server calls this script for routing
    $uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    
    // Serve static files directly
    $file = $root . $uri;
    if (is_file($file)) {
        // Determine MIME type based on extension
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mime = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            'ico' => 'image/x-icon',
            'json' => 'application/json',
        ][$ext] ?? 'text/plain';
        
        header("Content-Type: $mime");
        readfile($file);
        return true;
    }
    
    // Include the index.php file to handle the request
    include $root . '/index.php';
    return true;
} else {
    // This block runs when the script is called directly from the command line
    
    echo "\033[32m Starting MiscVord Development Server...\033[0m\n";
    echo "\033[33m Server running at http://{$host}:{$port}\033[0m\n";
    echo "\033[33m Document Root: {$root}\033[0m\n";
    echo "\033[33m Press Ctrl+C to quit.\033[0m\n\n";
    
    // Start the built-in web server and use this file as the router script
    $command = sprintf(
        'php -S %s:%d %s --server',
        $host,
        $port,
        __FILE__
    );
    
    passthru($command);
}
