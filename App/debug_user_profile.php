<?php

define('APP_ROOT', __DIR__);
require_once 'config/session.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 3; // Set to a valid user ID from the database
}

require_once 'controllers/UserController.php';
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : 3; // Default to user ID 3
$serverId = isset($_GET['server_id']) ? $_GET['server_id'] : null;

header('Content-Type: application/json');

try {
    $controller = new UserController();
    
    // We'll call the method directly to avoid routing issues
    $result = $controller->getUserProfile($userId);
    
    // The method likely already sent the response, but just in case
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