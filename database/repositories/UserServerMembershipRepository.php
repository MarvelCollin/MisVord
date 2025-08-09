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
            error_log("UpdateRole attempt: user_id=$userId, server_id=$serverId, new_role=$role");
            
            $query = new Query();
            
            $existingMembership = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->first();
                
            if (!$existingMembership) {
                error_log("UpdateRole failed: No membership found for user $userId in server $serverId");
                return false;
            }
            
            error_log("Current membership found: " . json_encode($existingMembership));
            
            $updated = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->update([
                    'role' => $role,
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            error_log("UpdateRole query result: " . ($updated !== false ? "success (affected rows: $updated)" : "failed"));
            
            if ($updated !== false && $updated > 0) {
                $verifyUpdate = $query->table('user_server_memberships')
                    ->where('user_id', $userId)
                    ->where('server_id', $serverId)
                    ->first();
                    
                error_log("Updated membership verification: " . json_encode($verifyUpdate));
                return true;
            }
            
            error_log("UpdateRole failed: No rows affected");
            return false;
        } catch (Exception $e) {
            error_log("Error updating user role: " . $e->getMessage());
            error_log("UpdateRole exception trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    public function getMemberCount($serverId) {
        return count($this->getAllBy('server_id', $serverId));
    }
    
    public function getHumanMemberCount($serverId) {
        try {
            $query = new Query();
            $count = $query->table('user_server_memberships usm')
                ->join('users u', 'usm.user_id', '=', 'u.id')
                ->where('usm.server_id', $serverId)
                ->where('u.status', '!=', 'bot')
                ->count();
            return $count;
        } catch (Exception $e) {
            error_log("Error getting human member count: " . $e->getMessage());
            return 0;
        }
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
            $serverId = intval($serverId);
            $currentOwnerId = intval($currentOwnerId);
            $newOwnerId = intval($newOwnerId);
            
            error_log("Starting ownership transfer: server_id=$serverId, current_owner=$currentOwnerId, new_owner=$newOwnerId");
            
            if ($serverId <= 0 || $currentOwnerId <= 0 || $newOwnerId <= 0) {
                $error = "Invalid IDs - server_id=$serverId, current_owner=$currentOwnerId, new_owner=$newOwnerId";
                error_log("Transfer failed: $error");
                return [
                    'success' => false,
                    'error_type' => 'validation_error',
                    'error_message' => $error,
                    'step_failed' => 'id_validation'
                ];
            }
            
            $query = new Query();
            $transactionStarted = $query->beginTransaction();
            
            if (!$transactionStarted) {
                $error = "Failed to start database transaction";
                error_log("Transfer failed: $error");
                return [
                    'success' => false,
                    'error_type' => 'transaction_error',
                    'error_message' => $error,
                    'step_failed' => 'transaction_start'
                ];
            }
            
            error_log("Transaction started - validating new owner membership inside transaction");
            
            $existingNewOwnerMembership = $query->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->first();
                
            if (!$existingNewOwnerMembership) {
                $error = "New owner user $newOwnerId is not a member of server $serverId";
                error_log("Transfer failed: $error");
                $query->rollback();
                return [
                    'success' => false,
                    'error_type' => 'membership_not_found',
                    'error_message' => $error,
                    'step_failed' => 'new_owner_membership_check'
                ];
            }
            
            error_log("Found new owner membership: " . json_encode($existingNewOwnerMembership));
            
            $membershipRole = $existingNewOwnerMembership->role ?? '';
            error_log("New owner current role: '" . $membershipRole . "' - proceeding with transfer");
            
            error_log("New owner validation passed - proceeding with updates");
            
            $allCurrentOwners = $query->table('user_server_memberships')
                ->where('server_id', $serverId)
                ->where('role', 'owner')
                ->get();
                
            error_log("Found " . count($allCurrentOwners) . " current owners before transfer");
            
            if (count($allCurrentOwners) > 1) {
                error_log("Multiple owners detected before transfer - cleaning up first");
                $cleanupBeforeResult = $query->table('user_server_memberships')
                    ->where('server_id', $serverId)
                    ->where('role', 'owner')
                    ->where('user_id', '!=', $currentOwnerId)
                    ->update(['role' => 'admin', 'updated_at' => date('Y-m-d H:i:s')]);
                    
                error_log("Pre-transfer cleanup completed: $cleanupBeforeResult rows affected");
            }
            
            error_log("EXECUTING FIRST UPDATE: UPDATE user_server_memberships SET role = 'admin' WHERE user_id = $currentOwnerId AND server_id = $serverId");
            $updateCurrentOwner = $query->newInstance()->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'admin', 'updated_at' => date('Y-m-d H:i:s')]);

            error_log("Update current owner to admin result: " . ($updateCurrentOwner !== false ? "success ($updateCurrentOwner rows)" : 'failed'));
            
            if ($updateCurrentOwner === false) {
                $error = "Database error updating current owner to admin";
                error_log("CRITICAL: $error - rolling back transaction");
                $query->rollback();
                return [
                    'success' => false,
                    'error_type' => 'database_error',
                    'error_message' => $error,
                    'step_failed' => 'update_current_owner_to_admin'
                ];
            }

            error_log("EXECUTING SECOND UPDATE: UPDATE user_server_memberships SET role = 'owner' WHERE user_id = $newOwnerId AND server_id = $serverId");
            
            $updateNewOwner = $query->newInstance()->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->update(['role' => 'owner', 'updated_at' => date('Y-m-d H:i:s')]);

            error_log("Update new owner result: " . ($updateNewOwner !== false ? "success ($updateNewOwner rows)" : 'failed'));
            
            if ($updateNewOwner === false) {
                $error = "Database error updating new owner to owner";
                error_log("CRITICAL: $error - rolling back transaction");
                $query->rollback();
                return [
                    'success' => false,
                    'error_type' => 'database_error',
                    'error_message' => $error,
                    'step_failed' => 'update_new_owner_to_owner'
                ];
            }

            $commitResult = $query->commit();
            if (!$commitResult) {
                $error = "Failed to commit transaction";
                error_log("Transfer failed: $error");
                return [
                    'success' => false,
                    'error_type' => 'transaction_commit_error',
                    'error_message' => $error,
                    'step_failed' => 'transaction_commit'
                ];
            }
            
            error_log("Atomic transaction committed successfully");
            
            $verifyQuery = new Query();
            $actualCurrentOwnerRole = $verifyQuery->table('user_server_memberships')
                ->where('user_id', $currentOwnerId)
                ->where('server_id', $serverId)
                ->first();
                
            $actualNewOwnerRole = $verifyQuery->table('user_server_memberships')
                ->where('user_id', $newOwnerId)
                ->where('server_id', $serverId)
                ->first();
                
            error_log("VERIFICATION - Current owner (ID: $currentOwnerId) actual role: " . ($actualCurrentOwnerRole ? $actualCurrentOwnerRole->role : 'NOT FOUND'));
            error_log("VERIFICATION - New owner (ID: $newOwnerId) actual role: " . ($actualNewOwnerRole ? $actualNewOwnerRole->role : 'NOT FOUND'));
            
            error_log("Complete ownership transfer verified successfully: server_id=$serverId, old_owner=$currentOwnerId, new_owner=$newOwnerId");
            return [
                'success' => true,
                'message' => 'Ownership transferred successfully',
                'old_owner_id' => $currentOwnerId,
                'new_owner_id' => $newOwnerId,
                'server_id' => $serverId
            ];
        } catch (Exception $e) {
            $error = "Exception in transferOwnership: " . $e->getMessage();
            error_log($error);
            error_log("Exception trace: " . $e->getTraceAsString());
            if (isset($query) && $query) {
                try {
                    $query->rollback();
                    error_log("Transaction rolled back due to exception");
                } catch (Exception $rollbackEx) {
                    error_log("Failed to rollback transaction: " . $rollbackEx->getMessage());
                }
            }
            return [
                'success' => false,
                'error_type' => 'exception',
                'error_message' => $e->getMessage(),
                'step_failed' => 'exception_occurred',
                'exception_trace' => $e->getTraceAsString()
            ];
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
