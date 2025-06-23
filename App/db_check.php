<?php

define('APP_ROOT', __DIR__);
require_once 'config/db.php';

echo "Checking database connection...\n";
try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection successful.\n";
    
    echo "Checking users table...\n";
    $stmt = $db->prepare("SELECT id, username, discriminator, avatar_url, status FROM users LIMIT 5");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "No users found in the database.\n";
    } else {
        echo "Found " . count($users) . " users:\n";
        foreach ($users as $user) {
            echo "ID: " . $user['id'] . ", Username: " . $user['username'] . ", Discriminator: " . $user['discriminator'] . "\n";
        }
    }
    
    echo "\nChecking friend_list table...\n";
    $stmt = $db->prepare("SELECT * FROM friend_list LIMIT 5");
    $stmt->execute();
    $friendships = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($friendships)) {
        echo "No friendships found in the database.\n";
    } else {
        echo "Found " . count($friendships) . " friendships:\n";
        foreach ($friendships as $friendship) {
            echo "ID: " . $friendship['id'] . ", User1: " . $friendship['user_id'] . ", User2: " . $friendship['user_id2'] . ", Status: " . $friendship['status'] . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} 