<?php
// Show all errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Environment Variables Check</h1>";

echo "<h2>Using getenv():</h2>";
echo "<pre>";
echo "DB_HOST: " . getenv('DB_HOST') . "\n";
echo "DB_NAME: " . getenv('DB_NAME') . "\n";
echo "DB_USER: " . getenv('DB_USER') . "\n";
echo "DB_PASS: " . getenv('DB_PASS') . "\n"; 
echo "DB_CHARSET: " . getenv('DB_CHARSET') . "\n";
echo "</pre>";

echo "<h2>Using $_ENV:</h2>";
echo "<pre>";
print_r($_ENV);
echo "</pre>";

echo "<h2>Using $_SERVER:</h2>";
echo "<pre>";
echo "DB_HOST: " . ($_SERVER['DB_HOST'] ?? 'Not set') . "\n";
echo "DB_NAME: " . ($_SERVER['DB_NAME'] ?? 'Not set') . "\n";
echo "DB_USER: " . ($_SERVER['DB_USER'] ?? 'Not set') . "\n";
echo "DB_PASS: " . ($_SERVER['DB_PASS'] ?? 'Not set') . "\n";
echo "DB_CHARSET: " . ($_SERVER['DB_CHARSET'] ?? 'Not set') . "\n";
echo "</pre>";

echo "<h2>All Server Variables:</h2>";
echo "<pre>";
print_r($_SERVER);
echo "</pre>"; 