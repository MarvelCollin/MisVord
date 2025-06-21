<?php

require_once __DIR__ . '/../../controllers/BaseController.php';
require_once __DIR__ . '/../../utils/WebSocketClient.php';

class DebugController extends BaseController
{
    public function testMessage()
    {
        header('Content-Type: application/json');
        
        try {
            $input = $this->getInput();
            
            $content = $input['content'] ?? 'Test message from debug endpoint';
            $targetType = $input['target_type'] ?? 'channel';
            $targetId = $input['target_id'] ?? '1';
            
            // Test WebSocket notification
            $wsClient = new WebSocketClient();
              if ($targetType === 'channel') {
                $result = $wsClient->broadcast('channel-message', [
                    'channelId' => $targetId,
                    'content' => $content,
                    'messageType' => 'text',
                    'timestamp' => time(),
                    'source' => 'debug-endpoint'
                ]);
            } else {
                $result = $wsClient->broadcast('direct-message', [
                    'roomId' => $targetId,
                    'content' => $content,
                    'messageType' => 'text',
                    'timestamp' => time(),
                    'message' => [
                        'id' => rand(1000, 9999),
                        'content' => $content,
                        'user_id' => 1,
                        'created_at' => date('Y-m-d H:i:s')
                    ],
                    'user_id' => 1,
                    'username' => 'DebugUser',
                    'chatRoomId' => $targetId,
                    'source' => 'debug-endpoint'
                ]);
            }
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'WebSocket notification sent successfully',
                    'data' => [
                        'content' => $content,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'websocket_result' => $result
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'WebSocket notification failed',
                    'data' => [
                        'content' => $content,
                        'target_type' => $targetType,
                        'target_id' => $targetId
                    ]
                ]);
            }
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Debug test failed: ' . $e->getMessage()
            ]);
        }
    }
    
    public function socketHealth()
    {
        header('Content-Type: application/json');
        
        try {
            $wsClient = new WebSocketClient();
            
            // Test if socket server is accessible
            $healthUrl = "http://localhost:1002/health";
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 5
                ]
            ]);
            
            $result = @file_get_contents($healthUrl, false, $context);
            
            if ($result) {
                $healthData = json_decode($result, true);
                echo json_encode([
                    'success' => true,
                    'message' => 'Socket server is healthy',
                    'health_data' => $healthData
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Socket server is not accessible'
                ]);
            }
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Health check failed: ' . $e->getMessage()
            ]);
        }
    }
}

// Handle the request
$controller = new DebugController();

$path = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && strpos($path, '/test-message') !== false) {
    $controller->testMessage();
} elseif ($method === 'GET' && strpos($path, '/socket-health') !== false) {
    $controller->socketHealth();
} else {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'Endpoint not found']);
}
