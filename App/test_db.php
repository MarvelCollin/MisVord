<?php

// Test database configuration with environment loading
echo "Testing Database Configuration with Environment\n";
echo "============================================\n\n";

try {
    // Include required files
    require_once __DIR__ . '/config/env.php';
    require_once __DIR__ . '/config/db.php';

    echo "1. Environment Variables Status:\n";
    echo "   - DB_HOST: " . EnvLoader::get('DB_HOST', 'NOT SET') . "\n";
    echo "   - DB_PORT: " . EnvLoader::get('DB_PORT', 'NOT SET') . "\n";
    echo "   - DB_NAME: " . EnvLoader::get('DB_NAME', 'NOT SET') . "\n";
    echo "   - DB_USER: " . EnvLoader::get('DB_USER', 'NOT SET') . "\n";
    echo "   - DB_PASS: " . (EnvLoader::get('DB_PASS') ? '[SET]' : 'NOT SET') . "\n";
    echo "   - DB_CHARSET: " . EnvLoader::get('DB_CHARSET', 'NOT SET') . "\n\n";

    echo "2. Testing Database Connection:\n";
    
    try {
        $database = Database::getInstance();
        echo "   ✓ Database instance created successfully\n";
        
        $connection = $database->getConnection();
        echo "   ✓ Database connection obtained\n";
        
        if ($database->testConnection()) {
            echo "   ✓ Database connection test passed\n";
            
            // Try a simple query to verify everything works
            $stmt = $connection->query('SELECT VERSION() as version');
            $result = $stmt->fetch();
            echo "   ✓ MySQL Version: " . $result['version'] . "\n";
            
            // Test current database
            $stmt = $connection->query('SELECT DATABASE() as current_db');
            $result = $stmt->fetch();
            echo "   ✓ Current Database: " . ($result['current_db'] ?: '[No database selected]') . "\n";
            
        } else {
            echo "   ✗ Database connection test failed\n";
        }
    } catch (Exception $e) {
        echo "   ✗ Database Error: " . $e->getMessage() . "\n";
        
        // Try to give more specific error information
        if (strpos($e->getMessage(), 'Connection refused') !== false) {
            echo "   💡 Hint: MySQL server might not be running\n";
        } elseif (strpos($e->getMessage(), 'Access denied') !== false) {
            echo "   💡 Hint: Check username and password\n";
        } elseif (strpos($e->getMessage(), 'Unknown database') !== false) {
            echo "   💡 Hint: Database '" . EnvLoader::get('DB_NAME') . "' might not exist\n";
        }
    }

    echo "\n3. Testing with Query Class:\n";
    try {
        require_once __DIR__ . '/database/query.php';
        echo "   ✓ Query class loaded successfully\n";
        
        // This will test if Query can connect using our environment
        $query = new Query();
        echo "   ✓ Query instance created (database connected)\n";
    } catch (Exception $e) {
        echo "   ✗ Query class error: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
}

echo "\nTest completed!\n";
