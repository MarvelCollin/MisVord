<?php

session_start();


$_SESSION['user_id'] = 2;
$_SESSION['username'] = 'kolina';
$_SESSION['discriminator'] = '5811';


echo "Session set up successfully:\n";
echo "User ID: " . $_SESSION['user_id'] . "\n";
echo "Username: " . $_SESSION['username'] . "\n";
echo "Discriminator: " . $_SESSION['discriminator'] . "\n";

echo "\nFull session data:\n";
print_r($_SESSION);


echo "\n\nTesting API call to /api/servers/1/members:\n";


require_once __DIR__ . '/../../controllers/ServerController.php';
require_once __DIR__ . '/../../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../../database/repositories/UserServerMembershipRepository.php';


$serverController = new ServerController();


echo "Calling getServerMembers(1):\n";
$serverController->getServerMembers(1); 