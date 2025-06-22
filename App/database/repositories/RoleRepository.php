<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Role.php';
require_once __DIR__ . '/../query.php';

class RoleRepository extends Repository {
    protected function getModelClass() {
        return Role::class;
    }
    
    public function getForServer($serverId) {
        return Role::getForServer($serverId);
    }
    
    public function createRole($serverId, $name, $color = null) {
        return $this->create([
            'server_id' => $serverId,
            'role_name' => $name,
            'role_color' => $color
        ]);
    }
    
    public function updateRole($roleId, $name, $color = null) {
        $data = ['role_name' => $name];
        
        if ($color !== null) {
            $data['role_color'] = $color;
        }
        
        return $this->update($roleId, $data);
    }
    
    public function assignRoleToUser($roleId, $userId) {
        $query = new Query();
        
        $exists = $query->table('user_roles')
            ->where('user_id', $userId)
            ->where('role_id', $roleId)
            ->exists();
            
        if ($exists) {
            return true;
        }
        
        return $query->table('user_roles')->insert([
            'user_id' => $userId,
            'role_id' => $roleId,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function removeRoleFromUser($roleId, $userId) {
        $query = new Query();
        return $query->table('user_roles')
            ->where('user_id', $userId)
            ->where('role_id', $roleId)
            ->delete();
    }
    
    public function getUserRoles($userId) {
        $query = "SELECT r.* FROM roles r 
                  JOIN user_roles ur ON r.id = ur.role_id 
                  WHERE ur.user_id = :user_id";
        
        $params = [':user_id' => $userId];
        
        return $this->db->fetchAll($query, $params);
    }
    
    /**
     * Get user roles in a specific server
     * 
     * @param int $userId User ID
     * @param int $serverId Server ID
     * @return array List of roles the user has in the server
     */
    public function getUserRolesInServer($userId, $serverId)
    {
        $query = "SELECT r.id, r.name, r.color, r.position, r.permissions, r.server_id
                  FROM roles r
                  JOIN user_roles ur ON r.id = ur.role_id
                  WHERE ur.user_id = :user_id AND r.server_id = :server_id
                  ORDER BY r.position DESC";
        
        $params = [
            ':user_id' => $userId,
            ':server_id' => $serverId
        ];
        
        $roles = $this->db->fetchAll($query, $params);
        
        // Check if user is the server owner
        $ownerQuery = "SELECT owner_id FROM servers WHERE id = :server_id LIMIT 1";
        $owner = $this->db->fetchOne($ownerQuery, [':server_id' => $serverId]);
        
        if ($owner && $owner->owner_id == $userId) {
            // Add a virtual "Owner" role
            array_unshift($roles, [
                'id' => 0,
                'name' => 'Owner',
                'color' => '#f1c40f', // Gold color
                'position' => 9999,
                'permissions' => null,
                'server_id' => $serverId
            ]);
        }
        
        return $roles;
    }
    
    public function getUserRolesForServer($userId, $serverId) {
        $query = new Query();
        return $query->table('roles r')
            ->join('user_roles ur', 'r.id', '=', 'ur.role_id')
            ->where('ur.user_id', $userId)
            ->where('r.server_id', $serverId)
            ->select('r.*')
            ->get();
    }
    
    public function deleteRole($roleId) {
        // Implementation of deleteRole method
    }
} 
