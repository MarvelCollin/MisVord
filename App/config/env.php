<?php

class EnvLoader {
    private static $envCache = null;
    private static $pdoInstance = null;
    
    public static function getEnv($filePath = null) {
        if (self::$envCache !== null) {
            return self::$envCache;
        }
        
        // Initialize with Docker/system environment variables first
        $env = [];
        
        // Database connection variables
        $env['DB_HOST'] = getenv('DB_HOST') ?: 'db';
        $env['DB_PORT'] = getenv('DB_PORT') ?: '1003';
        $env['DB_NAME'] = getenv('DB_NAME') ?: 'misvord';
        $env['DB_USER'] = getenv('DB_USER') ?: 'root';
        $env['DB_PASS'] = getenv('DB_PASS') ?: 'password';
        $env['DB_CHARSET'] = getenv('DB_CHARSET') ?: 'utf8mb4';
        $env['SOCKET_SERVER'] = getenv('SOCKET_SERVER') ?: 'http://socket-server:1002';
        $env['SOCKET_API_KEY'] = getenv('SOCKET_API_KEY') ?: 'kolin123';
        
        // Try to load from .env file if it exists
        if ($filePath === null) {
            $filePath = __DIR__ . '/../.env';
        }
        
        if (file_exists($filePath)) {
            $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                if (strpos(trim($line), '//') === 0 || strpos(trim($line), '#') === 0) {
                    continue;
                }
                
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    
                    if (preg_match('/^"(.*)"$/', $value, $matches)) {
                        $value = $matches[1];
                    } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                        $value = $matches[1];
                    }
                    
                    $env[$key] = $value;
                }
            }
        }
        
        self::$envCache = $env;
        return $env;
    }

    public static function get($key, $default = null) {
        $env = self::getEnv();
        return isset($env[$key]) ? $env[$key] : $default;
    }
    
    public static function getPDOConnection($force = false) {
        if (!$force && self::$pdoInstance !== null) {
            return self::$pdoInstance;
        }
        
        $host = self::get('DB_HOST', 'db');
        $port = self::get('DB_PORT', '1003');
        $dbname = self::get('DB_NAME', 'misvord');
        $username = self::get('DB_USER', 'root');
        $password = self::get('DB_PASS', 'password');
        $charset = self::get('DB_CHARSET', 'utf8mb4');
        
        try {
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true, 
                PDO::ATTR_EMULATE_PREPARES => false, 
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC 
            ];
            
            self::$pdoInstance = new PDO($dsn, $username, $password, $options);
            return self::$pdoInstance;
        } catch (PDOException $e) {
            if ($e->getCode() == 1049) {
                try {
                    $dsn = "mysql:host=$host;port=$port;charset=$charset";
                    self::$pdoInstance = new PDO($dsn, $username, $password, $options);
                    
                    self::$pdoInstance->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset");
                    
                    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
                    self::$pdoInstance = new PDO($dsn, $username, $password, $options);
                    
                    echo "Notice: Database '$dbname' was created automatically.\n";
                    return self::$pdoInstance;
                } catch (PDOException $e2) {
                    throw new PDOException("Failed to connect or create database: " . $e2->getMessage(), $e2->getCode());
                }
            } else {
                throw $e; 
            }
        }
    }
}
