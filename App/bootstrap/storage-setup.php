<?php

function setupStorageDirectories() {
    $basePath = dirname(__DIR__);
    $publicStoragePath = $basePath . '/public/storage';
    
    if (!is_dir($publicStoragePath)) {
        if (!mkdir($publicStoragePath, 0755, true)) {
            error_log("Failed to create public storage directory");
            return false;
        }
    }
    
    return true;
}

setupStorageDirectories(); 