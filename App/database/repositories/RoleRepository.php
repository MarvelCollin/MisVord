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
        $query = new Query();
        return $query->table('roles r')
            ->join('user_roles ur', 'r.id', '=', 'ur.role_id')
            ->where('ur.user_id', $userId)
            ->select('r.*')
            ->get();
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
} 
