<?php

function setupStorageDirectories() {
    $basePath = dirname(__DIR__);
    $publicStoragePath = $basePath . '/public/storage';
    
    if (!is_dir($publicStoragePath)) {
        if (!mkdir($publicStoragePath, 0777, true)) {
            error_log("Failed to create public storage directory");
            return false;
        }
        chmod($publicStoragePath, 0777);
    }
    
    if (!is_writable($publicStoragePath)) {
        chmod($publicStoragePath, 0777);
    }
    
    return true;
}

setupStorageDirectories(); 