<?php

define('APP_ROOT', __DIR__);
require_once 'config/session.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 3; 
}

require_once 'controllers/UserController.php';
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : 3; 
$serverId = isset($_GET['server_id']) ? $_GET['server_id'] : null;

header('Content-Type: application/json');

try {
    $controller = new UserController();
    
    $result = $controller->getUserProfile($userId);
    
    if ($result !== null) {
        echo json_encode([
            'success' => true,
            'debug_info' => 'UserController::getUserProfile returned a value instead of sending a response directly',
            'profile_data' => $result
        ], JSON_PRETTY_PRINT);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 