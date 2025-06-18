<?php

// Fix the APP_ROOT path for Docker environment
if (getenv('IS_DOCKER') === 'true') {
    define('APP_ROOT', '/var/www/html');
} else {
    define('APP_ROOT', dirname(__DIR__));
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Simple health check endpoint
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