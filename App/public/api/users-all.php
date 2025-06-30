<?php
session_start();

require_once dirname(dirname(__DIR__)) . '/config/app.php';
require_once dirname(dirname(__DIR__)) . '/controllers/UserController.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    error_log("Direct API call to users-all.php");
    error_log("Session data: " . json_encode($_SESSION));
    
    if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
        error_log("No authentication found");
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication required',
            'message' => 'You must be logged in to access this endpoint'
        ]);
        exit;
    }
    
    $controller = new UserController();
    
    ob_start();
    $result = $controller->getAllUsers();
    $output = ob_get_clean();
    
    if ($output) {
        echo $output;
    } else {
        if (is_array($result) || is_object($result)) {
            echo json_encode($result);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Invalid controller response'
            ]);
        }
    }
    
} catch (Exception $e) {
    error_log("Error in users-all.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
?> 