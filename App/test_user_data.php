<?php

try {
    // Direct database connection with specific parameters
    $host = 'localhost';
    $port = 1003;
    $dbname = 'misvord';
    $username = 'root';
    $password = 'password';
    $charset = 'utf8mb4';

    echo "Trying to connect to MySQL with:\n";
    echo "Host: $host\n";
    echo "Port: $port\n";
    echo "Database: $dbname\n";
    echo "Username: $username\n\n";
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "✓ Successfully connected to database.\n\n";
    
    // List users
    echo "Fetching users:\n";
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll();
    
    echo "Found " . count($users) . " users:\n";
    foreach ($users as $user) {
        echo "ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}, Status: {$user['status']}\n";
    }
    
    // List friends for user 1
    echo "\nFetching friends for user ID 1:\n";
    $stmt = $pdo->query("
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id2 
        WHERE fl.user_id = 1 AND fl.status = 'accepted'
        UNION
        SELECT u.* FROM users u 
        JOIN friend_list fl ON u.id = fl.user_id 
        WHERE fl.user_id2 = 1 AND fl.status = 'accepted'
    ");
    $friends = $stmt->fetchAll();
    
    echo "Found " . count($friends) . " friends:\n";
    foreach ($friends as $friend) {
        echo "ID: {$friend['id']}, Username: {$friend['username']}, Status: {$friend['status']}\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Connection error: " . $e->getMessage() . "\n";
} 