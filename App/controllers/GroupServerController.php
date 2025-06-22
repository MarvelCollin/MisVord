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
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $groups = $this->groupServerRepository->getWithServersCount($userId);
        
        return $this->success($groups, 'Group servers retrieved successfully');
    }
    
    public function create() {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        $this->validate($input, [
            'group_name' => 'required'
        ]);
        
        try {
            $group = $this->groupServerRepository->createForUser($userId, $input['group_name']);
            
            if (!$group) {
                return $this->serverError('Failed to create group server');
            }
            
            $this->broadcastViaSocket('group-server-created', [
                'group' => $group->toArray(),
                'user_id' => $userId
            ]);
            
            $this->logActivity('group_server_created', [
                'group_id' => $group->id,
                'group_name' => $group->group_name
            ]);
            
            return $this->success($group->toArray(), 'Group server created successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while creating the group server: ' . $e->getMessage());
        }
    }
    
    public function update($id) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $group = $this->groupServerRepository->find($id);
            
            if (!$group) {
                return $this->notFound('Group server not found');
            }
            
            if ($group->user_id != $userId) {
                return $this->forbidden('You do not have permission to update this group server');
            }
            
            $this->validate($input, [
                'group_name' => 'required'
            ]);
            
            $updatedGroup = $this->groupServerRepository->update($id, [
                'group_name' => $input['group_name']
            ]);
            
            if (!$updatedGroup) {
                return $this->serverError('Failed to update group server');
            }
            
            $this->broadcastViaSocket('group-server-updated', [
                'group' => $updatedGroup->toArray(),
                'user_id' => $userId
            ]);
            
            return $this->success($updatedGroup->toArray(), 'Group server updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating the group server: ' . $e->getMessage());
        }
    }
    
    public function delete($id) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $group = $this->groupServerRepository->find($id);
            
            if (!$group) {
                return $this->notFound('Group server not found');
            }
            
            if ($group->user_id != $userId) {
                return $this->forbidden('You do not have permission to delete this group server');
            }
            
            $deleted = $this->groupServerRepository->delete($id);
            
            if (!$deleted) {
                return $this->serverError('Failed to delete group server');
            }
            
            $this->broadcastViaSocket('group-server-deleted', [
                'group_id' => $id,
                'user_id' => $userId
            ]);
            
            return $this->success(null, 'Group server deleted successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while deleting the group server: ' . $e->getMessage());
        }
    }
    
    public function getServers($id) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $group = $this->groupServerRepository->find($id);
            
            if (!$group) {
                return $this->notFound('Group server not found');
            }
            
            if ($group->user_id != $userId) {
                return $this->forbidden('You do not have permission to view this group server');
            }
            
            $servers = $this->serverRepository->getAllBy('group_server_id', $id);
            
            return $this->success([
                'group' => $group->toArray(),
                'servers' => $servers
            ], 'Servers retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving servers: ' . $e->getMessage());
        }
    }
}