<?php

require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class FriendController extends BaseController {

    public function __construct() {
        parent::__construct();
    }    public function getUserFriends() {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $friends = [];
        $currentUser = null;

        try {
            // Create separate query for current user
            $userQuery = new Query();
            $currentUser = $userQuery->table('users')
                ->where('id', $currentUserId)
                ->first();

            // Create separate query for friends (direction 1)
            $friendsQuery1 = new Query();
            $friends1 = $friendsQuery1->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id2')
                ->where('fl.user_id', $currentUserId)
                ->where('fl.status', 'accepted')
                ->get();

            // Create separate query for friends (direction 2)
            $friendsQuery2 = new Query();
            $friends2 = $friendsQuery2->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id')
                ->where('fl.user_id2', $currentUserId)
                ->where('fl.status', 'accepted')
                ->get();

            $friends = array_merge($friends1, $friends2);

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
    }    public function sendFriendRequest($username) {
        $currentUserId = $_SESSION['user_id'] ?? 0;

        if (!$currentUserId) {
            return $this->unauthorized('You must be logged in to send friend requests');
        }

        try {
            // Separate query for finding user
            $userQuery = new Query();
            $user = $userQuery->table('users')
                ->where('username', $username)
                ->first();

            if (!$user) {
                return $this->notFound('User not found');
            }

            // Separate query for checking existing request
            $existingQuery = new Query();
            $existingRequest = $existingQuery->table('friend_list')
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
                    return $this->validationError(['error' => 'Already friends']);
                } elseif ($existingRequest['status'] === 'pending') {
                    return $this->validationError(['error' => 'Friend request already sent']);
                }
            }

            // Separate query for inserting new request
            $insertQuery = new Query();
            $insertQuery->table('friend_list')
                ->insert([
                    'user_id' => $currentUserId,
                    'user_id2' => $user['id'],
                    'status' => 'pending'
                ]);

            return $this->successResponse([], 'Friend request sent');

        } catch (Exception $e) {
            error_log("Error sending friend request: " . $e->getMessage());
            return $this->serverError('Failed to send friend request');
        }
    }    public function respondToFriendRequest($requestId, $accept = true) {
        $currentUserId = $_SESSION['user_id'] ?? 0;

        if (!$currentUserId) {
            return $this->unauthorized('You must be logged in to respond to friend requests');
        }

        try {
            // Separate query to find the request
            $findQuery = new Query();
            $request = $findQuery->table('friend_list')
                ->where('id', $requestId)
                ->where('user_id2', $currentUserId)
                ->where('status', 'pending')
                ->first();

            if (!$request) {
                return $this->notFound('Friend request not found');
            }

            if ($accept) {
                // Separate query to update the request
                $updateQuery = new Query();
                $updateQuery->table('friend_list')
                    ->where('id', $requestId)
                    ->update([
                        'status' => 'accepted'
                    ]);

                return $this->successResponse([], 'Friend request accepted');
            } else {
                // Separate query to delete the request
                $deleteQuery = new Query();
                $deleteQuery->table('friend_list')
                    ->where('id', $requestId)
                    ->delete();

                return $this->successResponse([], 'Friend request rejected');
            }

        } catch (Exception $e) {
            error_log("Error responding to friend request: " . $e->getMessage());
            return $this->serverError('Failed to process friend request');
        }
    }
}