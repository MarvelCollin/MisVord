<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/RolePermission.php';
require_once __DIR__ . '/../query.php';

class RolePermissionRepository extends Repository {
    public function __construct() {
        parent::__construct(RolePermission::class);
    }
    
    public function getForRole($roleId) {
        return RolePermission::getForRole($roleId);
    }
    
    public function getForChannel($channelId) {
        return RolePermission::getForChannel($channelId);
    }
    
    public function createOrUpdate($roleId, $channelId, $permissions) {
        $query = new Query();
        $existingPermission = $query->table('role_permissions')
            ->where('role_id', $roleId)
            ->where('channel_id', $channelId)
            ->first();
            
        if ($existingPermission) {
            return $this->update($existingPermission['id'], $permissions);
        }
        
        $data = array_merge([
            'role_id' => $roleId,
            'channel_id' => $channelId
        ], $permissions);
        
        return $this->create($data);
    }
    
    public function checkPermission($roleId, $channelId, $permission) {
        $query = new Query();
        $result = $query->table('role_permissions')
            ->select($permission)
            ->where('role_id', $roleId)
            ->where('channel_id', $channelId)
            ->first();
            
        return $result && isset($result[$permission]) && $result[$permission];
    }
    
    public function getRolePermissionsForServer($serverId) {
        $query = new Query();
        return $query->table('role_permissions rp')
            ->join('roles r', 'rp.role_id', '=', 'r.id')
            ->join('channels c', 'rp.channel_id', '=', 'c.id')
            ->where('r.server_id', $serverId)
            ->select('rp.*', 'r.role_name', 'c.name as channel_name')
            ->get();
    }
    
    public function getUserEffectivePermissions($userId, $channelId) {
        $query = new Query();
        
        $roles = $query->table('user_roles ur')
            ->join('roles r', 'ur.role_id', '=', 'r.id')
            ->where('ur.user_id', $userId)
            ->select('r.id')
            ->get();
            
        $roleIds = array_column($roles, 'id');
        
        if (empty($roleIds)) {
            return [
                'can_read' => false,
                'can_write' => false,
                'can_manage' => false,
                'can_delete' => false
            ];
        }
        
        $permissions = $query->table('role_permissions')
            ->whereIn('role_id', $roleIds)
            ->where('channel_id', $channelId)
            ->get();
            
        $effectivePermissions = [
            'can_read' => false,
            'can_write' => false,
            'can_manage' => false,
            'can_delete' => false
        ];
        
        foreach ($permissions as $permission) {
            foreach ($effectivePermissions as $key => $value) {
                if (isset($permission[$key]) && $permission[$key]) {
                    $effectivePermissions[$key] = true;
                }
            }
        }
        
        return $effectivePermissions;
    }
} 