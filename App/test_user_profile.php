<?php

require_once 'controllers/UserController.php';
require_once 'config/session.php';

session_start();
$_SESSION['user_id'] = 1;

$controller = new UserController();
$result = $controller->getUserProfile(2);

header('Content-Type: application/json');
echo json_encode($result, JSON_PRETTY_PRINT); 