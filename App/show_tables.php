<?php

try {
    $host = 'localhost';
    $port = 1003;
    $dbname = 'misvord';
    $username = 'root';
    $password = 'password';
    $charset = 'utf8mb4';
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    echo "Connecting to database...\n";
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "Connected successfully.\n\n";
    
    // Show all tables
    echo "Tables in database:\n";
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "No tables found in the database.\n";
    } else {
        foreach ($tables as $table) {
            echo "- $table\n";
        }
    }
    
    // Check for users table
    if (!in_array('users', $tables)) {
        echo "\nCreating users table...\n";
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255),
                google_id VARCHAR(255) NULL,
                avatar_url VARCHAR(255) NULL,
                status ENUM('online', 'away', 'offline', 'dnd') DEFAULT 'offline',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        echo "Users table created successfully.\n";
        
        // Add a test user
        $pdo->exec("
            INSERT INTO users (username, email, password, status)
            VALUES ('koline', 'koline@gmail.com', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'online')
        ");
        echo "Test user added.\n";
    }
    
    // Check if friend_list table exists
    if (!in_array('friend_list', $tables)) {
        echo "\nCreating friend_list table...\n";
        
        // Create the friend_list table
        $pdo->exec("
            CREATE TABLE friend_list (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                user_id2 INT NOT NULL,
                status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_friendship (user_id, user_id2),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        
        echo "friend_list table created successfully.\n";
        
        // Create some sample friendships for testing
        echo "Adding sample friendship data...\n";
        
        // First check if we have at least one user
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        $userCount = $stmt->fetchColumn();
        
        if ($userCount < 2) {
            echo "Creating sample users...\n";
            
            // Create some sample users if we don't have at least 2
            $pdo->exec("
                INSERT INTO users (username, email, password, status)
                VALUES 
                ('aldric', 'aldric@example.com', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'online'),
                ('faust', 'faust@example.com', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'online'),
                ('chann', 'chann@example.com', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'offline')
            ");
            
            echo "Sample users created.\n";
        }
        
        // Add friendships
        $pdo->exec("
            INSERT INTO friend_list (user_id, user_id2, status)
            VALUES 
            (1, 2, 'accepted'),
            (1, 3, 'accepted')
        ");
        
        echo "Sample friendships added successfully.\n";
    } else {
        // Show friend_list structure
        echo "\nfriend_list table structure:\n";
        $stmt = $pdo->query("DESCRIBE friend_list");
        $columns = $stmt->fetchAll();
        foreach ($columns as $column) {
            echo "{$column['Field']}: {$column['Type']}\n";
        }
        
        // Show friendship data
        echo "\nFriendships in database:\n";
        $stmt = $pdo->query("
            SELECT f.id, u1.username as user1, u2.username as user2, f.status
            FROM friend_list f
            JOIN users u1 ON f.user_id = u1.id
            JOIN users u2 ON f.user_id2 = u2.id
        ");
        $friendships = $stmt->fetchAll();
        
        if (count($friendships) === 0) {
            echo "No friendships found.\n";
        } else {
            foreach ($friendships as $friendship) {
                echo "{$friendship['user1']} - {$friendship['user2']}: {$friendship['status']}\n";
            }
        }
    }
    
    // Show users
    echo "\nUsers in database:\n";
    $stmt = $pdo->query("SELECT id, username, email, status FROM users");
    $users = $stmt->fetchAll();
    if (count($users) === 0) {
        echo "No users found.\n";
    } else {
        foreach ($users as $user) {
            echo "ID: {$user['id']}, Username: {$user['username']}, Email: {$user['email']}, Status: {$user['status']}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 