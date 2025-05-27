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

    // Add test users
    echo "Adding test users...\n";
    
    // Check if user with email aldric@example.com already exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['aldric@example.com']);
    $user = $stmt->fetch();
    
    if (!$user) {
        $stmt = $pdo->prepare("
            INSERT INTO users (username, email, password, status)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute(['aldric', 'aldric@example.com', password_hash('password', PASSWORD_DEFAULT), 'online']);
        echo "Added user: aldric\n";
    } else {
        echo "User aldric already exists\n";
    }
    
    // Check if user with email faust@example.com already exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['faust@example.com']);
    $user = $stmt->fetch();
    
    if (!$user) {
        $stmt = $pdo->prepare("
            INSERT INTO users (username, email, password, status)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute(['faust', 'faust@example.com', password_hash('password', PASSWORD_DEFAULT), 'online']);
        echo "Added user: faust\n";
    } else {
        echo "User faust already exists\n";
    }
    
    // Check if user with email chann@example.com already exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['chann@example.com']);
    $user = $stmt->fetch();
    
    if (!$user) {
        $stmt = $pdo->prepare("
            INSERT INTO users (username, email, password, status)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute(['chann', 'chann@example.com', password_hash('password', PASSWORD_DEFAULT), 'offline']);
        echo "Added user: chann\n";
    } else {
        echo "User chann already exists\n";
    }
    
    // Add friendships
    echo "\nAdding friendships...\n";
    
    // Get user IDs
    $stmt = $pdo->query("SELECT id, username FROM users WHERE username IN ('koline', 'aldric', 'faust', 'chann')");
    $users = [];
    while ($row = $stmt->fetch()) {
        $users[$row['username']] = $row['id'];
    }
    
    if (isset($users['koline']) && isset($users['aldric'])) {
        // Check if friendship already exists
        $stmt = $pdo->prepare("
            SELECT * FROM friend_list 
            WHERE (user_id = ? AND user_id2 = ?) OR (user_id = ? AND user_id2 = ?)
        ");
        $stmt->execute([$users['koline'], $users['aldric'], $users['aldric'], $users['koline']]);
        $friendship = $stmt->fetch();
        
        if (!$friendship) {
            $stmt = $pdo->prepare("
                INSERT INTO friend_list (user_id, user_id2, status)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$users['koline'], $users['aldric'], 'accepted']);
            echo "Added friendship: koline - aldric\n";
        } else {
            echo "Friendship koline - aldric already exists\n";
        }
    }
    
    if (isset($users['koline']) && isset($users['faust'])) {
        // Check if friendship already exists
        $stmt = $pdo->prepare("
            SELECT * FROM friend_list 
            WHERE (user_id = ? AND user_id2 = ?) OR (user_id = ? AND user_id2 = ?)
        ");
        $stmt->execute([$users['koline'], $users['faust'], $users['faust'], $users['koline']]);
        $friendship = $stmt->fetch();
        
        if (!$friendship) {
            $stmt = $pdo->prepare("
                INSERT INTO friend_list (user_id, user_id2, status)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$users['koline'], $users['faust'], 'accepted']);
            echo "Added friendship: koline - faust\n";
        } else {
            echo "Friendship koline - faust already exists\n";
        }
    }
    
    if (isset($users['koline']) && isset($users['chann'])) {
        // Check if friendship already exists
        $stmt = $pdo->prepare("
            SELECT * FROM friend_list 
            WHERE (user_id = ? AND user_id2 = ?) OR (user_id = ? AND user_id2 = ?)
        ");
        $stmt->execute([$users['koline'], $users['chann'], $users['chann'], $users['koline']]);
        $friendship = $stmt->fetch();
        
        if (!$friendship) {
            $stmt = $pdo->prepare("
                INSERT INTO friend_list (user_id, user_id2, status)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$users['koline'], $users['chann'], 'accepted']);
            echo "Added friendship: koline - chann\n";
        } else {
            echo "Friendship koline - chann already exists\n";
        }
    }
    
    echo "\nList of users:\n";
    $stmt = $pdo->query("SELECT id, username, email, status FROM users");
    while ($row = $stmt->fetch()) {
        echo "ID: {$row['id']}, Username: {$row['username']}, Email: {$row['email']}, Status: {$row['status']}\n";
    }
    
    echo "\nList of friendships:\n";
    $stmt = $pdo->query("
        SELECT u1.username as user1, u2.username as user2, f.status
        FROM friend_list f
        JOIN users u1 ON f.user_id = u1.id
        JOIN users u2 ON f.user_id2 = u2.id
    ");
    $friendships = $stmt->fetchAll();
    if (empty($friendships)) {
        echo "No friendships found\n";
    } else {
        foreach ($friendships as $friendship) {
            echo "{$friendship['user1']} - {$friendship['user2']}: {$friendship['status']}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 