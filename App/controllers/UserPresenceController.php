<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserPresenceRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';
require_once __DIR__ . '/SocketController.php';

class UserPresenceController extends BaseController {
    private $userPresenceRepository;
    private $userRepository;
    private $socketController;
    
    public function __construct() {
        parent::__construct();
        $this->userPresenceRepository = new UserPresenceRepository();
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
            
            $updated = $this->userPresenceRepository->updatePresence($userId, $status, $activityDetails);
            
            if (!$updated) {
                return $this->serverError('Failed to update status');
            }
            
            $user = $this->userRepository->find($userId);
            
            $this->socketController->updateUserStatus($userId, $status, $activityDetails);
            
            $this->logActivity('status_updated', [
                'status' => $status,
                'activity_details' => $activityDetails
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
            $presence = $this->userPresenceRepository->findByUserId($targetUserId);
            
            if (!$presence) {
                return $this->success([
                    'status' => 'offline', 
                    'activity_details' => null, 
                    'last_seen' => null
                ], 'User is offline');
            }
            
            $result = [
                'status' => $presence->status,
                'activity_details' => $presence->activity_details,
                'last_seen' => $presence->last_seen,
                'formatted_last_seen' => $presence->getFormattedLastSeen()
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
        
        $userId = $this->getCurrentUserId();
        
        try {
            $onlineUsers = $this->userPresenceRepository->getOnlineUsers();
            
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
            
            $updated = $this->userPresenceRepository->updateActivity($userId, $activityDetails);
            
            if (!$updated) {
                return $this->serverError('Failed to update activity');
            }
            
            $user = $this->userRepository->find($userId);
            $presence = $this->userPresenceRepository->findByUserId($userId);
            $status = $presence ? $presence->status : 'online';
            
            $this->socketController->broadcast('user-activity-changed', [
                'user_id' => $userId,
                'username' => $user->username,
                'status' => $status,
                'activity_details' => $activityDetails,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $this->logActivity('activity_updated', [
                'activity_details' => $activityDetails
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
            $presence = $this->userPresenceRepository->findByUserId($userId);
            
            if ($presence) {
                $updated = $this->userPresenceRepository->update($presence->id, [
                    'activity_details' => null,
                    'last_seen' => date('Y-m-d H:i:s')
                ]);
                
                if (!$updated) {
                    return $this->serverError('Failed to clear activity');
                }
                
                $user = $this->userRepository->find($userId);
                
                $this->socketController->broadcast('user-activity-changed', [
                    'user_id' => $userId,
                    'username' => $user->username,
                    'status' => $presence->status,
                    'activity_details' => null,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            $this->logActivity('activity_cleared');
            
            return $this->success(null, 'Activity cleared successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while clearing activity: ' . $e->getMessage());
        }
    }
    
    public function goOffline() {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $marked = $this->userPresenceRepository->markOffline($userId);
            
            if (!$marked) {
                return $this->serverError('Failed to mark user as offline');
            }
            
            $user = $this->userRepository->find($userId);
            
            $this->socketController->updateUserStatus($userId, 'offline');
            
            $this->logActivity('went_offline');
            
            return $this->success(null, 'User marked as offline successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while going offline: ' . $e->getMessage());
        }
    }
} 