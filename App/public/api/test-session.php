<?php

session_start();

// Set up the session for user ID 2 (kolina)
$_SESSION['user_id'] = 2;
$_SESSION['username'] = 'kolina';
$_SESSION['discriminator'] = '5811';

// Print the session data
echo "Session set up successfully:\n";
echo "User ID: " . $_SESSION['user_id'] . "\n";
echo "Username: " . $_SESSION['username'] . "\n";
echo "Discriminator: " . $_SESSION['discriminator'] . "\n";

echo "\nFull session data:\n";
print_r($_SESSION);

// Now make an API call to the server members endpoint directly
echo "\n\nTesting API call to /api/servers/1/members:\n";

// Include required files
require_once __DIR__ . '/../../controllers/ServerController.php';
require_once __DIR__ . '/../../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../../database/repositories/UserServerMembershipRepository.php';

// Create controller instance
$serverController = new ServerController();

// Call the method directly
echo "Calling getServerMembers(1):\n";
$serverController->getServerMembers(1); 