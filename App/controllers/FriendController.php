<?php

require_once __DIR__ . '/../database/query.php';

class FriendController {
    
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    public function getUserFriends() {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $friends = [];
        $currentUser = null;
        
        try {
            $query = new Query();
            
            // Get current user details
            $currentUser = $query->table('users')
                ->where('id', $currentUserId)
                ->first();
                
            // Get user's friends where current user is user_id
            $friendsQuery = $query->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id2')
                ->where('fl.user_id', $currentUserId)
                ->where('fl.status', 'accepted');
                
            // Get user's friends where current user is user_id2
            $friendsQuery2 = $query->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id')
                ->where('fl.user_id2', $currentUserId)
                ->where('fl.status', 'accepted');
                
            $friends = array_merge($friendsQuery->get(), $friendsQuery2->get());
            
        } catch (Exception $e) {
            error_log("Error fetching user friends: " . $e->getMessage());
            $friends = [];
            $currentUser = ['id' => $currentUserId, 'username' => $_SESSION['username'] ?? 'Unknown'];
        }
        
        return [
            'currentUser' => $currentUser,
            'friends' => $friends,
            'onlineFriends' => array_filter($friends, function($friend) {
                return $friend['status'] === 'online';
            })
        ];
    }
    
    public function getFriendRequests() {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $pendingRequests = [];
        
        try {
            $query = new Query();
            
            // Get pending friend requests
            $pendingRequests = $query->table('friend_list fl')
                ->select('fl.*, u.username, u.avatar, u.status')
                ->join('users u', 'fl.user_id', '=', 'u.id')
                ->where('fl.user_id2', $currentUserId)
                ->where('fl.status', 'pending')
                ->get();
                
        } catch (Exception $e) {
            error_log("Error fetching friend requests: " . $e->getMessage());
            $pendingRequests = [];
        }
        
        return $pendingRequests;
    }
    
    public function sendFriendRequest($username) {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        
        try {
            $query = new Query();
            
            // Find user by username
            $user = $query->table('users')
                ->where('username', $username)
                ->first();
                
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }
            
            // Check if friend request already exists
            $existingRequest = $query->table('friend_list')
                ->where(function($q) use ($currentUserId, $user) {
                    $q->where('user_id', $currentUserId)
                      ->where('user_id2', $user['id']);
                })
                ->orWhere(function($q) use ($currentUserId, $user) {
                    $q->where('user_id', $user['id'])
                      ->where('user_id2', $currentUserId);
                })
                ->first();
                
            if ($existingRequest) {
                if ($existingRequest['status'] === 'accepted') {
                    return [
                        'success' => false,
                        'message' => 'Already friends'
                    ];
                } elseif ($existingRequest['status'] === 'pending') {
                    return [
                        'success' => false,
                        'message' => 'Friend request already sent'
                    ];
                }
            }
            
            // Create new friend request
            $query->table('friend_list')
                ->insert([
                    'user_id' => $currentUserId,
                    'user_id2' => $user['id'],
                    'status' => 'pending',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
            return [
                'success' => true,
                'message' => 'Friend request sent'
            ];
            
        } catch (Exception $e) {
            error_log("Error sending friend request: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to send friend request'
            ];
        }
    }
    
    public function respondToFriendRequest($requestId, $accept = true) {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        
        try {
            $query = new Query();
            
            // Find friend request
            $request = $query->table('friend_list')
                ->where('id', $requestId)
                ->where('user_id2', $currentUserId)
                ->where('status', 'pending')
                ->first();
                
            if (!$request) {
                return [
                    'success' => false,
                    'message' => 'Friend request not found'
                ];
            }
            
            if ($accept) {
                // Accept request
                $query->table('friend_list')
                    ->where('id', $requestId)
                    ->update([
                        'status' => 'accepted',
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                    
                return [
                    'success' => true,
                    'message' => 'Friend request accepted'
                ];
            } else {
                // Reject request
                $query->table('friend_list')
                    ->where('id', $requestId)
                    ->delete();
                    
                return [
                    'success' => true,
                    'message' => 'Friend request rejected'
                ];
            }
            
        } catch (Exception $e) {
            error_log("Error responding to friend request: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to process friend request'
            ];
        }
    }
} 