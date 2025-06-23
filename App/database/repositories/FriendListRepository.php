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
            if ($relationship->status === 'blocked') {
                return false;
            }
            
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
    
    public function blockUser($userId, $blockedUserId) {
        $relationship = $this->findRelationship($userId, $blockedUserId);
        
        if ($relationship) {
            if ($relationship->user_id === $userId && $relationship->user_id2 === $blockedUserId) {
                return $this->update($relationship->id, ['status' => 'blocked']);
            } else {
                $relationship->delete();
            }
        }
        
        return $this->create([
            'user_id' => $userId,
            'user_id2' => $blockedUserId,
            'status' => 'blocked'
        ]);
    }
    
    public function unblockUser($userId, $blockedUserId) {
        $query = new Query();
        return $query->table('friend_list')
            ->where('user_id', $userId)
            ->where('user_id2', $blockedUserId)
            ->where('status', 'blocked')
            ->delete();
    }
    
    public function removeFriend($userId, $friendId) {
        $relationship = $this->findRelationship($userId, $friendId);
        return $relationship ? $relationship->delete() : false;
    }
      public function getBlockedUsers($userId) {
        $query = new Query();
        return $query->raw("SELECT u.id, u.username, u.discriminator, u.avatar_url, u.status, u.created_at
                  FROM users u
                  JOIN friend_list f ON u.id = f.user_id2
                  WHERE f.user_id = ? AND f.status = 'blocked'
                  ORDER BY u.username ASC", [$userId]);
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
        $query = new Query();
        $result = $query->raw("SELECT status FROM friend_list 
                  WHERE user_id = ? AND user_id2 = ? 
                  LIMIT 1", [$userId, $otherUserId])->first();
        
        if ($result) {
            if ($result['status'] === 'accepted') {
                return 'friends';
            } elseif ($result['status'] === 'pending') {
                return 'pending_sent';
            } elseif ($result['status'] === 'blocked') {
                return 'blocked';
            }
        }
        
        $result = $query->raw("SELECT status FROM friend_list 
                  WHERE user_id = ? AND user_id2 = ? 
                  LIMIT 1", [$otherUserId, $userId])->first();
        
        if ($result) {
            if ($result['status'] === 'accepted') {
                return 'friends';
            } elseif ($result['status'] === 'pending') {
                return 'pending_received';
            } elseif ($result['status'] === 'blocked') {
                return 'blocked_by';
            }
        }
        
        return null;
    }
}
