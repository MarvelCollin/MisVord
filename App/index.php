<?php
define('APP_ROOT', __DIR__);

if (php_sapi_name() !== 'cli-server' && 
    !isset($_SERVER['DOCUMENT_ROOT']) && 
    !preg_match('/\/public\/index.php$/', $_SERVER['SCRIPT_FILENAME'])) {
    
    require_once __DIR__ . '/public/index.php';
} else {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    require_once __DIR__ . '/config/app.php';  
    require_once __DIR__ . '/router.php';
}