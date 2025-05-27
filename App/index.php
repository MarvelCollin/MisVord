<?php
/**
 * Main Application Entry Point
 *
 * This file redirects all requests to the public/index.php file
 * which is the proper entry point for the application when using Apache.
 */

header("Permissions-Policy: autoplay=*");

if (php_sapi_name() !== 'cli-server' && 
    !isset($_SERVER['DOCUMENT_ROOT']) && 
    !preg_match('/\/public\/index.php$/', $_SERVER['SCRIPT_FILENAME'])) {

    error_log("Main index.php accessed directly - redirecting to public/index.php");

    define('APP_ROOT', __DIR__);

    require_once __DIR__ . '/public/index.php';
} else {

    define('APP_ROOT', __DIR__);

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    require_once __DIR__ . '/router.php';
}