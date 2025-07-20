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
            error_log("Transferring ownership of server $serverId from user $currentOwnerId to user $newOwnerId");
            
            $existingNewOwnerMembership = $this->findByUserAndServer($newOwnerId, $serverId);
            if (!$existingNewOwnerMembership) {
                error_log("New owner user $newOwnerId is not a member of server $serverId");
                return false;
            }
            
            $existingCurrentOwnerMembership = $this->findByUserAndServer($currentOwnerId, $serverId);
            if (!$existingCurrentOwnerMembership || $existingCurrentOwnerMembership->role !== 'owner') {
                error_log("Current user $currentOwnerId is not the owner of server $serverId");
                return false;
            }
            
            $query = new Query();
            $query->beginTransaction();
            
            error_log("Starting atomic transaction for ownership transfer");
            
            $updateNewOwner = $query->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'owner', 'updated_at' => date('Y-m-d H:i:s')]);

            error_log("Update new owner result: " . ($updateNewOwner !== false ? "success ($updateNewOwner rows)" : 'failed'));

            if ($updateNewOwner === false) {
                error_log("Failed to update new owner role");
                $query->rollback();
                return false;
            }

            $updateCurrentOwner = $query->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'admin', 'updated_at' => date('Y-m-d H:i:s')]);

            error_log("Update current owner to admin result: " . ($updateCurrentOwner !== false ? "success ($updateCurrentOwner rows)" : 'failed'));

            if ($updateCurrentOwner === false) {
                error_log("Failed to update current owner role to admin");
                $query->rollback();
                return false;
            }

            $allOwners = $query->table('user_server_memberships')
                ->where('server_id', $serverId)
                ->where('role', 'owner')
                ->get();
                
            error_log("Found " . count($allOwners) . " owners after transfer: " . json_encode($allOwners));
            
            if (count($allOwners) > 1) {
                error_log("Multiple owners detected - cleaning up");
                $cleanupResult = $query->table('user_server_memberships')
                    ->where('server_id', $serverId)
                    ->where('role', 'owner')
                    ->where('user_id', '!=', $newOwnerId)
                    ->update(['role' => 'admin', 'updated_at' => date('Y-m-d H:i:s')]);
                    
                error_log("Cleanup completed - demoted extra owners to admin: $cleanupResult rows affected");
            }

            $query->commit();
            error_log("Atomic transaction committed successfully");
            
            $verifyNewOwner = $query->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->where('role', 'owner')
                ->first();
                
            if (!$verifyNewOwner) {
                error_log("Ownership transfer verification failed - new owner not found with owner role");
                return false;
            }
            
            $verifyCurrentOwnerAsAdmin = $query->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->where('role', 'admin')
                ->first();
                
            if (!$verifyCurrentOwnerAsAdmin) {
                error_log("Ownership transfer verification failed - current owner not found as admin");
                return false;
            }
            
            error_log("Complete ownership transfer verified successfully");
            return true;
        } catch (Exception $e) {
            error_log("Exception in transferOwnership: " . $e->getMessage());
            error_log("Exception trace: " . $e->getTraceAsString());
            if (isset($query)) {
                try {
                    $query->rollback();
                    error_log("Transaction rolled back due to exception");
                } catch (Exception $rollbackEx) {
                    error_log("Failed to rollback transaction: " . $rollbackEx->getMessage());
                }
            }
            return false;
        }
    }
    
    public function transferOwnershipAndRemoveOldOwner($serverId, $currentOwnerId, $newOwnerId) {
        try {
            error_log("Transferring ownership and removing old owner from server $serverId from user $currentOwnerId to user $newOwnerId");
            
            $existingNewOwnerMembership = $this->findByUserAndServer($newOwnerId, $serverId);
            if (!$existingNewOwnerMembership) {
                error_log("New owner user $newOwnerId is not a member of server $serverId");
                return false;
            }
            
            $existingCurrentOwnerMembership = $this->findByUserAndServer($currentOwnerId, $serverId);
            if (!$existingCurrentOwnerMembership || $existingCurrentOwnerMembership->role !== 'owner') {
                error_log("Current user $currentOwnerId is not the owner of server $serverId");
                return false;
            }
            
            $query = new Query();
            $query->beginTransaction();
            
            error_log("Starting atomic transaction for ownership transfer and removal");
            
            $updateNewOwner = $query->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'owner', 'updated_at' => date('Y-m-d H:i:s')]);

            error_log("Update new owner result: " . ($updateNewOwner !== false ? "success ($updateNewOwner rows)" : 'failed'));

            if ($updateNewOwner === false) {
                error_log("Rolling back ownership transfer transaction - new owner update failed");
                $query->rollback();
                return false;
            }

            $removedOldOwner = $query->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->delete();

            error_log("Remove old owner result: " . ($removedOldOwner !== false ? "success ($removedOldOwner rows)" : 'failed'));

            if ($removedOldOwner === false) {
                error_log("Rolling back ownership transfer transaction - old owner removal failed");
                $query->rollback();
                return false;
            }

            $query->commit();
            error_log("Atomic ownership transfer and old owner removal completed successfully");
            
            $verifyQuery = new Query();
            $verifyNewOwner = $verifyQuery->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->where('role', 'owner')
                ->first();
                
            if (!$verifyNewOwner) {
                error_log("Ownership transfer verification failed - new owner not found with owner role");
                return false;
            }
            
            $verifyOldOwnerRemoved = $verifyQuery->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->first();
                
            if ($verifyOldOwnerRemoved) {
                error_log("Old owner removal verification failed - old owner still found in server");
                return false;
            }
            
            error_log("Complete ownership transfer and removal verified successfully");
            return true;
        } catch (Exception $e) {
            if (isset($query)) {
                $query->rollback();
            }
            error_log("Error transferring ownership: " . $e->getMessage());
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
                if (!empty($user['avatar_url']) && !preg_match('/^https?:\/\//i', $user['avatar_url']) && $user['avatar_url'][0] !== '/') {
                    $user['avatar_url'] = '/public/storage/' . ltrim($user['avatar_url'], '/');
                }
            }
            
            return $results;
        } catch (Exception $e) {
            error_log("Error getting eligible new owners: " . $e->getMessage());
            return [];
        }
    }
    
    public function getOwnershipRecords($serverId) {
        try {
            $query = new Query();
            $results = $query->table('user_server_memberships usm')
                ->join('users u', 'usm.user_id', '=', 'u.id')
                ->where('usm.server_id', $serverId)
                ->where('usm.role', 'owner')
                ->select('usm.user_id, usm.role, u.username, u.id as user_table_id')
                ->get();
                
            return array_map(function($row) {
                return is_array($row) ? $row : (array) $row;
            }, $results);
        } catch (Exception $e) {
            error_log("Error getting ownership records: " . $e->getMessage());
            return [];
        }
    }
    
    public function canPromoteMember($currentUserId, $serverId, $targetUserId) {
        $currentMembership = $this->findByUserAndServer($currentUserId, $serverId);
        $targetMembership = $this->findByUserAndServer($targetUserId, $serverId);
        
        if (!$currentMembership || !$targetMembership) {
            return false;
        }
        
        return $currentMembership->role === 'owner' && 
               $targetMembership->role === 'member' && 
               $currentUserId !== $targetUserId;
    }
    
    public function canDemoteMember($currentUserId, $serverId, $targetUserId) {
        $currentMembership = $this->findByUserAndServer($currentUserId, $serverId);
        $targetMembership = $this->findByUserAndServer($targetUserId, $serverId);
        
        if (!$currentMembership || !$targetMembership) {
            return false;
        }
        
        return $currentMembership->role === 'owner' && 
               $targetMembership->role === 'admin' && 
               $currentUserId !== $targetUserId;
    }
    
    public function canKickMember($currentUserId, $serverId, $targetUserId) {
        $currentMembership = $this->findByUserAndServer($currentUserId, $serverId);
        $targetMembership = $this->findByUserAndServer($targetUserId, $serverId);
        
        if (!$currentMembership || !$targetMembership) {
            return false;
        }
        
        if ($currentUserId === $targetUserId) {
            return false;
        }
        
        if ($targetMembership->role === 'owner') {
            return false;
        }
        
        return ($currentMembership->role === 'owner') || 
               ($currentMembership->role === 'admin' && $targetMembership->role === 'member');
    }

    public function canTransferOwnership($currentUserId, $serverId, $targetUserId) {
        $currentMembership = $this->findByUserAndServer($currentUserId, $serverId);
        $targetMembership = $this->findByUserAndServer($targetUserId, $serverId);
        
        if (!$currentMembership || !$targetMembership) {
            return false;
        }
        
        return $currentMembership->role === 'owner' && 
               $targetMembership->role === 'admin' && 
               $currentUserId !== $targetUserId;
    }
}
