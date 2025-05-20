<?php

/**
 * Database Initialization Script
 * 
 * This script creates the database if it doesn't exist and runs migrations.
 * It can be executed independently from the command line or included in the application bootstrap.
 */

// Load environment variables
require_once __DIR__ . '/config/env.php';

// Function to handle database initialization errors
function handleDbError($error, $errorMessage) {
    echo "[ERROR] $errorMessage: " . $error->getMessage() . "\n";
    echo "[INFO] Error code: " . $error->getCode() . "\n";
    
    // Provide troubleshooting tips based on the error code
    switch ($error->getCode()) {
        case 1044: // Access denied error
            echo "[TIP] Check that DB_USER has proper privileges to create databases\n";
            echo "[TIP] Try running: GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';\n";
            break;
        case 1045: // Invalid credentials
            echo "[TIP] Verify that DB_USER and DB_PASS match what's in your docker-compose.yml\n";
            break;
        case 2002: // Connection refused
            echo "[TIP] Make sure the MySQL container is running and accessible at DB_HOST:DB_PORT\n";
            echo "[TIP] Run: docker ps | grep db\n";
            break;
        default:
            echo "[TIP] Check MySQL logs: docker logs miscvord_db\n";
    }
}

echo "[STEP] Starting database initialization...\n";

try {
    // Get database connection parameters
    $host = EnvLoader::get('DB_HOST', 'db');
    $port = EnvLoader::get('DB_PORT', '1003');
    $dbname = EnvLoader::get('DB_NAME', 'misvord');
    $username = EnvLoader::get('DB_USER', 'root');
    $password = EnvLoader::get('DB_PASS', 'password');
    $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');
    
    echo "[INFO] Connecting to MySQL at $host:$port with user '$username'\n";
    
    // First connect without database name to check if it exists
    try {
        $dsn = "mysql:host=$host;port=$port;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5, // 5 second timeout
        ];
        
        $pdo = new PDO($dsn, $username, $password, $options);
        echo "[SUCCESS] Connected to MySQL server\n";
        
        // Check if database exists
        $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$dbname'");
        $databaseExists = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$databaseExists) {
            echo "[INFO] Database '$dbname' does not exist. Creating...\n";
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE {$charset}_unicode_ci");
            echo "[SUCCESS] Database '$dbname' created successfully\n";
        } else {
            echo "[INFO] Database '$dbname' already exists\n";
        }
        
        // Connect to the specific database
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Create migrations table if it doesn't exist
        echo "[INFO] Checking if migrations table exists...\n";
        $stmt = $pdo->query("SHOW TABLES LIKE 'migrations'");
        if (!$stmt->fetch()) {
            echo "[INFO] Creating migrations table...\n";
            $pdo->exec("
                CREATE TABLE migrations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    migration VARCHAR(255) NOT NULL,
                    batch INT NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=$charset;
            ");
            echo "[SUCCESS] Migrations table created successfully\n";
        } else {
            echo "[INFO] Migrations table already exists\n";
        }
        
        echo "[INFO] Database initialization completed successfully\n";
        
        // Run migrations next
        echo "[STEP] Running migrations...\n";
        require_once __DIR__ . '/database/migration.php';
        
        $migration = new Migration($pdo);
        
        // Create a migration runner
        echo "[INFO] Starting migration runner...\n";
        require_once __DIR__ . '/database/migration.php';
        
        $migrationRunner = new MigrationRunner($pdo);
        $result = $migrationRunner->run();
        
        if ($result) {
            echo "[SUCCESS] Migrations completed successfully\n";
        } else {
            echo "[WARNING] No migrations were run\n";
        }
        
    } catch (PDOException $e) {
        handleDbError($e, "Failed to establish database connection");
        
        // Try connecting via IP instead of hostname
        echo "[INFO] Attempting alternative connection method...\n";
        try {
            // Try with host 127.0.0.1 instead of 'db'
            $dsn = "mysql:host=127.0.0.1;port=$port;charset=$charset";
            $pdo = new PDO($dsn, $username, $password, $options);
            echo "[SUCCESS] Connected via IP address\n";
            
            // Create database
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE {$charset}_unicode_ci");
            echo "[SUCCESS] Database '$dbname' created successfully via IP connection\n";
        } catch (PDOException $e2) {
            handleDbError($e2, "Alternative connection method failed");
            exit(1);
        }
    }
    
} catch (Exception $e) {
    echo "[ERROR] Unexpected error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "[COMPLETE] Database setup finished\n"; 