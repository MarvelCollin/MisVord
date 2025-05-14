<?php
define('APP_ROOT', __DIR__);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config/web.php';
