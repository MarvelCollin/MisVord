<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load environment variables first
require_once __DIR__ . '/config/env.php';
$envVars = EnvLoader::getEnv();

require_once __DIR__ . '/config/videosdk.php';

try {
    VideoSDKConfig::init();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'create_meeting':
                $meetingId = VideoSDKConfig::generateMeetingId();
                if ($meetingId) {
                    echo json_encode([
                        'success' => true,
                        'meetingId' => $meetingId,
                        'token' => VideoSDKConfig::generateToken()
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Failed to create meeting'
                    ]);
                }
                break;
                
            case 'get_token':
                $token = VideoSDKConfig::generateToken();
                echo json_encode([
                    'success' => true,
                    'token' => $token
                ]);
                break;
                
            default:
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid action'
                ]);
        }
    } else {
        // GET request - return configuration
        echo json_encode([
            'success' => true,
            'config' => VideoSDKConfig::getFrontendConfig()
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
