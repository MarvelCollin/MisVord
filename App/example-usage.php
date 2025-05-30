<?php
require_once __DIR__ . '/database/models/User.php';
require_once __DIR__ . '/database/models/Server.php';

// Find user by email
$user = User::findByEmail('user@example.com');

// Create new user
$newUser = new User();
$newUser->username = 'newuser';
$newUser->email = 'new@example.com';
$newUser->setPassword('password123');
$newUser->save();

// Get user's servers
$userServers = $user->servers();

// Get user's friends
$friends = $user->friends();
