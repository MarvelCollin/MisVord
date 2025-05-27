<?php

function get_db_connection() {
    $host = 'localhost';
    $port = 1003;
    $user = 'root';
    $pass = 'password';
    $dbname = 'misvord';
    
    try {
        $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ];
        
        $pdo = new PDO($dsn, $user, $pass, $options);
        
        // Try to select the database
        try {
            $pdo->exec("USE `$dbname`");
        } catch (PDOException $e) {
            if ($e->getCode() == 1049) { // Unknown database
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $pdo->exec("USE `$dbname`");
                echo "Notice: Database '$dbname' was created automatically.\n";
            } else {
                throw $e;
            }
        }
        
        return $pdo;
    } catch (PDOException $e) {
        echo "Database connection error: " . $e->getMessage() . "\n";
        exit(1);
    }
} 