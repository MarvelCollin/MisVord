<?php

function setupStorageDirectories() {
    $basePath = dirname(__DIR__);
    $storagePath = $basePath . '/storage';
    $publicStoragePath = $basePath . '/public/storage';
    
    if (!is_dir($storagePath)) {
        if (!mkdir($storagePath, 0755, true)) {
            error_log("Failed to create storage directory");
            return false;
        }
    }
    
    $directories = [
        $storagePath . '/uploads',
        $storagePath . '/uploads/servers',
        $storagePath . '/uploads/banners',
        $storagePath . '/uploads/avatars',
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                error_log("Failed to create directory: $dir");
                continue;
            }
        }
    }
    
    if (!is_dir($publicStoragePath)) {
        if (!mkdir($publicStoragePath, 0755, true)) {
            error_log("Failed to create public storage directory");
            return false;
        }
    }
    
    $uploadsPublicPath = $publicStoragePath . '/uploads';
    if (!is_dir($uploadsPublicPath)) {
        if (!mkdir($uploadsPublicPath, 0755, true)) {
            error_log("Failed to create public uploads directory");
        }
    }
    
    $publicDirs = [
        $uploadsPublicPath . '/servers',
        $uploadsPublicPath . '/banners',
        $uploadsPublicPath . '/avatars',
    ];
    
    foreach ($publicDirs as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                error_log("Failed to create directory: $dir");
            }
        }
    }
    
    return true;
}

setupStorageDirectories(); 