<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserPresenceRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class UserPresenceController extends BaseController {
    private $userPresenceRepository;
    private $userRepository;
    
    public function __construct() {
        parent::__construct();
        $this->userPresenceRepository = new UserPresenceRepository();
        $this->userRepository = new UserRepository();
    }
    
    public function updateStatus() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['status']) || empty($data['status'])) {
            return $this->json(['error' => 'Status is required'], 400);
        }
        
        $status = $data['status'];
        
        if (!in_array($status, ['online', 'away', 'dnd', 'offline'])) {
            return $this->json(['error' => 'Invalid status. Must be one of: online, away, dnd, offline'], 400);
        }
        
        $activityDetails = isset($data['activity_details']) ? $data['activity_details'] : null;
        
        $updated = $this->userPresenceRepository->updatePresence($userId, $status, $activityDetails);
        
        if (!$updated) {
            return $this->json(['error' => 'Failed to update status'], 500);
        }
        
        return $this->json(['message' => 'Status updated successfully']);
    }
    
    public function getStatus($userId = null) {
        $currentUserId = $this->getCurrentUserId();
        
        if (!$currentUserId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $targetUserId = $userId ?? $currentUserId;
        
        $presence = $this->userPresenceRepository->findByUserId($targetUserId);
        
        if (!$presence) {
            return $this->json(['status' => 'offline', 'activity_details' => null, 'last_seen' => null]);
        }
        
        return $this->json([
            'status' => $presence->status,
            'activity_details' => $presence->activity_details,
            'last_seen' => $presence->last_seen,
            'formatted_last_seen' => $presence->getFormattedLastSeen()
        ]);
    }
    
    public function getOnlineUsers() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $onlineUsers = $this->userPresenceRepository->getOnlineUsers();
        return $this->json(['online_users' => $onlineUsers]);
    }
    
    public function setActivity() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['activity_details']) || empty($data['activity_details'])) {
            return $this->json(['error' => 'Activity details are required'], 400);
        }
        
        $activityDetails = $data['activity_details'];
        
        $updated = $this->userPresenceRepository->updateActivity($userId, $activityDetails);
        
        if (!$updated) {
            return $this->json(['error' => 'Failed to update activity'], 500);
        }
        
        return $this->json(['message' => 'Activity updated successfully']);
    }
    
    public function clearActivity() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $presence = $this->userPresenceRepository->findByUserId($userId);
        
        if ($presence) {
            $updated = $this->userPresenceRepository->update($presence->id, [
                'activity_details' => null,
                'last_seen' => date('Y-m-d H:i:s')
            ]);
            
            if (!$updated) {
                return $this->json(['error' => 'Failed to clear activity'], 500);
            }
        }
        
        return $this->json(['message' => 'Activity cleared successfully']);
    }
    
    public function goOffline() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $marked = $this->userPresenceRepository->markOffline($userId);
        
        if (!$marked) {
            return $this->json(['error' => 'Failed to mark user as offline'], 500);
        }
        
        return $this->json(['message' => 'User marked as offline successfully']);
    }
} 