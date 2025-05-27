<?php

echo "Testing MySQL connection...\n";

$host = 'localhost';
$port = 1003;
$user = 'root';
$pass = 'password';
$dbname = 'misvord';

try {
    echo "Connecting to MySQL at $host:$port as $user...\n";
    
    $dsn = "mysql:host=$host;port=$port";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Successfully connected to MySQL server.\n";
    
    try {
        $pdo->query("USE `$dbname`");
        echo "✓ Successfully connected to database '$dbname'.\n";
    } catch (PDOException $e) {
        echo "! Database '$dbname' doesn't exist.\n";
        
        try {
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            echo "✓ Successfully created database '$dbname'.\n";
        } catch (PDOException $e) {
            echo "✗ Could not create database: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nDatabase connection is fully working!\n";
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    
    if (strpos($e->getMessage(), 'Connection refused') !== false) {
        echo "\nTroubleshooting tips:\n";
        echo "1. Make sure Docker is running\n";
        echo "2. Check if MySQL container is running\n";
        echo "3. Make sure port $port is being exposed in docker-compose.yml\n";
    } elseif (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "\nTroubleshooting tips:\n";
        echo "1. Check if the username and password are correct\n";
        echo "2. Make sure the user has access to the database\n";
    }
} 