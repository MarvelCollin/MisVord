<?php

require_once __DIR__ . '/../controllers/BaseController.php';

class MessageFlowTestController extends BaseController
{
    public function testFlow()
    {
        header('Content-Type: application/json');
        
        try {
            $input = $this->getInput();
            
            $targetId = $input['target_id'] ?? '1';
            $content = $input['content'] ?? 'Test message from flow test endpoint';
            $chatType = $input['chat_type'] ?? 'channel';
            
            $testData = [
                'target_type' => $chatType === 'direct' ? 'dm' : $chatType,
                'target_id' => $targetId,
                'content' => $content
            ];
            
            echo json_encode([
                'success' => true,
                'message' => 'New simplified flow test',
                'test_data' => $testData,
                'flow_description' => [
                    '1. Frontend sends message to /api/chat/send',
                    '2. Backend saves to database and returns success',
                    '3. Frontend directly emits to socket server on success',
                    '4. Socket server broadcasts to other clients',
                    '5. No PHP WebSocket bridge needed'
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage()
            ]);
        }
    }
}

$controller = new MessageFlowTestController();

$path = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' || $method === 'POST') {
    $controller->testFlow();
} else {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'Method not found']);
} 