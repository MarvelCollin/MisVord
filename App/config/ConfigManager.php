<?php

class ConfigManager {
    private static $instance = null;
    private $config = [];
    private $loaded = false;
    
    private function __construct() {
        $this->loadConfigurations();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function loadConfigurations() {
        if ($this->loaded) {
            return;
        }
        
        require_once __DIR__ . '/env.php';
        
        $this->config = [
            'app' => [
                'name' => APP_NAME ?? 'MisVord',
                'version' => APP_VERSION ?? '1.0.0',
                'env' => EnvLoader::get('APP_ENV', 'development'),
                'debug' => EnvLoader::get('APP_DEBUG', 'true') === 'true',
                'timezone' => 'Asia/Jakarta',
                'root_path' => defined('APP_ROOT') ? APP_ROOT : dirname(__DIR__)
            ],
            'database' => [
                'host' => EnvLoader::get('DB_HOST', 'db'),
                'port' => EnvLoader::get('DB_PORT', '1003'),
                'name' => EnvLoader::get('DB_NAME', 'misvord'),
                'username' => EnvLoader::get('DB_USER', 'root'),
                'password' => EnvLoader::get('DB_PASS', 'kolin123'),
                'charset' => 'utf8mb4'
            ],
            'socket' => [
                'enabled' => true,
                'host' => EnvLoader::get('SOCKET_HOST', 'localhost'),
                'port' => EnvLoader::get('SOCKET_PORT', '1002'),
                'base_path' => EnvLoader::get('SOCKET_BASE_PATH', '/socket.io'),
                'sub_path' => EnvLoader::get('SOCKET_SUBPATH', ''),
                'timeout' => 5,
                'debug' => $this->config['app']['debug'] ?? false
            ],
            'cors' => [
                'enabled' => true,
                'allowed_origins' => explode(',', EnvLoader::get('CORS_ALLOWED_ORIGINS', '*')),
                'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization'],
                'supports_credentials' => true,
                'max_age' => 86400
            ],
            'session' => [
                'name' => 'MISVORD_SESSION',
                'lifetime' => 86400,
                'path' => '/',
                'domain' => '',
                'secure' => EnvLoader::get('APP_ENV', 'development') === 'production',
                'httponly' => true
            ],
            'logging' => [
                'enabled' => true,
                'level' => EnvLoader::get('LOG_LEVEL', 'debug'),
                'path' => (defined('APP_ROOT') ? APP_ROOT : dirname(__DIR__)) . '/logs',
                'max_files' => 30
            ]
        ];
        
        $this->loaded = true;
    }
    
    public function get($key = null, $default = null) {
        if ($key === null) {
            return $this->config;
        }
        
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (!is_array($value) || !isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
    
    public function set($key, $value) {
        $keys = explode('.', $key);
        $config = &$this->config;
        
        foreach ($keys as $k) {
            if (!isset($config[$k]) || !is_array($config[$k])) {
                $config[$k] = [];
            }
            $config = &$config[$k];
        }
        
        $config = $value;
    }
    
    public function has($key) {
        return $this->get($key) !== null;
    }
    
    public function getSocketConfig() {
        return $this->get('socket');
    }
    
    public function getDatabaseConfig() {
        return $this->get('database');
    }
    
    public function getCorsConfig() {
        return $this->get('cors');
    }
    
    public function isProduction() {
        return $this->get('app.env') === 'production';
    }
    
    public function isDebug() {
        return $this->get('app.debug', false);
    }
}

function config($key = null, $default = null) {
    return ConfigManager::getInstance()->get($key, $default);
}
