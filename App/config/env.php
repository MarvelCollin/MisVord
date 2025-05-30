<?php
// Environment configuration loader

class EnvLoader {
    public static function get($key, $default = null) {
        $value = getenv($key);
        return $value !== false ? $value : $default;
    }
}

// Database configuration
$dbConfig = [
    'host' => EnvLoader::get('DB_HOST', 'db'),
    'port' => EnvLoader::get('DB_PORT', '1003'),
    'dbname' => EnvLoader::get('DB_NAME', 'misvord'),
    'username' => EnvLoader::get('DB_USER', 'root'),
    'password' => EnvLoader::get('DB_PASS', 'kolin123'),
];