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
        $query = "SELECT u.* FROM users u
                  INNER JOIN friend_list f ON f.user_id = u.id
                  WHERE f.friend_id = ? AND f.status = 'pending'
                  ORDER BY u.username";
                  
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(function($data) {
            $user = new User();
            $user->id = $data['id'];
            $user->username = $data['username'];
            $user->discriminator = $data['discriminator'];
            $user->avatar_url = $data['avatar_url'];
            $user->status = $data['status'];
            return $user;
        }, $results);
    }
    
    public function getSentRequests($userId) {
        return FriendList::getSentRequests($userId);
    }
    
    public function sendFriendRequest($fromUserId, $toUserId) {
        $relationship = $this->findRelationship($fromUserId, $toUserId);
        
        if ($relationship) {
            if ($relationship->status === 'pending' || $relationship->status === 'accepted') {
                return true;
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
        
        $result = $query->raw("
            SELECT 1 
            FROM friend_list 
            WHERE ((user_id = ? AND user_id2 = ?) OR (user_id = ? AND user_id2 = ?))
            AND status = 'accepted'
            LIMIT 1
        ", [$userId1, $userId2, $userId2, $userId1]);
        
        return !empty($result);
    }

    public function hasPendingRequest($fromUserId, $toUserId)
    {
        $query = new Query();
        
        $result = $query->raw("
            SELECT 1 
            FROM friend_list 
            WHERE user_id = ? AND user_id2 = ? AND status = 'pending'
            LIMIT 1
        ", [$fromUserId, $toUserId]);
        
        return !empty($result);
    }

    public function getMutualFriends($userId1, $userId2) {
        $query = "SELECT DISTINCT u.* FROM users u
                  INNER JOIN friend_list f1 ON (f1.user_id = ? AND f1.friend_id = u.id)
                  INNER JOIN friend_list f2 ON (f2.user_id = ? AND f2.friend_id = u.id)
                  WHERE f1.status = 'accepted' AND f2.status = 'accepted'
                  AND u.id NOT IN (?, ?)
                  ORDER BY u.username";
                  
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId1, $userId2, $userId1, $userId2]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(function($data) {
            $user = new User();
            $user->id = $data['id'];
            $user->username = $data['username'];
            $user->discriminator = $data['discriminator'];
            $user->avatar_url = $data['avatar_url'];
            $user->status = $data['status'];
            return $user;
        }, $results);
    }

    public function getFriendship($userId1, $userId2) {
        $query = "SELECT * FROM friend_list 
                  WHERE (user_id = ? AND friend_id = ?) 
                  OR (user_id = ? AND friend_id = ?)
                  LIMIT 1";
                  
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId1, $userId2, $userId2, $userId1]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->mapToModel($result);
    }

    public function getFriendsByStatus($userId, $status) {
        $query = "SELECT u.* FROM users u
                  INNER JOIN friend_list f ON f.friend_id = u.id
                  WHERE f.user_id = ? AND f.status = ?
                  ORDER BY u.username";
                  
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId, $status]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_map(function($data) {
            $user = new User();
            $user->id = $data['id'];
            $user->username = $data['username'];
            $user->discriminator = $data['discriminator'];
            $user->avatar_url = $data['avatar_url'];
            $user->status = $data['status'];
            return $user;
        }, $results);
    }

    private function mapToModel($data) {
        $friendship = new FriendList();
        $friendship->id = $data['id'];
        $friendship->user_id = $data['user_id'];
        $friendship->friend_id = $data['friend_id'];
        $friendship->status = $data['status'];
        $friendship->created_at = $data['created_at'];
        $friendship->updated_at = $data['updated_at'];
        return $friendship;
    }
}
