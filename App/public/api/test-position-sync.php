<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required'
    ]);
    exit;
}

require_once __DIR__ . '/../../database/query.php';
require_once __DIR__ . '/../../controllers/ChannelController.php';

try {
    $serverId = $_GET['server_id'] ?? null;
    
    if (!$serverId) {
        echo json_encode([
            'success' => false,
            'error' => 'Server ID required'
        ]);
        exit;
    }
    
    $controller = new ChannelController();
    $_POST['server_id'] = $serverId;
    
    ob_start();
    $result = $controller->syncServerPositions();
    $output = ob_get_clean();
    
    if (empty($output)) {
        echo json_encode([
            'success' => true,
            'message' => 'Position sync completed successfully',
            'server_id' => $serverId,
            'test_mode' => true
        ]);
    } else {
        echo $output;
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?> 