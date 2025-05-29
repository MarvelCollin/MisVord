<?php

if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js|ico|woff|woff2|svg|ttf)$/', $_SERVER["REQUEST_URI"])) {
    $basePath = __DIR__ . '/public';
    $file = $basePath . $_SERVER["REQUEST_URI"];

    if (file_exists($file)) {
        return false; 
    }
}

define('APP_ROOT', __DIR__);

error_log("[DEV SERVER] " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);

chdir(__DIR__ . '/public');

require_once 'index.php';