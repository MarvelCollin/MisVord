<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AdminController.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'Admin';
$_SESSION['discriminator'] = '0000';

try {
    $_GET['q'] = 'kol';
    $_GET['limit'] = '10';
    
    $controller = new AdminController();
    $response = $controller->searchUsers();
    
    echo json_encode([
        'success' => true,
        'test_name' => 'Admin Search Users Test',
        'search_query' => 'kol',
        'response' => $response,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
} 