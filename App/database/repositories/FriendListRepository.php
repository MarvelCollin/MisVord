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
        
        // First check if user1 is friends with user2
        $result1 = $query->table('friend_list')
            ->where('user_id', $userId1)
            ->where('user_id2', $userId2)
            ->where('status', 'accepted')
            ->first();
        
        if (!empty($result1)) {
            return true;
        }
        
        // If not found, check if user2 is friends with user1
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
        // Get friends of user 1
        $query1 = new Query();
        $friends1 = $query1->table('friend_list')
            ->where('user_id', $userId1)
            ->where('status', 'accepted')
            ->get();
        
        $query2 = new Query();
        $friends2 = $query2->table('friend_list')
            ->where('user_id2', $userId1)
            ->where('status', 'accepted')
            ->get();
        
        // Combine both sets of friends for user 1
        $friendIds1 = [];
        foreach ($friends1 as $friend) {
            $friendIds1[] = $friend['user_id2'];
        }
        foreach ($friends2 as $friend) {
            $friendIds1[] = $friend['user_id'];
        }
        
        // Get friends of user 2
        $query3 = new Query();
        $friends3 = $query3->table('friend_list')
            ->where('user_id', $userId2)
            ->where('status', 'accepted')
            ->get();
        
        $query4 = new Query();
        $friends4 = $query4->table('friend_list')
            ->where('user_id2', $userId2)
            ->where('status', 'accepted')
            ->get();
        
        // Combine both sets of friends for user 2
        $friendIds2 = [];
        foreach ($friends3 as $friend) {
            $friendIds2[] = $friend['user_id2'];
        }
        foreach ($friends4 as $friend) {
            $friendIds2[] = $friend['user_id'];
        }
        
        // Find the intersection of friend IDs
        $mutualFriendIds = array_intersect($friendIds1, $friendIds2);
        
        if (empty($mutualFriendIds)) {
            return [];
        }
        
        // Get the actual user records
        $query5 = new Query();
        return $query5->table('users')
            ->whereIn('id', $mutualFriendIds)
            ->where('status', '!=', 'bot')
            ->get();
    }
}
