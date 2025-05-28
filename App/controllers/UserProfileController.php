<?php

require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/query.php';

class UserProfileController {

    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    public function updatePerServerProfile() {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['server_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid request'], 400);
            return;
        }

        $serverId = $data['server_id'];
        $userId = $_SESSION['user_id'];
        $nickname = trim($data['nickname'] ?? '');
        
        // Check if user is a member of this server
        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
        if (!$membership) {
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        // Update the nickname in the membership record
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->update(['nickname' => $nickname]);
        
        if ($result) {
            $this->jsonResponse([
                'success' => true, 
                'message' => 'Server profile updated successfully',
                'nickname' => $nickname
            ]);
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to update server profile'], 500);
        }
    }
    
    public function getPerServerProfile($serverId) {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        $userId = $_SESSION['user_id'];
        
        // Check if user is a member of this server
        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
        if (!$membership) {
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        $this->jsonResponse([
            'success' => true, 
            'profile' => [
                'nickname' => $membership->nickname,
                'role' => $membership->role
            ]
        ]);
    }
    
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
} 