<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/RoleRepository.php';
require_once __DIR__ . '/../database/repositories/RolePermissionRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class RoleController extends BaseController {
    private $roleRepository;
    private $rolePermissionRepository;
    private $serverRepository;
    private $userServerMembershipRepository;
    
    public function __construct() {
        parent::__construct();
        $this->roleRepository = new RoleRepository();
        $this->rolePermissionRepository = new RolePermissionRepository();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }
    
    public function getServerRoles($serverId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        if (!$this->userServerMembershipRepository->isMember($userId, $serverId)) {
            return $this->json(['error' => 'You are not a member of this server'], 403);
        }
        
        $roles = $this->roleRepository->getForServer($serverId);
        return $this->json(['roles' => $roles]);
    }
    
    public function createRole($serverId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        if (!$this->userServerMembershipRepository->isOwner($userId, $serverId)) {
            return $this->json(['error' => 'Only server owners can create roles'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['role_name']) || empty($data['role_name'])) {
            return $this->json(['error' => 'Role name is required'], 400);
        }
        
        $roleName = $data['role_name'];
        $roleColor = isset($data['role_color']) ? $data['role_color'] : null;
        
        $role = $this->roleRepository->createRole($serverId, $roleName, $roleColor);
        
        if (!$role) {
            return $this->json(['error' => 'Failed to create role'], 500);
        }
        
        return $this->json([
            'message' => 'Role created successfully',
            'role' => $role->toArray()
        ]);
    }
    
    public function updateRole($roleId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $role = $this->roleRepository->find($roleId);
        
        if (!$role) {
            return $this->json(['error' => 'Role not found'], 404);
        }
        
        if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
            return $this->json(['error' => 'Only server owners can update roles'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['role_name']) || empty($data['role_name'])) {
            return $this->json(['error' => 'Role name is required'], 400);
        }
        
        $roleName = $data['role_name'];
        $roleColor = isset($data['role_color']) ? $data['role_color'] : null;
        
        $updated = $this->roleRepository->updateRole($roleId, $roleName, $roleColor);
        
        if (!$updated) {
            return $this->json(['error' => 'Failed to update role'], 500);
        }
        
        return $this->json([
            'message' => 'Role updated successfully',
            'role' => $updated->toArray()
        ]);
    }
    
    public function deleteRole($roleId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $role = $this->roleRepository->find($roleId);
        
        if (!$role) {
            return $this->json(['error' => 'Role not found'], 404);
        }
        
        if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
            return $this->json(['error' => 'Only server owners can delete roles'], 403);
        }
        
        $deleted = $this->roleRepository->delete($roleId);
        
        if (!$deleted) {
            return $this->json(['error' => 'Failed to delete role'], 500);
        }
        
        return $this->json(['message' => 'Role deleted successfully']);
    }
    
    public function assignRoleToUser($roleId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $role = $this->roleRepository->find($roleId);
        
        if (!$role) {
            return $this->json(['error' => 'Role not found'], 404);
        }
        
        if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
            return $this->json(['error' => 'Only server owners can assign roles'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['user_id']) || empty($data['user_id'])) {
            return $this->json(['error' => 'User ID is required'], 400);
        }
        
        $targetUserId = $data['user_id'];
        
        if (!$this->userServerMembershipRepository->isMember($targetUserId, $role->server_id)) {
            return $this->json(['error' => 'User is not a member of this server'], 400);
        }
        
        $assigned = $this->roleRepository->assignRoleToUser($roleId, $targetUserId);
        
        if (!$assigned) {
            return $this->json(['error' => 'Failed to assign role'], 500);
        }
        
        return $this->json(['message' => 'Role assigned successfully']);
    }
    
    public function removeRoleFromUser($roleId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $role = $this->roleRepository->find($roleId);
        
        if (!$role) {
            return $this->json(['error' => 'Role not found'], 404);
        }
        
        if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
            return $this->json(['error' => 'Only server owners can remove roles'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['user_id']) || empty($data['user_id'])) {
            return $this->json(['error' => 'User ID is required'], 400);
        }
        
        $targetUserId = $data['user_id'];
        
        $removed = $this->roleRepository->removeRoleFromUser($roleId, $targetUserId);
        
        if (!$removed) {
            return $this->json(['error' => 'Failed to remove role'], 500);
        }
        
        return $this->json(['message' => 'Role removed successfully']);
    }
    
    public function updateRolePermissions($roleId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $role = $this->roleRepository->find($roleId);
        
        if (!$role) {
            return $this->json(['error' => 'Role not found'], 404);
        }
        
        if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
            return $this->json(['error' => 'Only server owners can update role permissions'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['channel_id']) || empty($data['channel_id'])) {
            return $this->json(['error' => 'Channel ID is required'], 400);
        }
        
        $channelId = $data['channel_id'];
        $permissions = [
            'can_read' => isset($data['can_read']) ? (bool)$data['can_read'] : false,
            'can_write' => isset($data['can_write']) ? (bool)$data['can_write'] : false,
            'can_manage' => isset($data['can_manage']) ? (bool)$data['can_manage'] : false,
            'can_delete' => isset($data['can_delete']) ? (bool)$data['can_delete'] : false
        ];
        
        $permission = $this->rolePermissionRepository->createOrUpdate($roleId, $channelId, $permissions);
        
        if (!$permission) {
            return $this->json(['error' => 'Failed to update role permissions'], 500);
        }
        
        return $this->json([
            'message' => 'Role permissions updated successfully',
            'permissions' => $permission->toArray()
        ]);
    }
    
    public function getRolePermissions($roleId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $role = $this->roleRepository->find($roleId);
        
        if (!$role) {
            return $this->json(['error' => 'Role not found'], 404);
        }
        
        if (!$this->userServerMembershipRepository->isMember($userId, $role->server_id)) {
            return $this->json(['error' => 'You are not a member of this server'], 403);
        }
        
        $permissions = $this->rolePermissionRepository->getForRole($roleId);
        
        return $this->json(['permissions' => $permissions]);
    }
} 