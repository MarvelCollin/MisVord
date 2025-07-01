<?php
require_once __DIR__ . '/database/repositories/UserRepository.php';

try {
    $userRepo = new UserRepository();
    $users = $userRepo->getAll();
    
    echo "Available users in database:\n";
    foreach($users as $user) {
        if($user->status !== 'bot') {
            echo "- " . $user->username;
            if(isset($user->discriminator)) {
                echo "#" . $user->discriminator;
            }
            echo " (ID: " . $user->id . ")\n";
        }
    }
    
    echo "\nTotal non-bot users: " . count(array_filter($users, function($u) { return $u->status !== 'bot'; })) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 