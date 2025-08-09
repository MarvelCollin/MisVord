<?php

function setupStorageDirectories() {
    $basePath = dirname(__DIR__);
    $publicStoragePath = $basePath . '/public/storage';
    
    if (!is_dir($publicStoragePath)) {
        if (!mkdir($publicStoragePath, 0777, true)) {
            error_log("Failed to create public storage directory");
            return false;
        }
    }
    
    if (!is_writable($publicStoragePath)) {
        error_log("Public storage directory is not writable");
        return false;
    }
    
    return true;
}

setupStorageDirectories(); 