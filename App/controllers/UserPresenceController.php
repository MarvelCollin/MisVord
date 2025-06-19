<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';
require_once __DIR__ . '/SocketController.php';

class UserPresenceController extends BaseController {
    private $userRepository;
    private $socketController;
    
    public function __construct() {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->socketController = new SocketController();
    }
    
    public function updateStatus() {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $this->validate($input, [
                'status' => 'required'
            ]);
            
            $status = $input['status'];
            
            if (!in_array($status, ['online', 'away', 'dnd', 'offline'])) {
                return $this->error('Invalid status. Must be one of: online, away, dnd, offline', 400);
            }
            
            $activityDetails = isset($input['activity_details']) ? $input['activity_details'] : null;
            
            $user = $this->userRepository->find($userId);
            
            $result = $this->socketController->emitCustomEvent('update-presence', [
                'userId' => $userId,
                'username' => $user->username,
                'status' => $status,
                'activityDetails' => $activityDetails
            ]);
            
            $this->logActivity('status_updated', [
                'status' => $status,
                'activity_details' => $activityDetails,
                'username' => $user->username,
                'socket_result' => $result
            ]);
            
            return $this->success([
                'status' => $status,
                'activity_details' => $activityDetails
            ], 'Status updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating status: ' . $e->getMessage());
        }
    }
    
    public function getStatus($userId = null) {
        $this->requireAuth();
        
        $currentUserId = $this->getCurrentUserId();
        $targetUserId = $userId ?? $currentUserId;
        
        try {
            $presence = $this->socketController->getUserPresence($targetUserId);
            
            if (!$presence || !isset($presence['status'])) {
                return $this->success([
                    'status' => 'offline', 
                    'activity_details' => null, 
                    'last_seen' => null
                ], 'User is offline');
            }
            
            $result = [
                'status' => $presence['status'],
                'activity_details' => $presence['activity'] ?? null,
                'last_seen' => $presence['lastSeen'] ?? null
            ];
            
            if ($targetUserId != $currentUserId) {
                $this->logActivity('viewed_user_status', [
                    'target_user_id' => $targetUserId
                ]);
            }
            
            return $this->success($result, 'Status retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving status: ' . $e->getMessage());
        }
    }
    
    public function getOnlineUsers() {
        $this->requireAuth();
        
        try {
            $onlineUsers = $this->socketController->getOnlineUsers();
            
            $this->logActivity('viewed_online_users');
            
            return $this->success($onlineUsers, 'Online users retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving online users: ' . $e->getMessage());
        }
    }
    
    public function setActivity() {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $this->validate($input, [
                'activity_details' => 'required'
            ]);
            
            $activityDetails = $input['activity_details'];
            
            $user = $this->userRepository->find($userId);
            
            $result = $this->socketController->emitCustomEvent('update-activity', [
                'userId' => $userId,
                'username' => $user->username,
                'activityDetails' => $activityDetails
            ]);
            
            $this->logActivity('activity_updated', [
                'activity_details' => $activityDetails,
                'socket_result' => $result
            ]);
            
            return $this->success([
                'activity_details' => $activityDetails
            ], 'Activity updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating activity: ' . $e->getMessage());
        }
    }
    
    public function clearActivity() {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $user = $this->userRepository->find($userId);
            
            $result = $this->socketController->emitCustomEvent('update-activity', [
                'userId' => $userId,
                'username' => $user->username,
                'activityDetails' => null
            ]);
            
            $this->logActivity('activity_cleared', [
                'socket_result' => $result
            ]);
            
            return $this->success(null, 'Activity cleared successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while clearing activity: ' . $e->getMessage());
        }
    }
    
    public function goOffline() {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $user = $this->userRepository->find($userId);
            
            $result = $this->socketController->emitCustomEvent('update-presence', [
                'userId' => $userId,
                'username' => $user->username,
                'status' => 'offline'
            ]);
            
            $this->logActivity('went_offline', [
                'socket_result' => $result
            ]);
            
            return $this->success(null, 'User marked as offline successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while going offline: ' . $e->getMessage());
        }
    }
} 