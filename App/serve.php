<?php

/**
 * PHP Built-in Server Launcher
 * 
 * This script is maintained for backward compatibility.
 * It's recommended to use `php artisan serve` instead.
 */

// Define the directory path where this script is located
$rootPath = __DIR__;
$host = 'localhost';
$port = 8080;

// Ensure we're in the correct directory
chdir($rootPath);

// Clear the terminal
echo "\033[2J\033[;H";

echo "Starting MiscVord development server...\n";
echo "Root path: $rootPath\n";
echo "Server URL: http://$host:$port\n";
echo "\033[33mNOTE: This script is deprecated. Please use `php artisan serve` instead.\033[0m\n\n";

// Router file path
$routerPath = $rootPath . DIRECTORY_SEPARATOR . 'router.php';

if (!file_exists($routerPath)) {
    echo "Error: Router file not found at: $routerPath\n";
    exit(1);
}

// Command to start the server
$command = sprintf(
    'php -S %s:%d -t %s %s',
    $host,
    $port,
    escapeshellarg($rootPath),
    escapeshellarg($routerPath)
);

echo "Executing: $command\n";
echo "Press Ctrl+C to stop the server.\n\n";

// Start the server
system($command);
