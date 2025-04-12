<?php

class EnvLoader {
    private static $envCache = null;
    
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
     * @return PDO The database connection
     */
    public static function getPDOConnection() {
        $host = self::get('DB_HOST', 'localhost');
        $dbname = self::get('DB_NAME', 'your_database');
        $username = self::get('DB_USER', 'root');
        $password = self::get('DB_PASS', '');
        $charset = self::get('DB_CHARSET', 'utf8mb4');
        
        $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
        $pdo = new PDO($dsn, $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        return $pdo;
    }
}
