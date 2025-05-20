<?php
/**
 * Application Bootstrap
 * 
 * This file is the entry point for bootstrapping the application.
 * It initializes all required components and sets up the environment.
 */

// Define base application path
define('ROOT_PATH', dirname(__DIR__));

// Load environment variables
require_once ROOT_PATH . '/config/env.php';

// Initialize database connection
try {
    // Get database configuration
    $dbConfig = [
        'host' => EnvLoader::get('DB_HOST', 'db'),
        'port' => EnvLoader::get('DB_PORT', '1003'),
        'dbname' => EnvLoader::get('DB_NAME', 'misvord'),
        'username' => EnvLoader::get('DB_USER', 'root'),
        'password' => EnvLoader::get('DB_PASS', 'password'),
        'charset' => EnvLoader::get('DB_CHARSET', 'utf8mb4'),
    ];
    
    // Connect to database
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    
    $pdoOptions = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $pdoOptions);
    
    // Set global database connection
    $GLOBALS['db'] = $pdo;
    
    // Initialize query builder
    require_once ROOT_PATH . '/database/query.php';
    $GLOBALS['query'] = new Query($pdo);
    
} catch (PDOException $e) {
    // If cannot connect to database, try to create it
    if ($e->getCode() == 1049) { // "Unknown database" error code
        // Include database initialization script
        require_once ROOT_PATH . '/init-db.php';
        
        // Try to reconnect after initialization
        try {
            $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $pdoOptions);
            $GLOBALS['db'] = $pdo;
            $GLOBALS['query'] = new Query($pdo);
        } catch (PDOException $e) {
            error_log("Failed to connect to database after initialization: " . $e->getMessage());
            // Continue with application setup even if database connection fails
        }
    } else {
        error_log("Database connection error: " . $e->getMessage());
        // Continue with application setup even if database connection fails
    }
}

// Load route definitions
require_once ROOT_PATH . '/config/routes.php';

// Initialize session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

return [
    'ready' => true
];
