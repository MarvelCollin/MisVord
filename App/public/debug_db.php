<?php
// Show all errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Database Connection Test</h1>";

require_once __DIR__ . '/../config/env.php';

echo "<h2>Environment Variables</h2>";
$env = EnvLoader::getEnv();
echo "<pre>";
print_r($env);
echo "</pre>";

try {
    echo "<h2>Testing Database Connection</h2>";
    $pdo = EnvLoader::getPDOConnection();
    echo "Database connection successful!";
    
    echo "<h2>Testing Query</h2>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>Tables in database:</h3>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>$table</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h2>Error connecting to database</h2>";
    echo "<p>Error message: " . $e->getMessage() . "</p>";
    echo "<p>Error code: " . $e->getCode() . "</p>";
} 