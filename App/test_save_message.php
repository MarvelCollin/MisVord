<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/app.php';

header('Content-Type: application/json');

// Test the save-message functionality directly
try {
    require_once __DIR__ . '/controllers/ChatController.php';
    
    // Simulate the socket headers
    $_SERVER['HTTP_X_SOCKET_USER_ID'] = '1';
    $_SERVER['HTTP_X_SOCKET_USERNAME'] = 'debuguser';
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['CONTENT_TYPE'] = 'application/json';
    
    // Simulate the POST data
    $input_data = [
        'content' => 'Test message from debug script',
        'target_type' => 'channel', 
        'target_id' => '1',
        'message_type' => 'text',
        'temp_message_id' => 'temp-debug-' . time()
    ];
    
    // Override the input stream
    file_put_contents('php://memory', json_encode($input_data));
    
    $controller = new ChatController();
    
    // Mock the getInput method by setting $_POST
    $_POST = $input_data;
    
    echo "=== Testing saveMessageFromSocket ===\n";
    echo "Input data: " . json_encode($input_data, JSON_PRETTY_PRINT) . "\n\n";
    
    $result = $controller->saveMessageFromSocket();
    
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
