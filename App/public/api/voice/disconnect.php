<?php
/**
 * Voice Disconnect API Endpoint
 * Handles cleanup when users reload/leave pages
 */

require_once '../../../bootstrap/storage-setup.php';

// 
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // 
    $channel_id = $_POST['channel_id'] ?? null;
    $meeting_id = $_POST['meeting_id'] ?? null;
    $user_id = $_POST['user_id'] ?? null;
    
    // 
    error_log("Voice Disconnect API: Channel=$channel_id, Meeting=$meeting_id, User=$user_id");
    
    if (!$channel_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing channel_id']);
        exit;
    }
    
    // 
    // 
    
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Disconnect request logged',
        'timestamp' => time()
    ]);
    
} catch (Exception $e) {
    error_log("Voice Disconnect API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
