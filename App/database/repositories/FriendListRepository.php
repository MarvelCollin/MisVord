<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/FriendList.php';
require_once __DIR__ . '/../query.php';

class FriendListRepository extends Repository {
    protected $db;
    
    public function __construct() {
        parent::__construct();
        $this->db = new Query();
    }
    
    protected function getModelClass() {
        return FriendList::class;
    }
    
    public function findRelationship($userId1, $userId2) {
        return FriendList::findRelationship($userId1, $userId2);
    }
    
    public function getUserFriends($userId) {
        return FriendList::getUserFriends($userId);
    }
    
    public function getPendingRequests($userId) {
        return FriendList::getPendingRequests($userId);
    }
    
    public function getSentRequests($userId) {
        return FriendList::getSentRequests($userId);
    }
    
    public function sendFriendRequest($fromUserId, $toUserId) {
        $relationship = $this->findRelationship($fromUserId, $toUserId);
        
        if ($relationship) {
            $status = $relationship->__get('status');
            if ($status === 'pending') {
                return $relationship;
            } elseif ($status === 'accepted') {
                return false;
            }
        }
        
        return $this->create([
            'user_id' => $fromUserId,
            'user_id2' => $toUserId,
            'status' => 'pending'
        ]);
    }
      public function acceptFriendRequest($userId, $friendshipId) {
        $friendship = $this->find($friendshipId);
        
        if (!$friendship || $friendship->user_id2 != $userId) {
            return false;
        }
        
        $query = new Query();
        $result = $query->table('friend_list')
            ->where('id', $friendshipId)
            ->update([
                'status' => 'accepted',
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
        return $result > 0;
    }    public function declineFriendRequest($userId, $friendshipId) {
        $friendship = $this->find($friendshipId);
        
        if (!$friendship || $friendship->user_id2 != $userId) {
            return false;
        }
        
        $query = new Query();
        $result = $query->table('friend_list')
            ->where('id', $friendshipId)
            ->delete();
            
        return $result > 0;
    }
    

    
    public function removeFriend($userId, $friendId) {
        $relationship = $this->findRelationship($userId, $friendId);
        return $relationship ? $relationship->delete() : false;
    }

    
    public function findFriendship($friendshipId) {
        return $this->find($friendshipId);
    }
    
    public function findFriendshipBetweenUsers($userId1, $userId2) {
        $query = new Query();
        $result = $query->table(FriendList::getTable())
            ->where('user_id', $userId1)
            ->where('user_id2', $userId2)
            ->first();
            
        if (!$result) {
            $query2 = new Query();
            $result = $query2->table(FriendList::getTable())
                ->where('user_id', $userId2)
                ->where('user_id2', $userId1)
                ->first();
        }
            
        return $result ? new FriendList($result) : null;
    }
    
    public function getFriendshipStatus($userId, $otherUserId)
    {
        if (!$userId || !$otherUserId) {
            return null;
        }
        
        $query = new Query();
        try {
            $result = $query->table('friend_list')
                ->where('user_id', $userId)
                ->where('user_id2', $otherUserId)
                ->first();
            
            if ($result) {
                if ($result['status'] === 'accepted') {
                    return 'friends';
                } elseif ($result['status'] === 'pending') {
                    return 'pending_sent';
                }
            }
            
            $result = $query->table('friend_list')
                ->where('user_id', $otherUserId)
                ->where('user_id2', $userId)
                ->first();
            
            if ($result) {
                if ($result['status'] === 'accepted') {
                    return 'friends';
                } elseif ($result['status'] === 'pending') {
                    return 'pending_received';
                }
            }
        } catch (Exception $e) {
            error_log("Error in getFriendshipStatus: " . $e->getMessage());
        }
        
        return null;
    }

    public function areFriends($userId1, $userId2)
    {
        $query = new Query();
        
        $result1 = $query->table('friend_list')
            ->where('user_id', $userId1)
            ->where('user_id2', $userId2)
            ->where('status', 'accepted')
            ->first();
        
        if (!empty($result1)) {
            return true;
        }
        
        $query2 = new Query();
        $result2 = $query2->table('friend_list')
            ->where('user_id', $userId2)
            ->where('user_id2', $userId1)
            ->where('status', 'accepted')
            ->first();
        
        return !empty($result2);
    }

    public function hasPendingRequest($fromUserId, $toUserId)
    {
        $query = new Query();
        
        $result = $query->table('friend_list')
            ->where('user_id', $fromUserId)
            ->where('user_id2', $toUserId)
            ->where('status', 'pending')
            ->first();
        
        return !empty($result);
    }

    public function getMutualFriends($userId1, $userId2)
    {
        try {
            error_log("Getting mutual friends between user $userId1 and user $userId2");
            
            $query = new Query();
            $sql = "
                SELECT DISTINCT u.id, u.username, u.display_name, u.avatar_url, u.status, u.discriminator
                FROM users u
                INNER JOIN (
                    SELECT 
                        CASE WHEN f1.user_id = ? THEN f1.user_id2 ELSE f1.user_id END as friend_id
                    FROM friend_list f1
                    WHERE (f1.user_id = ? OR f1.user_id2 = ?)
                    AND f1.status = 'accepted'
                    AND CASE WHEN f1.user_id = ? THEN f1.user_id2 ELSE f1.user_id END != ?
                ) user1_friends ON u.id = user1_friends.friend_id
                INNER JOIN (
                    SELECT 
                        CASE WHEN f2.user_id = ? THEN f2.user_id2 ELSE f2.user_id END as friend_id
                    FROM friend_list f2
                    WHERE (f2.user_id = ? OR f2.user_id2 = ?)
                    AND f2.status = 'accepted'
                    AND CASE WHEN f2.user_id = ? THEN f2.user_id2 ELSE f2.user_id END != ?
                ) user2_friends ON u.id = user2_friends.friend_id
                WHERE u.status != 'bot'
                ORDER BY u.username
            ";
            
            $users = $query->query($sql, [
                $userId1, $userId1, $userId1, $userId1, $userId1,
                $userId2, $userId2, $userId2, $userId2, $userId2
            ]);
            
            error_log("Found " . count($users) . " mutual friends");
            
            $result = [];
            foreach ($users as $user) {
                $userObj = new \stdClass();
                $userObj->id = $user['id'];
                $userObj->username = $user['username'];
                $userObj->display_name = $user['display_name'] ?? $user['username'];
                $userObj->avatar_url = $user['avatar_url'];
                $userObj->status = $user['status'];
                $userObj->discriminator = $user['discriminator'] ?? '0000';
                
                $result[] = $userObj;
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Error in getMutualFriends: " . $e->getMessage());
            return [];
        }
    }
}
