<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/FriendList.php';
require_once __DIR__ . '/../query.php';

class FriendListRepository extends Repository {
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
        
        // Delete the friend request record
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
        $query = "SELECT u.id, u.username, u.discriminator, u.avatar_url, u.status, u.created_at
                  FROM users u
                  JOIN friend_list f ON u.id = f.friend_id
                  WHERE f.user_id = :user_id AND f.status = 'blocked'
                  ORDER BY u.username ASC";
        
        $params = [':user_id' => $userId];
        
        return $this->db->fetchAll($query, $params);
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
    
    /**
     * Get the friendship status between two users
     * 
     * @param int $userId The current user's ID
     * @param int $otherUserId The other user's ID
     * @return string|null Friendship status: 'friends', 'pending_sent', 'pending_received', 'blocked', or null if no relationship
     */
    public function getFriendshipStatus($userId, $otherUserId)
    {
        // Check if there's a direct friendship (user is the initiator)
        $query = "SELECT status FROM friend_list 
                  WHERE user_id = :user_id AND friend_id = :friend_id 
                  LIMIT 1";
        
        $params = [
            ':user_id' => $userId,
            ':friend_id' => $otherUserId
        ];
        
        $result = $this->db->fetchOne($query, $params);
        
        if ($result) {
            if ($result->status === 'friends') {
                return 'friends';
            } elseif ($result->status === 'pending') {
                return 'pending_sent';
            } elseif ($result->status === 'blocked') {
                return 'blocked';
            }
        }
        
        // Check if there's a reverse friendship (other user is the initiator)
        $query = "SELECT status FROM friend_list 
                  WHERE user_id = :friend_id AND friend_id = :user_id 
                  LIMIT 1";
        
        $result = $this->db->fetchOne($query, $params);
        
        if ($result) {
            if ($result->status === 'friends') {
                return 'friends';
            } elseif ($result->status === 'pending') {
                return 'pending_received';
            } elseif ($result->status === 'blocked') {
                return 'blocked_by';
            }
        }
        
        // No relationship found
        return null;
    }
}
