<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/UserServerMembership.php';
require_once __DIR__ . '/../query.php';

class UserServerMembershipRepository extends Repository {
    protected $db;
    
    public function __construct() {
        parent::__construct();
        $this->db = new Query();
    }
    
    protected function getModelClass() {
        return UserServerMembership::class;
    }
    
    public function findByUserAndServer($userId, $serverId) {
        return UserServerMembership::findByUserAndServer($userId, $serverId);
    }
    
    public function getUsersForServer($serverId) {
        return UserServerMembership::getUsersForServer($serverId);
    }
    
    public function getServersForUser($userId) {
        return UserServerMembership::getServersForUser($userId);
    }
    
    public function isMember($userId, $serverId) {
        return UserServerMembership::isMember($userId, $serverId);
    }
    
    public function addMembership($userId, $serverId, $role = 'member') {
        return UserServerMembership::addMembership($userId, $serverId, $role);
    }
    
    public function removeMembership($userId, $serverId) {
        return UserServerMembership::removeMembership($userId, $serverId);
    }
    
    public function updateRole($userId, $serverId, $role) {
        try {
            $query = new Query();
            $updated = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->update([
                    'role' => $role,
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            return $updated > 0;
        } catch (Exception $e) {
            error_log("Error updating user role: " . $e->getMessage());
            return false;
        }
    }
    
    public function getMemberCount($serverId) {
        return count($this->getAllBy('server_id', $serverId));
    }
      public function getServerCount($userId) {
        return count($this->getAllBy('user_id', $userId));
    }    public function isOwner($userId, $serverId) {
        $membership = $this->findByUserAndServer($userId, $serverId);
        return $membership && $membership->role === 'owner';
    }
    
    public function getServerMembers($serverId, $includeBots = true)
    {
        try {
            $query = new Query();
            $queryBuilder = $query->table('users u')
                ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
                ->where('usm.server_id', $serverId);
            
            if (!$includeBots) {
                $queryBuilder->where('u.status', '!=', 'bot');
            }
            
            $results = $queryBuilder
                ->select('u.id, u.username, u.discriminator, u.avatar_url, u.display_name, u.status, usm.role, usm.created_at as joined_at')
                ->orderBy('usm.created_at', 'ASC')
                ->get();
            
            return $results;
        } catch (Exception $e) {
            error_log("Error getting server members: " . $e->getMessage());
            return [];
        }
    }
    
    public function getRegularMembers($serverId)
    {
        return $this->getServerMembers($serverId, false);
    }
    
    public function getBotMembers($serverId)
    {
        try {
            $query = new Query();
            $results = $query->table('users u')
                ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
                ->where('usm.server_id', $serverId)
                ->where('u.status', 'bot')
                ->select('u.id, u.username, u.discriminator, u.avatar_url, u.display_name, u.status, usm.role, usm.created_at as joined_at')
                ->orderBy('usm.created_at', 'ASC')
                ->get();
            
            return $results;
        } catch (Exception $e) {
            error_log("Error getting bot members: " . $e->getMessage());
            return [];
        }
    }
    
    public function getUserServerMembership($userId, $serverId)
    {
        try {
            $query = new Query();
            return $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->first();
        } catch (Exception $e) {
            error_log("Error getting user server membership: " . $e->getMessage());
            return null;
        }
    }
    

    
    public function getServerIdsForUser($userId) {
        return UserServerMembership::getServerIdsForUser($userId);
    }
    
    public function getPerServerProfile($userId, $serverId) {
        try {
            $query = new Query();
            $result = $query->table('user_server_memberships')
                ->select('role, notification_settings')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->first();
            
            if ($result) {
                return [
                    'role' => $result['role'],
                    'notification_settings' => $result['notification_settings'] ? json_decode($result['notification_settings'], true) : null
                ];
            }
            
            return null;
        } catch (Exception $e) {
            error_log("Error getting per-server profile: " . $e->getMessage());
            return null;
        }
    }
    
    public function getUserServerMembershipDetails($userId, $serverId) {
        try {
            $query = new Query();
            $result = $query->table('user_server_memberships usm')
                ->join('users u', 'usm.user_id', '=', 'u.id')
                ->join('servers s', 'usm.server_id', '=', 's.id')
                ->where('usm.user_id', $userId)
                ->where('usm.server_id', $serverId)
                ->select('usm.*, u.username, u.discriminator, u.avatar_url, u.status, s.name as server_name, s.owner_id')
                ->first();
                
            if ($result) {
                $result['is_owner'] = $result['owner_id'] == $userId;
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Error getting user server membership details: " . $e->getMessage());
            return null;
        }
    }
    
    public function transferOwnership($serverId, $currentOwnerId, $newOwnerId) {
        try {
            $query = new Query();
            $pdo = $query->getPdo();
            
            $pdo->beginTransaction();

            $updateCurrentOwner = (new Query($pdo))
                ->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'admin']);

            $updateNewOwner = (new Query($pdo))
                ->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'owner']);

            if ($updateCurrentOwner === false || $updateNewOwner === false) {
                $pdo->rollBack();
                return false;
            }

            $pdo->commit();
            return true;
        } catch (Exception $e) {
            error_log("Error transferring ownership: " . $e->getMessage());
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return false;
        }
    }
    
    public function getEligibleNewOwners($serverId, $excludeUserId) {
        try {
            $query = new Query();
            $results = $query->table('user_server_memberships usm')
                ->join('users u', 'usm.user_id', '=', 'u.id')
                ->where('usm.server_id', $serverId)
                ->where('usm.user_id', '!=', $excludeUserId)
                ->where('u.status', '!=', 'bot')
                ->select('u.id, u.username, u.discriminator, u.avatar_url, u.display_name, usm.role')
                ->orderBy('usm.role', 'ASC')
                ->orderBy('u.username', 'ASC')
                ->get();
            

            foreach ($results as &$user) {
                if (!empty($user['avatar_url']) && !str_starts_with($user['avatar_url'], 'http')) {
                    $user['avatar_url'] = '/public/storage/' . ltrim($user['avatar_url'], '/');
                }
            }
            
            return $results;
        } catch (Exception $e) {
            error_log("Error getting eligible new owners: " . $e->getMessage());
            return [];
        }
    }
}
