<?php

define('ROOT_PATH', dirname(__DIR__));

require_once ROOT_PATH . '/config/env.php';

try {

    $dbConfig = [
        'host' => EnvLoader::get('DB_HOST', 'db'),
        'port' => EnvLoader::get('DB_PORT', '1003'),
        'dbname' => EnvLoader::get('DB_NAME', 'misvord'),
        'username' => EnvLoader::get('DB_USER', 'root'),
        'password' => EnvLoader::get('DB_PASS', 'password'),
        'charset' => EnvLoader::get('DB_CHARSET', 'utf8mb4'),
    ];

    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";

    $pdoOptions = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $pdoOptions);

    $GLOBALS['db'] = $pdo;

    require_once ROOT_PATH . '/database/query.php';
    $GLOBALS['query'] = new Query($pdo);

} catch (PDOException $e) {

    if ($e->getCode() == 1049) { 

        require_once ROOT_PATH . '/init-db.php';

        try {
            $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $pdoOptions);
            $GLOBALS['db'] = $pdo;
            $GLOBALS['query'] = new Query($pdo);
        } catch (PDOException $e) {
            error_log("Failed to connect to database after initialization: " . $e->getMessage());

        }
    } else {
        error_log("Database connection error: " . $e->getMessage());

    }
}

require_once ROOT_PATH . '/config/routes.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

return [
    'ready' => true
];