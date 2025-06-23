<?php

define('APP_ROOT', dirname(dirname(__DIR__)));
require_once APP_ROOT . '/config/session.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1; // For testing purposes
}

require_once APP_ROOT . '/controllers/UserController.php';
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : 1;
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