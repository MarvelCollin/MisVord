<?php

class EnvLoader {
    private static $envCache = null;
    private static $pdoInstance = null;

    public static function getEnv($filePath = null) {
        if (self::$envCache !== null) {
            return self::$envCache;
        }

        $env = [];

        // Check for Docker environment
        $isDocker = getenv('IS_DOCKER') === 'true' || file_exists('/.dockerenv');
        
        // Default Docker values (used in docker-compose.yml)
        $dockerDefaults = [
            'DB_HOST' => 'db',
            'DB_PORT' => '1003',
            'DB_NAME' => 'misvord',
            'DB_USER' => 'root',
            'DB_PASS' => 'password',
            'DB_CHARSET' => 'utf8mb4'
        ];
        
        // Always prioritize environment variables
        $env['DB_HOST'] = getenv('DB_HOST') ?: ($isDocker ? $dockerDefaults['DB_HOST'] : 'localhost');
        $env['DB_PORT'] = getenv('DB_PORT') ?: ($isDocker ? $dockerDefaults['DB_PORT'] : '1003');
        $env['DB_NAME'] = getenv('DB_NAME') ?: ($isDocker ? $dockerDefaults['DB_NAME'] : 'misvord');
        $env['DB_USER'] = getenv('DB_USER') ?: ($isDocker ? $dockerDefaults['DB_USER'] : 'root');
        $env['DB_PASS'] = getenv('DB_PASS') ?: ($isDocker ? $dockerDefaults['DB_PASS'] : 'password');
        $env['DB_CHARSET'] = getenv('DB_CHARSET') ?: 'utf8mb4';
        $env['SOCKET_SERVER'] = getenv('SOCKET_SERVER') ?: ($isDocker ? 'http://socket-server:1002' : 'http://localhost:1002');
        $env['SOCKET_API_KEY'] = getenv('SOCKET_API_KEY') ?: 'kolin123';
        $env['IS_DOCKER'] = $isDocker ? 'true' : 'false';
        
        // Debug info
        if (isset($_SERVER['argv']) && (in_array('db:check', $_SERVER['argv']) || in_array('migrate:status', $_SERVER['argv']))) {
            echo "Environment variables loaded:\n";
            echo "- DB_HOST: " . getenv('DB_HOST') . " -> {$env['DB_HOST']}\n";
            echo "- DB_PORT: " . getenv('DB_PORT') . " -> {$env['DB_PORT']}\n";
            echo "- DB_USER: " . getenv('DB_USER') . " -> {$env['DB_USER']}\n";
            echo "- DB_PASS: " . (getenv('DB_PASS') ? '(set)' : '(not set)') . " -> " . ($env['DB_PASS'] ? '(set)' : '(not set)') . "\n";
            echo "- DB_NAME: " . getenv('DB_NAME') . " -> {$env['DB_NAME']}\n";
            echo "- IS_DOCKER: " . getenv('IS_DOCKER') . " -> {$env['IS_DOCKER']}\n\n";
        }

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
            // Debug info
            if (isset($_SERVER['argv']) && in_array('db:check', $_SERVER['argv'])) {
                echo "Attempting to connect to MySQL with:\n";
                echo "- Host: $host\n";
                echo "- Port: $port\n";
                echo "- Database: $dbname\n";
                echo "- Username: $username\n";
                echo "- Password: " . str_repeat('*', strlen($password)) . "\n\n";
            }
            
            $dsn = "mysql:host=$host;port=$port;charset=$charset";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true, 
                PDO::ATTR_EMULATE_PREPARES => false, 
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5, // Set connection timeout to 5 seconds
            ];

            // Debug the actual connection parameters
            if (isset($_SERVER['argv']) && (in_array('db:check', $_SERVER['argv']) || in_array('migrate:status', $_SERVER['argv']))) {
                echo "Creating PDO connection with:\n";
                echo "- DSN: $dsn\n";
                echo "- Username: $username\n";
                echo "- Password length: " . strlen($password) . "\n\n";
            }

            self::$pdoInstance = new PDO($dsn, $username, $password, $options);
            
            // Now that we're connected, try to select the database
            try {
                self::$pdoInstance->exec("USE `$dbname`");
            } catch (PDOException $e) {
                if ($e->getCode() == 1049) { // Unknown database
                    self::$pdoInstance->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET $charset COLLATE {$charset}_unicode_ci");
                    self::$pdoInstance->exec("USE `$dbname`");
                    if (isset($_SERVER['argv']) && in_array('db:check', $_SERVER['argv'])) {
                        echo "Notice: Database '$dbname' was created automatically.\n";
                    }
                } else {
                    throw $e;
                }
            }
            
            return self::$pdoInstance;
        } catch (PDOException $e) {
            if (isset($_SERVER['argv']) && in_array('db:check', $_SERVER['argv'])) {
                echo "Connection error: " . $e->getMessage() . "\n";
                
                if (strpos($e->getMessage(), 'Connection refused') !== false) {
                    echo "\nPossible causes:\n";
                    echo "1. MySQL server is not running\n";
                    echo "2. MySQL server is not accessible at $host:$port\n";
                    echo "3. Firewall is blocking connections\n";
                }
            }
                throw $e; 
        }
    }
}