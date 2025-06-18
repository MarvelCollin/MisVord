<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/GroupServerRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class GroupServerController extends BaseController {
    private $groupServerRepository;
    private $serverRepository;
    
    public function __construct() {
        parent::__construct();
        $this->groupServerRepository = new GroupServerRepository();
        $this->serverRepository = new ServerRepository();
    }
    
    public function index() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $groups = $this->groupServerRepository->getWithServersCount($userId);
        return $this->json(['groups' => $groups]);
    }
    
    public function create() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['group_name']) || empty($data['group_name'])) {
            return $this->json(['error' => 'Group name is required'], 400);
        }
        
        $group = $this->groupServerRepository->createForUser($userId, $data['group_name']);
        
        if (!$group) {
            return $this->json(['error' => 'Failed to create group'], 500);
        }
        
        return $this->json(['group' => $group->toArray(), 'message' => 'Group created successfully']);
    }
    
    public function update($id) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $group = $this->groupServerRepository->find($id);
        
        if (!$group) {
            return $this->json(['error' => 'Group not found'], 404);
        }
        
        if ($group->user_id != $userId) {
            return $this->json(['error' => 'You do not have permission to update this group'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['group_name']) || empty($data['group_name'])) {
            return $this->json(['error' => 'Group name is required'], 400);
        }
        
        $updated = $this->groupServerRepository->updateName($id, $data['group_name']);
        
        if (!$updated) {
            return $this->json(['error' => 'Failed to update group'], 500);
        }
        
        return $this->json(['message' => 'Group updated successfully', 'group' => $updated->toArray()]);
    }
    
    public function delete($id) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $group = $this->groupServerRepository->find($id);
        
        if (!$group) {
            return $this->json(['error' => 'Group not found'], 404);
        }
        
        if ($group->user_id != $userId) {
            return $this->json(['error' => 'You do not have permission to delete this group'], 403);
        }
        
        $deleted = $this->groupServerRepository->deleteWithServers($id);
        
        if (!$deleted) {
            return $this->json(['error' => 'Failed to delete group'], 500);
        }
        
        return $this->json(['message' => 'Group and associated servers deleted successfully']);
    }
    
    public function getServers($id) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $group = $this->groupServerRepository->find($id);
        
        if (!$group) {
            return $this->json(['error' => 'Group not found'], 404);
        }
        
        if ($group->user_id != $userId) {
            return $this->json(['error' => 'You do not have permission to view this group'], 403);
        }
        
        $servers = $this->serverRepository->getAllBy('group_server_id', $id);
        
        return $this->json(['servers' => $servers]);
    }
} 