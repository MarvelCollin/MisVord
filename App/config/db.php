<?php

/**
 * Get a PDO database connection
 */
function get_db_connection() {
    // Use EnvLoader to get database configuration
    require_once __DIR__ . '/env.php';
    
    $host = EnvLoader::get('DB_HOST', 'localhost');
    $port = EnvLoader::get('DB_PORT', 1003);
    $user = EnvLoader::get('DB_USER', 'root');
    $pass = EnvLoader::get('DB_PASS', 'password');
    $dbname = EnvLoader::get('DB_NAME', 'misvord');
    $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');
    
    try {
        $dsn = "mysql:host=$host;port=$port;charset=$charset";
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
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE {$charset}_unicode_ci");
                $pdo->exec("USE `$dbname`");
            } else {
                throw $e;
            }
        }
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        
        // In production, we don't want to show error details
        if (getenv('APP_ENV') === 'production') {
            die("Database connection error. Please try again later.");
        } else {
            die("Database connection error: " . $e->getMessage());
        }
    }
} 