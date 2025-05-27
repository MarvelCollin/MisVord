<?php

define('APP_ROOT', dirname(__DIR__));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

error_log("Request: " . $_SERVER['REQUEST_URI']);
error_log("APP_ROOT: " . APP_ROOT);

require_once __DIR__ . '/router.php';