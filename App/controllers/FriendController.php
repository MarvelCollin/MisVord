<?php

require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/BaseController.php';

class FriendController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get user's friends list
     */
    public function index() {
        $this->requireAuth();

        try {
            // TODO: Implement proper friends relationship
            // For now, return empty array
            $friends = [];

            $this->logActivity('friends_viewed');

            return $this->success([
                'friends' => $friends,
                'total' => count($friends)
            ]);
        } catch (Exception $e) {
            $this->logActivity('friends_view_error', [
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load friends');
        }
    }

    /**
     * Send friend request
     */
    public function sendRequest() {
        $this->requireAuth();
        
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        $this->validate($input, ['username' => 'required']);
        
        $username = $input['username'];
        
        // Find target user
        $targetUser = User::findByUsername($username);
        if (!$targetUser) {
            return $this->notFound('User not found');
        }
        
        // Can't send request to yourself
        if ($targetUser->id == $this->getCurrentUserId()) {
            return $this->validationError(['username' => 'You cannot send a friend request to yourself']);
        }

        try {
            // TODO: Implement friend request system
            $this->logActivity('friend_request_sent', [
                'target_user_id' => $targetUser->id,
                'target_username' => $username
            ]);

            return $this->success([
                'target_user' => [
                    'id' => $targetUser->id,
                    'username' => $targetUser->username
                ]
            ], 'Friend request sent successfully');
        } catch (Exception $e) {
            $this->logActivity('friend_request_error', [
                'target_username' => $username,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to send friend request');
        }
    }

    /**
     * Accept friend request
     */
    public function acceptRequest($requestId) {
        $this->requireAuth();

        try {
            // TODO: Implement friend request acceptance
            $this->logActivity('friend_request_accepted', [
                'request_id' => $requestId
            ]);

            return $this->success(null, 'Friend request accepted');
        } catch (Exception $e) {
            $this->logActivity('friend_request_accept_error', [
                'request_id' => $requestId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to accept friend request');
        }
    }

    /**
     * Decline friend request
     */
    public function declineRequest($requestId) {
        $this->requireAuth();

        try {
            // TODO: Implement friend request decline
            $this->logActivity('friend_request_declined', [
                'request_id' => $requestId
            ]);

            return $this->success(null, 'Friend request declined');
        } catch (Exception $e) {
            $this->logActivity('friend_request_decline_error', [
                'request_id' => $requestId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to decline friend request');
        }
    }

    /**
     * Remove friend
     */
    public function remove($friendId) {
        $this->requireAuth();

        try {
            // TODO: Implement friend removal
            $this->logActivity('friend_removed', [
                'friend_id' => $friendId
            ]);

            return $this->success(null, 'Friend removed successfully');
        } catch (Exception $e) {
            $this->logActivity('friend_remove_error', [
                'friend_id' => $friendId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to remove friend');
        }
    }

    /**
     * Get pending friend requests
     */
    public function getPendingRequests() {
        $this->requireAuth();

        try {
            // TODO: Implement pending requests retrieval
            $requests = [];

            $this->logActivity('pending_requests_viewed');

            return $this->success([
                'requests' => $requests,
                'total' => count($requests)
            ]);
        } catch (Exception $e) {
            $this->logActivity('pending_requests_error', [
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load pending requests');
        }
    }

    /**
     * Search for users to add as friends
     */
    public function searchUsers() {
        $this->requireAuth();

        $query = $_GET['q'] ?? '';
        if (empty($query)) {
            return $this->validationError(['q' => 'Search query is required']);
        }

        try {
            // Simple user search implementation
            $queryBuilder = $this->query();
            $results = $queryBuilder->table('users')
                ->where('username', 'LIKE', "%{$query}%")
                ->where('id', '!=', $this->getCurrentUserId())
                ->limit(20)
                ->get();

            $users = [];
            foreach ($results as $result) {
                $users[] = [
                    'id' => $result['id'],
                    'username' => $result['username'],
                    'avatar_url' => $result['avatar_url'] ?? null
                ];
            }

            $this->logActivity('users_searched', [
                'query' => $query,
                'result_count' => count($users)
            ]);

            return $this->success([
                'query' => $query,
                'users' => $users
            ]);
        } catch (Exception $e) {
            $this->logActivity('user_search_error', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to search users');
        }
    }

    /**
     * Get user's friends data (for HomeController compatibility)
     */
    public function getUserFriends() {
        $this->requireAuth();

        try {
            $currentUserId = $this->getCurrentUserId();
            
            // Get current user data
            $currentUser = User::find($currentUserId);
            
            // TODO: Implement proper friends relationship
            // For now, return empty arrays
            $friends = [];
            $onlineFriends = [];

            $this->logActivity('friends_data_retrieved');            return [
                'currentUser' => $currentUser,
                'friends' => $friends,
                'onlineFriends' => $onlineFriends
            ];
        } catch (Exception $e) {
            $this->logActivity('friends_data_error', [
                'error' => $e->getMessage()
            ]);
            
            // Return empty data on error to prevent HomeController from breaking
            return [
                'currentUser' => null,
                'friends' => [],
                'onlineFriends' => []
            ];
        }
    }
}