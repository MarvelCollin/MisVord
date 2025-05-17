<?php
// Simple test file that doesn't require models or complex logic
// This helps isolate where the problem occurs

// Show errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>MiscVord Test Page</h1>";
echo "<p>This page is used to verify basic PHP functionality.</p>";

// Test environment variables
echo "<h2>Environment Variables</h2>";
echo "<ul>";
echo "<li>DB_HOST: " . (getenv('DB_HOST') ?: 'Not set') . "</li>";
echo "<li>DB_NAME: " . (getenv('DB_NAME') ?: 'Not set') . "</li>";
echo "<li>DB_USER: " . (getenv('DB_USER') ?: 'Not set') . "</li>";
echo "<li>DB_CHARSET: " . (getenv('DB_CHARSET') ?: 'Not set') . "</li>";
echo "</ul>";

// Test file paths
echo "<h2>File Paths</h2>";
echo "<ul>";
echo "<li>Current file: " . __FILE__ . "</li>";
echo "<li>Document root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
echo "<li>App base path: " . dirname(__DIR__) . "</li>";
echo "</ul>";

// Check if critical files exist
echo "<h2>Critical Files</h2>";
echo "<ul>";
$files = [
    'config/env.php', 
    'config/web.php',
    'controllers/AuthenticationController.php',
    'database/models/User.php'
];

foreach ($files as $file) {
    $fullPath = dirname(__DIR__) . '/' . $file;
    echo "<li>" . $file . ": " . (file_exists($fullPath) ? "EXISTS" : "MISSING") . "</li>";
}
echo "</ul>";

echo "<p>If all files exist and environment variables are set, your basic setup is correct.</p>"; 