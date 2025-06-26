<?php
// Test script to check admin users data flow
session_start();

// Set up basic admin session for testing
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'admin';
$_SESSION['role'] = 'admin';

echo "=== TESTING ADMIN USERS DATA FLOW ===\n\n";

// 1. Test direct database query
echo "1. TESTING DIRECT DATABASE QUERY:\n";
try {
    require_once 'database/query.php';
    $query = new Query();
    $users = $query->table('users')->where('status', '!=', 'bot')->limit(3)->get();
    echo "Direct DB Query Result:\n";
    echo json_encode($users, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n\n";
}

// 2. Test UserRepository
echo "2. TESTING USER REPOSITORY:\n";
try {
    require_once 'database/repositories/UserRepository.php';
    $userRepo = new UserRepository();
    $users = $userRepo->paginate(1, 3);
    echo "UserRepository Result:\n";
    $userArray = [];
    foreach ($users as $user) {
        $userArray[] = $user->toArray();
    }
    echo json_encode($userArray, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "UserRepository error: " . $e->getMessage() . "\n\n";
}

// 3. Test AdminController
echo "3. TESTING ADMIN CONTROLLER:\n";
try {
    require_once 'controllers/AdminController.php';
    $_GET['page'] = 1;
    $_GET['limit'] = 3;
    
    $adminController = new AdminController();
    $result = $adminController->getUsers();
    echo "AdminController Result:\n";
    echo json_encode($result, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "AdminController error: " . $e->getMessage() . "\n\n";
}

// 4. Test User Model structure
echo "4. TESTING USER MODEL STRUCTURE:\n";
try {
    require_once 'database/models/User.php';
    $query = new Query();
    $userData = $query->table('users')->where('status', '!=', 'bot')->first();
    
    if ($userData) {
        $user = new User($userData);
        echo "User Model Instance:\n";
        echo json_encode($user->toArray(), JSON_PRETTY_PRINT) . "\n\n";
        
        echo "User properties check:\n";
        echo "- ID: " . ($user->id ?? 'NULL') . "\n";
        echo "- Username: " . ($user->username ?? 'NULL') . "\n";
        echo "- Email: " . ($user->email ?? 'NULL') . "\n";
        echo "- Display Name: " . ($user->display_name ?? 'NULL') . "\n";
        echo "- Discriminator: " . ($user->discriminator ?? 'NULL') . "\n";
        echo "- Status: " . ($user->status ?? 'NULL') . "\n";
        echo "- Created At: " . ($user->created_at ?? 'NULL') . "\n\n";
    } else {
        echo "No user data found in database\n\n";
    }
} catch (Exception $e) {
    echo "User Model error: " . $e->getMessage() . "\n\n";
}

echo "=== TEST COMPLETE ===\n";
?> 