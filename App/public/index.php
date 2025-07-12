<?php

define('APP_ROOT', '/var/www/html');


require_once APP_ROOT . '/config/session.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


require_once APP_ROOT . '/bootstrap/storage-setup.php';

if ($_SERVER['REQUEST_URI'] === '/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'OK',
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => 'misvord-app'
    ]);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/router.php';