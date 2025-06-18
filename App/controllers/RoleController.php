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
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            if (!$this->userServerMembershipRepository->isMember($userId, $serverId)) {
                return $this->forbidden('You are not a member of this server');
            }
            
            $roles = $this->roleRepository->getForServer($serverId);
            return $this->success($roles, 'Server roles retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving server roles: ' . $e->getMessage());
        }
    }
    
    public function createRole($serverId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!$this->userServerMembershipRepository->isOwner($userId, $serverId)) {
                return $this->forbidden('Only server owners can create roles');
            }
            
            // Validate input
            $this->validate($input, [
                'role_name' => 'required'
            ]);
            
            $roleName = $input['role_name'];
            $roleColor = $input['role_color'] ?? null;
            
            $role = $this->roleRepository->createRole($serverId, $roleName, $roleColor);
            
            if (!$role) {
                return $this->serverError('Failed to create role');
            }
            
            $this->broadcastViaSocket('role-created', [
                'role' => $role->toArray(),
                'server_id' => $serverId
            ], 'server-' . $serverId);
            
            $this->logActivity('role_created', [
                'role_id' => $role->id,
                'role_name' => $role->role_name,
                'server_id' => $serverId
            ]);
            
            return $this->success($role->toArray(), 'Role created successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while creating the role: ' . $e->getMessage());
        }
    }
    
    public function updateRole($roleId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $role = $this->roleRepository->find($roleId);
            
            if (!$role) {
                return $this->notFound('Role not found');
            }
            
            if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
                return $this->forbidden('Only server owners can update roles');
            }
            
            $this->validate($input, [
                'role_name' => 'required'
            ]);
            
            $roleName = $input['role_name'];
            $roleColor = $input['role_color'] ?? null;
            
            $updated = $this->roleRepository->updateRole($roleId, $roleName, $roleColor);
            
            if (!$updated) {
                return $this->serverError('Failed to update role');
            }
            
            $this->broadcastViaSocket('role-updated', [
                'role' => $updated->toArray(),
                'server_id' => $role->server_id
            ], 'server-' . $role->server_id);
            
            $this->logActivity('role_updated', [
                'role_id' => $roleId,
                'role_name' => $roleName,
                'server_id' => $role->server_id
            ]);
            
            return $this->success($updated->toArray(), 'Role updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating the role: ' . $e->getMessage());
        }
    }
    
    public function deleteRole($roleId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $role = $this->roleRepository->find($roleId);
            
            if (!$role) {
                return $this->notFound('Role not found');
            }
            
            if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
                return $this->forbidden('Only server owners can delete roles');
            }
            
            $serverId = $role->server_id; 
            $roleData = $role->toArray();

            $deleted = $this->roleRepository->delete($roleId);
            
            if (!$deleted) {
                return $this->serverError('Failed to delete role');
            }
            
            $this->broadcastViaSocket('role-deleted', [
                'role_id' => $roleId,
                'server_id' => $serverId,
                'role_data' => $roleData
            ], 'server-' . $serverId);
            
            $this->logActivity('role_deleted', [
                'role_id' => $roleId,
                'role_name' => $role->role_name,
                'server_id' => $serverId
            ]);
            
            return $this->success(null, 'Role deleted successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while deleting the role: ' . $e->getMessage());
        }
    }
    
    public function assignRoleToUser($roleId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $role = $this->roleRepository->find($roleId);
            
            if (!$role) {
                return $this->notFound('Role not found');
            }
            
            if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
                return $this->forbidden('Only server owners can assign roles');
            }
            
            $this->validate($input, [
                'user_id' => 'required'
            ]);
            
            $targetUserId = $input['user_id'];
            
            if (!$this->userServerMembershipRepository->isMember($targetUserId, $role->server_id)) {
                return $this->error('User is not a member of this server', 400);
            }
            
            $assigned = $this->roleRepository->assignRoleToUser($roleId, $targetUserId);
            
            if (!$assigned) {
                return $this->serverError('Failed to assign role');
            }
            
            $this->broadcastViaSocket('user-role-assigned', [
                'role_id' => $roleId,
                'user_id' => $targetUserId,
                'server_id' => $role->server_id,
                'role_data' => $role->toArray()
            ], 'server-' . $role->server_id);
            
            $this->notifyViaSocket($targetUserId, 'role-received', [
                'role_id' => $roleId,
                'server_id' => $role->server_id,
                'role_data' => $role->toArray()
            ]);
            
            $this->logActivity('role_assigned', [
                'role_id' => $roleId,
                'role_name' => $role->role_name,
                'user_id' => $targetUserId,
                'server_id' => $role->server_id
            ]);
            
            return $this->success(null, 'Role assigned successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while assigning the role: ' . $e->getMessage());
        }
    }
    
    public function removeRoleFromUser($roleId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $role = $this->roleRepository->find($roleId);
            
            if (!$role) {
                return $this->notFound('Role not found');
            }
            
            if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
                return $this->forbidden('Only server owners can remove roles');
            }
            
            $this->validate($input, [
                'user_id' => 'required'
            ]);
            
            $targetUserId = $input['user_id'];
            
            $removed = $this->roleRepository->removeRoleFromUser($roleId, $targetUserId);
            
            if (!$removed) {
                return $this->serverError('Failed to remove role');
            }
            
            $this->broadcastViaSocket('user-role-removed', [
                'role_id' => $roleId,
                'user_id' => $targetUserId,
                'server_id' => $role->server_id
            ], 'server-' . $role->server_id);
            
            $this->notifyViaSocket($targetUserId, 'role-removed', [
                'role_id' => $roleId,
                'server_id' => $role->server_id
            ]);
            
            $this->logActivity('role_removed', [
                'role_id' => $roleId,
                'role_name' => $role->role_name,
                'user_id' => $targetUserId,
                'server_id' => $role->server_id
            ]);
            
            return $this->success(null, 'Role removed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while removing the role: ' . $e->getMessage());
        }
    }
    
    public function updateRolePermissions($roleId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $role = $this->roleRepository->find($roleId);
            
            if (!$role) {
                return $this->notFound('Role not found');
            }
            
            if (!$this->userServerMembershipRepository->isOwner($userId, $role->server_id)) {
                return $this->forbidden('Only server owners can update role permissions');
            }
            
            // Validate input
            $this->validate($input, [
                'channel_id' => 'required'
            ]);
            
            $channelId = $input['channel_id'];
            $permissions = [
                'can_read' => isset($input['can_read']) ? (bool)$input['can_read'] : false,
                'can_write' => isset($input['can_write']) ? (bool)$input['can_write'] : false,
                'can_manage' => isset($input['can_manage']) ? (bool)$input['can_manage'] : false,
                'can_delete' => isset($input['can_delete']) ? (bool)$input['can_delete'] : false
            ];
            
            $permission = $this->rolePermissionRepository->createOrUpdate($roleId, $channelId, $permissions);
            
            if (!$permission) {
                return $this->serverError('Failed to update role permissions');
            }
            
            // Notify via socket
            $this->broadcastViaSocket('role-permissions-updated', [
                'role_id' => $roleId,
                'channel_id' => $channelId,
                'permissions' => $permission->toArray(),
                'server_id' => $role->server_id
            ], 'server-' . $role->server_id);
            
            // Log activity
            $this->logActivity('role_permissions_updated', [
                'role_id' => $roleId,
                'channel_id' => $channelId,
                'server_id' => $role->server_id,
                'permissions' => $permissions
            ]);
            
            return $this->success($permission->toArray(), 'Role permissions updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating role permissions: ' . $e->getMessage());
        }
    }
    
    public function getRolePermissions($roleId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $role = $this->roleRepository->find($roleId);
            
            if (!$role) {
                return $this->notFound('Role not found');
            }
            
            if (!$this->userServerMembershipRepository->isMember($userId, $role->server_id)) {
                return $this->forbidden('You are not a member of this server');
            }
            
            $permissions = $this->rolePermissionRepository->getForRole($roleId);
            
            return $this->success($permissions, 'Role permissions retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving role permissions: ' . $e->getMessage());
        }
    }
} 