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
        
        require_once __DIR__ . '/db.php';
        
        $this->config['app'] = [
            'name' => defined('APP_NAME') ? APP_NAME : 'MisVord',
            'version' => defined('APP_VERSION') ? APP_VERSION : '1.0.0',
            'env' => EnvLoader::get('APP_ENV', 'development'),
            'debug' => EnvLoader::get('APP_DEBUG', 'true') === 'true',
            'url' => EnvLoader::get('APP_URL', 'http://localhost:1001'),
            'timezone' => 'Asia/Jakarta'
        ];
        
        $this->config['database'] = [
            'host' => EnvLoader::get('DB_HOST', 'localhost'),
            'port' => EnvLoader::get('DB_PORT', '1003'),
            'name' => EnvLoader::get('DB_NAME', 'misvord'),
            'username' => EnvLoader::get('DB_USER', 'root'),
            'password' => EnvLoader::get('DB_PASS', ''),
            'charset' => EnvLoader::get('DB_CHARSET', 'utf8mb4')
        ];

        if (empty($this->config['database']['password'])) {
            throw new Exception('DB_PASS environment variable is required but not set');
        }
        
        $this->config['socket'] = [
            'port' => EnvLoader::get('SOCKET_PORT', '1002'),
            'base_path' => EnvLoader::get('SOCKET_BASE_PATH', '/socket.io'),
            'subpath' => EnvLoader::get('SOCKET_SUBPATH', ''),
            'server_local' => EnvLoader::get('SOCKET_SERVER_LOCAL', 'http://localhost:1002'),
            'api_key' => EnvLoader::get('SOCKET_API_KEY', ''),
            'secure_port' => EnvLoader::get('SOCKET_SECURE_PORT', '1443')
        ];

        if (empty($this->config['socket']['api_key'])) {
            throw new Exception('SOCKET_API_KEY environment variable is required but not set');
        }
        
        $this->config['session'] = [
            'lifetime' => EnvLoader::get('SESSION_LIFETIME', 86400),
            'secure' => EnvLoader::get('SESSION_SECURE', 'false') === 'true',
            'httponly' => EnvLoader::get('SESSION_HTTPONLY', 'true') === 'true'
        ];
        
        $this->config['google'] = [
            'client_id' => EnvLoader::get('GOOGLE_CLIENT_ID', ''),
            'client_secret' => EnvLoader::get('GOOGLE_CLIENT_SECRET', '')
        ];
        
        $this->config['videosdk'] = [
            'api_key' => EnvLoader::get('VIDEOSDK_API_KEY', ''),
            'secret_key' => EnvLoader::get('VIDEOSDK_SECRET_KEY', ''),
            'token' => EnvLoader::get('VIDEOSDK_TOKEN', '')
        ];
        
        $this->loaded = true;
    }
    
    public function get($key = null, $default = null) {
        if ($key === null) {
            return $this->config;
        }
        
        if (strpos($key, '.') !== false) {
            $keys = explode('.', $key);
            $value = $this->config;
            
            foreach ($keys as $k) {
                if (isset($value[$k])) {
                    $value = $value[$k];
                } else {
                    return $default;
                }
            }
            
            return $value;
        }
        
        return $this->config[$key] ?? $default;
    }
    
    public function set($key, $value) {
        if (strpos($key, '.') !== false) {
            $keys = explode('.', $key);
            $config = &$this->config;
            
            foreach ($keys as $k) {
                if (!isset($config[$k]) || !is_array($config[$k])) {
                    $config[$k] = [];
                }
                $config = &$config[$k];
            }
            
            $config = $value;
        } else {
            $this->config[$key] = $value;
        }
    }
    
    public function has($key) {
        return $this->get($key) !== null;
    }
    
    public function all() {
        return $this->config;
    }
    
    public function getEnvironment() {
        return $this->get('app.env', 'development');
    }
    
    public function isProduction() {
        return $this->getEnvironment() === 'production';
    }
    
    public function isDebug() {
        return $this->get('app.debug', false);
    }
    
    public function getDatabaseConfig() {
        return $this->get('database', []);
    }
    
    public function getSocketConfig() {
        return $this->get('socket', []);
    }
}
