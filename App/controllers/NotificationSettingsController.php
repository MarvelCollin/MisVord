<?php

require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/query.php';

class NotificationSettingsController {

    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    public function updateServerNotificationSettings() {
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
        
        // Check if user is a member of this server
        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
        if (!$membership) {
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        // Get notification settings
        $allMessages = isset($data['all_messages']) ? (bool)$data['all_messages'] : false;
        $mentionsOnly = isset($data['mentions_only']) ? (bool)$data['mentions_only'] : true;
        $muted = isset($data['muted']) ? (bool)$data['muted'] : false;
        $suppressEveryone = isset($data['suppress_everyone']) ? (bool)$data['suppress_everyone'] : false;
        $suppressRoles = isset($data['suppress_roles']) ? (bool)$data['suppress_roles'] : false;
        
        $notificationSettings = [
            'all_messages' => $allMessages,
            'mentions_only' => $mentionsOnly,
            'muted' => $muted,
            'suppress_everyone' => $suppressEveryone,
            'suppress_roles' => $suppressRoles
        ];
        
        // Update the notification_settings in the membership record
        $query = new Query();
        
        // First, check if the notification_settings column exists
        try {
            $hasColumn = $query->columnExists('user_server_memberships', 'notification_settings');
            
            if (!$hasColumn) {
                // Add the column if it doesn't exist
                $query->raw("ALTER TABLE user_server_memberships ADD notification_settings TEXT NULL");
            }
            
            $result = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->update(['notification_settings' => json_encode($notificationSettings)]);
            
            if ($result) {
                $this->jsonResponse([
                    'success' => true, 
                    'message' => 'Notification settings updated successfully',
                    'notification_settings' => $notificationSettings
                ]);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to update notification settings'], 500);
            }
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'message' => 'Error updating notification settings: ' . $e->getMessage()], 500);
        }
    }
    
    public function getServerNotificationSettings($serverId) {
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
        
        try {
            $query = new Query();
            $hasColumn = $query->columnExists('user_server_memberships', 'notification_settings');
            
            if (!$hasColumn) {
                // Return default settings if column doesn't exist
                $defaultSettings = [
                    'all_messages' => false,
                    'mentions_only' => true,
                    'muted' => false,
                    'suppress_everyone' => false,
                    'suppress_roles' => false
                ];
                
                $this->jsonResponse([
                    'success' => true, 
                    'notification_settings' => $defaultSettings
                ]);
                return;
            }
            
            $result = $query->table('user_server_memberships')
                ->select('notification_settings')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->first();
                
            if ($result && !empty($result['notification_settings'])) {
                $settings = json_decode($result['notification_settings'], true);
                $this->jsonResponse([
                    'success' => true, 
                    'notification_settings' => $settings
                ]);
            } else {
                // Return default settings if no settings are saved
                $defaultSettings = [
                    'all_messages' => false,
                    'mentions_only' => true,
                    'muted' => false,
                    'suppress_everyone' => false,
                    'suppress_roles' => false
                ];
                
                $this->jsonResponse([
                    'success' => true, 
                    'notification_settings' => $defaultSettings
                ]);
            }
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'message' => 'Error retrieving notification settings: ' . $e->getMessage()], 500);
        }
    }
    
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
} 