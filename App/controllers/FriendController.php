<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';
require_once __DIR__ . '/../database/repositories/UserPresenceRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class FriendController extends BaseController
{

    private $userRepository;
    private $friendListRepository;
    private $userPresenceRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->friendListRepository = new FriendListRepository();
        $this->userPresenceRepository = new UserPresenceRepository();
    }

    public function index()
    {
        $this->requireAuth();

        try {

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

    public function sendRequest()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['username' => 'required']);
        $username = $input['username'];

        $targetUser = $this->userRepository->findByUsername($username);
        if (!$targetUser) {
            return $this->notFound('User not found');
        }

        if ($targetUser->id == $this->getCurrentUserId()) {
            return $this->validationError(['username' => 'You cannot send a friend request to yourself']);
        }

        try {

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

    public function acceptRequest($requestId)
    {
        $this->requireAuth();

        try {

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

    public function declineRequest($requestId)
    {
        $this->requireAuth();

        try {

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

    public function remove($friendId)
    {
        $this->requireAuth();

        try {

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

    public function getPendingRequests()
    {
        $this->requireAuth();

        try {

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

    public function searchUsers()
    {
        $this->requireAuth();

        $query = $_GET['q'] ?? '';
        if (empty($query)) {
            return $this->validationError(['q' => 'Search query is required']);
        }
        try {
            $users = $this->userRepository->searchByUsername($query, $this->getCurrentUserId(), 20);

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

    public function getUserFriends()
    {
        $this->requireAuth();
        try {
            $currentUserId = $this->getCurrentUserId();

            $currentUser = $this->userRepository->find($currentUserId);

            $friends = [];
            $onlineFriends = [];

            $this->logActivity('friends_data_retrieved');
            return [
                'currentUser' => $currentUser,
                'friends' => $friends,
                'onlineFriends' => $onlineFriends
            ];
        } catch (Exception $e) {
            $this->logActivity('friends_data_error', [
                'error' => $e->getMessage()
            ]);

            return [
                'currentUser' => null,
                'friends' => [],
                'onlineFriends' => []
            ];
        }
    }

    public function getFriends()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $friends = $this->friendListRepository->getUserFriends($userId);
        
        foreach ($friends as &$friend) {
            $presence = $this->userPresenceRepository->findByUserId($friend['id']);
            $friend['status'] = $presence ? $presence->status : 'offline';
            $friend['activity'] = $presence ? $presence->activity_details : null;
            $friend['last_seen'] = $presence ? $presence->last_seen : null;
        }
        
        return $this->json(['friends' => $friends]);
    }
    
    public function getOnlineFriends()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $onlineFriends = $this->userPresenceRepository->getOnlineFriends($userId);
        return $this->json(['online_friends' => $onlineFriends]);
    }
    
    public function getSentRequests()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $sentRequests = $this->friendListRepository->getSentRequests($userId);
        return $this->json(['sent_requests' => $sentRequests]);
    }
    
    public function sendFriendRequest()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['user_id']) && !isset($data['username'])) {
            return $this->json(['error' => 'Either user_id or username is required'], 400);
        }
        
        $targetUserId = null;
        
        if (isset($data['user_id'])) {
            $targetUserId = $data['user_id'];
        } else {
            $user = $this->userRepository->findByUsername($data['username']);
            
            if (!$user) {
                return $this->json(['error' => 'User not found'], 404);
            }
            
            $targetUserId = $user->id;
        }
        
        if ($targetUserId == $userId) {
            return $this->json(['error' => 'You cannot send a friend request to yourself'], 400);
        }
        
        $result = $this->friendListRepository->sendFriendRequest($userId, $targetUserId);
        
        if ($result === false) {
            return $this->json(['error' => 'Failed to send friend request, the user may have blocked you'], 400);
        }
        
        return $this->json(['message' => 'Friend request sent successfully']);
    }
    
    public function acceptFriendRequest($friendshipId)
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $result = $this->friendListRepository->acceptFriendRequest($userId, $friendshipId);
        
        if (!$result) {
            return $this->json(['error' => 'Failed to accept friend request'], 400);
        }
        
        return $this->json(['message' => 'Friend request accepted']);
    }
    
    public function declineFriendRequest($friendshipId)
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $result = $this->friendListRepository->declineFriendRequest($userId, $friendshipId);
        
        if (!$result) {
            return $this->json(['error' => 'Failed to decline friend request'], 400);
        }
        
        return $this->json(['message' => 'Friend request declined']);
    }
    
    public function removeFriend()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['friend_id'])) {
            return $this->json(['error' => 'Friend ID is required'], 400);
        }
        
        $friendId = $data['friend_id'];
        $result = $this->friendListRepository->removeFriend($userId, $friendId);
        
        if (!$result) {
            return $this->json(['error' => 'Failed to remove friend'], 400);
        }
        
        return $this->json(['message' => 'Friend removed successfully']);
    }
    
    public function blockUser()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['user_id'])) {
            return $this->json(['error' => 'User ID is required'], 400);
        }
        
        $targetUserId = $data['user_id'];
        
        if ($targetUserId == $userId) {
            return $this->json(['error' => 'You cannot block yourself'], 400);
        }
        
        $result = $this->friendListRepository->blockUser($userId, $targetUserId);
        
        if (!$result) {
            return $this->json(['error' => 'Failed to block user'], 500);
        }
        
        return $this->json(['message' => 'User blocked successfully']);
    }
    
    public function unblockUser()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['user_id'])) {
            return $this->json(['error' => 'User ID is required'], 400);
        }
        
        $targetUserId = $data['user_id'];
        $result = $this->friendListRepository->unblockUser($userId, $targetUserId);
        
        if (!$result) {
            return $this->json(['error' => 'Failed to unblock user'], 400);
        }
        
        return $this->json(['message' => 'User unblocked successfully']);
    }
    
    public function getBlockedUsers()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $blockedUsers = $this->friendListRepository->getBlockedUsers($userId);
        return $this->json(['blocked_users' => $blockedUsers]);
    }
    
    public function findUsers()
    {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['query']) || empty($data['query'])) {
            return $this->json(['error' => 'Search query is required'], 400);
        }
        
        $query = $data['query'];
        $users = $this->userRepository->searchByUsername($query, $userId);
        
        return $this->json(['users' => $users]);
    }
}