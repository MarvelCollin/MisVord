<?php

echo "Simple Environment Test\n";
echo "=====================\n";

// Test basic include
try {
    require_once __DIR__ . '/config/env.php';
    echo "✓ env.php loaded\n";
    
    echo "DB_HOST: " . EnvLoader::get('DB_HOST') . "\n";
    echo "DB_PORT: " . EnvLoader::get('DB_PORT') . "\n";
    echo "DB_NAME: " . EnvLoader::get('DB_NAME') . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "Done.\n";
