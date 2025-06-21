<?php
// Define APP_ROOT constant
define('APP_ROOT', __DIR__);

require_once 'database/repositories/UserRepository.php';

try {
    $userRepo = new UserRepository();
    
    // Find specific users by ID
    echo "Checking users by ID..." . PHP_EOL;
    
    for ($i = 1; $i <= 5; $i++) {
        $user = $userRepo->find($i);
        if ($user) {
            echo "User ID $i:" . PHP_EOL;
            echo "  Email: " . ($user->email ?? 'N/A') . PHP_EOL;
            echo "  Username: " . ($user->username ?? 'N/A') . PHP_EOL;
            echo "  Display Name: " . ($user->display_name ?? 'N/A') . PHP_EOL;
            echo "  Created: " . ($user->created_at ?? 'N/A') . PHP_EOL;
            echo "---" . PHP_EOL;
        }
    }
    
    // Check if we can find the first user by username
    $kolin = $userRepo->findByUsername('kolin');
    if ($kolin) {
        echo "Found user 'kolin' with email: " . $kolin->email . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
    echo "Stack trace: " . $e->getTraceAsString() . PHP_EOL;
}
?>
