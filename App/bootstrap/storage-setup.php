<?php

function setupStorageDirectories() {
    $basePath = dirname(__DIR__);
    $storagePath = $basePath . '/storage';
    $publicStoragePath = $basePath . '/public/storage';
    
    // Ensure base storage directory exists
    if (!is_dir($storagePath)) {
        if (!mkdir($storagePath, 0755, true)) {
            error_log("Failed to create storage directory");
            return false;
        }
    }
    
    // Create necessary subdirectories
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
    
    // Create public storage directory if it doesn't exist
    if (!is_dir($publicStoragePath)) {
        if (!mkdir($publicStoragePath, 0755, true)) {
            error_log("Failed to create public storage directory");
            return false;
        }
    }
    
    // Create symbolic links for uploads subdirectories
    $uploadsPublicPath = $publicStoragePath . '/uploads';
    if (!is_dir($uploadsPublicPath)) {
        if (!mkdir($uploadsPublicPath, 0755, true)) {
            error_log("Failed to create public uploads directory");
        }
    }
    
    // Create subdirectories in the public storage path
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

// Run the setup
setupStorageDirectories(); 