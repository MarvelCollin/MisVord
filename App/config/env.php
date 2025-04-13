<?php

class EnvLoader {
    private static $envCache = null;
    private static $pdoInstance = null;
    
    /**
     * Parse .env file and return as associative array
     *
     * @param string $filePath Path to .env file (optional)
     * @return array Parsed environment variables
     */
    public static function getEnv($filePath = null) {
        // If already loaded, return the cached version
        if (self::$envCache !== null) {
            return self::$envCache;
        }
        
        // If no path provided, use default relative to this file
        if ($filePath === null) {
            $filePath = __DIR__ . '/../.env';
        }
        
        if (!file_exists($filePath)) {
            return self::$envCache = [];
        }
        
        $env = [];
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '//') === 0 || strpos(trim($line), '#') === 0) {
                continue;
            }
            
            // Split by first equals sign
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if they exist
                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                    $value = $matches[1];
                }
                
                $env[$key] = $value;
            }
        }
        
        // Cache the result
        self::$envCache = $env;
        return $env;
    }
    
    /**
     * Get a specific environment variable with optional default value
     *
     * @param string $key The environment variable key
     * @param mixed $default Default value if key doesn't exist
     * @return mixed The value or default if not found
     */
    public static function get($key, $default = null) {
        $env = self::getEnv();
        return isset($env[$key]) ? $env[$key] : $default;
    }
    
    /**
     * Creates a PDO connection using environment variables
     * 
     * @param bool $force Force creation of a new connection
     * @return PDO The database connection
     */
    public static function getPDOConnection($force = false) {
        // Return existing connection if available and not forcing a new one
        if (!$force && self::$pdoInstance !== null) {
            return self::$pdoInstance;
        }
        
        $host = self::get('DB_HOST', 'localhost');
        $dbname = self::get('DB_NAME', 'misvord');
        $username = self::get('DB_USER', 'root');
        $password = self::get('DB_PASS', '');
        $charset = self::get('DB_CHARSET', 'utf8mb4');
        
        try {
            // Try connecting with database name first
            $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
            
            // Set options array with buffered queries enabled
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true, // Enable buffered queries
                PDO::ATTR_EMULATE_PREPARES => false, // Use native prepared statements
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC // Default fetch mode
            ];
            
            self::$pdoInstance = new PDO($dsn, $username, $password, $options);
            return self::$pdoInstance;
        } catch (PDOException $e) {
            // If connecting with database name fails, try connecting without database
            if ($e->getCode() == 1049) { // Unknown database
                try {
                    // Connect without specifying a database
                    $dsn = "mysql:host=$host;charset=$charset";
                    self::$pdoInstance = new PDO($dsn, $username, $password, $options);
                    
                    // Try to create the database
                    self::$pdoInstance->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset");
                    
                    // Now connect with the database name
                    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
                    self::$pdoInstance = new PDO($dsn, $username, $password, $options);
                    
                    echo "Notice: Database '$dbname' was created automatically.\n";
                    return self::$pdoInstance;
                } catch (PDOException $e2) {
                    throw new PDOException("Failed to connect or create database: " . $e2->getMessage(), $e2->getCode());
                }
            } else {
                throw $e; // Re-throw original exception for other errors
            }
        }
    }
}
