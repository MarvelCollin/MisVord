<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../controllers/MediaController.php';
require_once __DIR__ . '/../../controllers/ChatController.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'test_user';
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'upload';
    
    switch ($action) {
        case 'upload':
            $mediaController = new MediaController();
            $result = $mediaController->uploadMedia();
            echo json_encode($result);
            break;
            
        case 'upload_multiple':
            $mediaController = new MediaController();
            $result = $mediaController->uploadMultipleMedia();
            echo json_encode($result);
            break;
            
        case 'send_message':
            $chatController = new ChatController();
            $_POST['target_type'] = 'channel';
            $_POST['target_id'] = 1;
            $_POST['content'] = 'Test message with attachments';
            $_POST['attachments'] = json_decode($_POST['attachments'] ?? '[]', true);
            $result = $chatController->sendMessage();
            echo json_encode($result);
            break;
    }
} else {
    echo json_encode([
        'success' => true,
        'message' => 'File upload test endpoint ready',
        'endpoints' => [
            'POST /api/test-file-upload.php?action=upload' => 'Test single file upload',
            'POST /api/test-file-upload.php?action=upload_multiple' => 'Test multiple file upload',
            'POST /api/test-file-upload.php?action=send_message' => 'Test message with attachments'
        ],
        'test_info' => [
            'session_user_id' => $_SESSION['user_id'],
            'session_username' => $_SESSION['username']
        ]
    ]);
}
?> 