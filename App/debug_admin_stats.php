<?php
define('APP_ROOT', __DIR__);
require_once 'config/db.php';
require_once 'database/repositories/UserRepository.php';
require_once 'database/repositories/ServerRepository.php';
require_once 'database/repositories/MessageRepository.php';

echo "Debugging Admin Stats\n";
echo "=====================\n\n";

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection successful.\n\n";
    
    echo "User Repository Tests:\n";
    echo "--------------------\n";
    $userRepo = new UserRepository();
    echo "Total Users: " . $userRepo->count() . "\n";
    echo "Online Users: " . $userRepo->countByStatus('online') . "\n";
    echo "Recent Users (7 days): " . $userRepo->countRecentUsers(7) . "\n";
    
    echo "\nServer Repository Tests:\n";
    echo "----------------------\n";
    $serverRepo = new ServerRepository();
    echo "Total Servers: " . $serverRepo->count() . "\n";
    
    echo "\nMessage Repository Tests:\n";
    echo "-----------------------\n";
    $messageRepo = new MessageRepository();
    echo "Total Messages: " . $messageRepo->count() . "\n";
    echo "Today's Messages: " . $messageRepo->countToday() . "\n";
    
    echo "\nServer Stats Tests:\n";
    echo "-----------------\n";
    echo "Server Creation Stats (Daily):\n";
    print_r($serverRepo->getCreationStatsByDay(7));
    
    echo "\nServer Creation Stats (Weekly):\n";
    print_r($serverRepo->getCreationStatsByWeek(4));
    
    echo "\nUser Registration Stats (Daily):\n";
    print_r($userRepo->getRegistrationStatsByDay(7));
    
    echo "\nUser Registration Stats (Weekly):\n";
    print_r($userRepo->getRegistrationStatsByWeek(4));
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} 