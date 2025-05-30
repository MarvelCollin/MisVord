<?php

function get_db_connection() {
    require_once __DIR__ . '/env.php';    $host = EnvLoader::get('DB_HOST', 'db');
    $port = EnvLoader::get('DB_PORT', 1003);
    $user = EnvLoader::get('DB_USER', 'root');
    $pass = EnvLoader::get('DB_PASS', 'kolin123');
    $dbname = EnvLoader::get('DB_NAME', 'misvord');
    $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');
    
    try {
        // Force TCP/IP connection by explicitly including port
        $dsn = "mysql:host=$host;port=$port;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5,
            // Force TCP connection
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES $charset",
            // Disable persistent connections
            PDO::ATTR_PERSISTENT => false,
        ];
        
        $pdo = new PDO($dsn, $user, $pass, $options);
        
        try {
            $pdo->exec("USE `$dbname`");
        } catch (PDOException $e) {
            if ($e->getCode() == 1049) {
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE {$charset}_unicode_ci");
                $pdo->exec("USE `$dbname`");
            } else {
                throw $e;
            }
        }
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        
        if (getenv('APP_ENV') === 'production') {
            die("Database connection error. Please try again later.");
        } else {
            die("Database connection error: " . $e->getMessage());
        }
    }
} 