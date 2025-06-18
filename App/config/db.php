<?php

class Database {
    private static $instance = null;
    private $pdo;    private function __construct() {
        try {

            require_once __DIR__ . '/env.php';

            $host = EnvLoader::get('DB_HOST', 'localhost');
            $port = EnvLoader::get('DB_PORT', '1003');
            $dbname = EnvLoader::get('DB_NAME', 'misvord');
            $username = EnvLoader::get('DB_USER', 'root');
            $password = EnvLoader::get('DB_PASS', 'kolin123');
            $charset = EnvLoader::get('DB_CHARSET', 'utf8mb4');

            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES $charset"
            ];

            $this->pdo = new PDO($dsn, $username, $password, $options);

        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    public function testConnection() {
        try {
            $this->pdo->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            error_log("Database test failed: " . $e->getMessage());
            return false;
        }
    }
}