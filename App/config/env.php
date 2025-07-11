<?php

class EnvLoader {
    private static $loaded = false;
    private static $envVars = [];
    private static $loadedPath = null;public static function load($envPath = null) {
        if (self::$loaded) {
            return;
        }

        if ($envPath === null) {

            $possiblePaths = [
                dirname(__DIR__) . '/.env',                    
                dirname(__FILE__, 2) . '/.env',                
                (defined('APP_ROOT') ? APP_ROOT : '') . '/.env', 
                getcwd() . '/.env',                            
                $_SERVER['DOCUMENT_ROOT'] . '/../.env',        
            ];

            foreach ($possiblePaths as $path) {
                if (!empty($path) && file_exists($path)) {
                    $envPath = $path;
                    break;
                }
            }

            if (!$envPath) {
                error_log("Warning: .env file not found in any of the expected locations:");
                error_log("Attempted paths: " . implode(', ', array_filter($possiblePaths)));
                error_log("Current working directory: " . getcwd());
                self::$loaded = true;
                return;
            }
        }

        if (!file_exists($envPath)) {
            error_log("Warning: .env file not found at: " . $envPath);
            self::$loaded = true;
            return;
        }

        if (!is_readable($envPath)) {
            error_log("Warning: .env file is not readable at: " . $envPath);
            self::$loaded = true;
            return;
        }

        $content = file_get_contents($envPath);
        if ($content === false) {
            error_log("Warning: Could not read .env file at: " . $envPath);
            self::$loaded = true;
            return;
        }

        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        $content = str_replace(["\r\n", "\r"], "\n", $content);
        $lines = explode("\n", $content);

        foreach ($lines as $line) {
            $line = trim($line);

            if (empty($line) || strpos($line, '#') === 0 || strpos($line, '//') === 0) {
                continue;
            }

            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                $value = trim($value, '"\'');

                self::$envVars[$key] = $value;
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }

        self::$loaded = true;
        self::$loadedPath = $envPath;
        error_log("✅ Environment variables loaded successfully from: " . $envPath);
    }    public static function get($key, $default = null) {

        self::load();

        $isDocker = (
            getenv('IS_DOCKER') === 'true' || 
            isset($_SERVER['IS_DOCKER']) || 
            getenv('CONTAINER') !== false ||
            isset($_SERVER['CONTAINER']) ||
            file_exists('/.dockerenv')
        );

        if ($isDocker) {

            $dockerSources = [
                $_SERVER[$key] ?? null,
                getenv($key),
                $_ENV[$key] ?? null
            ];

            foreach ($dockerSources as $value) {
                if ($value !== false && $value !== null && $value !== '') {
                    error_log("EnvLoader Debug - Found $key in Docker environment: " . substr($value, 0, 10) . "...");
                    return $value;
                }
            }

            error_log("EnvLoader Debug - $key not found in Docker environment, checking .env file");
        }

        $value = self::$envVars[$key] ?? $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

        if ($value !== false && $value !== null && $value !== '') {
            if ($isDocker) {
                error_log("EnvLoader Debug - Found $key in .env file: " . substr($value, 0, 10) . "...");
            }
            return $value;
        }

        if ($isDocker) {
            error_log("EnvLoader Debug - $key not found anywhere, using default: " . ($default ?? 'null'));
        }

        return $default;
    }

    public static function getAll() {
        self::load();
        return self::$envVars;
    }

    public static function isLoaded() {
        return self::$loaded;
    }
    
    public static function getLoadedPath() {
        return self::$loadedPath;
    }
    
    public static function debug() {
        return [
            'loaded' => self::$loaded,
            'loaded_path' => self::$loadedPath,
            'env_vars_count' => count(self::$envVars),
            'app_env' => self::get('APP_ENV'),
            'db_host' => self::get('DB_HOST'),
            'socket_port' => self::get('SOCKET_PORT'),
        ];
    }
}

EnvLoader::load();

$dbConfig = [
    'host' => EnvLoader::get('DB_HOST', 'db'),
    'port' => EnvLoader::get('DB_PORT', '1003'),
    'dbname' => EnvLoader::get('DB_NAME', 'misvord'),
    'username' => EnvLoader::get('DB_USER', 'root'),
    'password' => EnvLoader::get('DB_PASS', ''),
];