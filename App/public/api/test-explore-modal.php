<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    echo json_encode([
        'success' => true,
        'message' => 'Explore modal test endpoint working',
        'session_info' => [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'] ?? 'Unknown'
        ],
        'endpoints' => [
            'explore_layout' => '/explore-servers/layout',
            'test_time' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 