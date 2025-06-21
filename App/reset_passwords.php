<?php
// Define APP_ROOT constant
define('APP_ROOT', __DIR__);

require_once 'database/repositories/UserRepository.php';

try {
    $userRepo = new UserRepository();
    
    echo "Resetting passwords for test users..." . PHP_EOL;
    
    // Reset password for kolin
    $kolinUpdated = $userRepo->updatePassword(1, 'password123');
    if ($kolinUpdated) {
        echo "✅ Password updated for user 'kolin' - new password: password123" . PHP_EOL;
    } else {
        echo "❌ Failed to update password for user 'kolin'" . PHP_EOL;
    }
    
    // Reset password for kolina  
    $kolinaUpdated = $userRepo->updatePassword(2, 'password123');
    if ($kolinaUpdated) {
        echo "✅ Password updated for user 'kolina' - new password: password123" . PHP_EOL;
    } else {
        echo "❌ Failed to update password for user 'kolina'" . PHP_EOL;
    }
    
    echo PHP_EOL . "You can now login with:" . PHP_EOL;
    echo "Email: kolin@gmail.com, Password: password123" . PHP_EOL;
    echo "Email: kolina@gmail.com, Password: password123" . PHP_EOL;
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
    echo "Stack trace: " . $e->getTraceAsString() . PHP_EOL;
}
?>
