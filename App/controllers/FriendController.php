<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class FriendController extends BaseController
{    private $userRepository;
    private $friendListRepository;    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->friendListRepository = new FriendListRepository();
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

            $friends = $this->friendListRepository->getUserFriends($currentUserId);            $onlineFriends = [];
              foreach ($friends as &$friend) {
                // Set default offline status since socket functionality is removed
                $friend['status'] = 'offline';
                
                if ($friend['status'] !== 'offline') {
                    $onlineFriends[] = $friend;
                }
            }

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
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {            $friends = $this->friendListRepository->getUserFriends($userId);
              foreach ($friends as &$friend) {
                // Set default offline status and null activity since socket functionality is removed
                $friend['status'] = 'offline';
                $friend['activity'] = null;
                $friend['last_seen'] = null;
            }
            
            $this->logActivity('friends_viewed');
            
            return $this->success($friends, 'Friends retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving friends: ' . $e->getMessage());
        }
    }
    
    public function getOnlineFriends()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
          try {
            $friends = $this->friendListRepository->getUserFriends($userId);
            $onlineFriends = [];            
            foreach ($friends as $friend) {
                // Since socket functionality is removed, no users will be online
                // This will return an empty array
            }
            
            $this->logActivity('online_friends_viewed');
            
            return $this->success($onlineFriends, 'Online friends retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving online friends: ' . $e->getMessage());
        }
    }
    
    public function getSentRequests()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $sentRequests = $this->friendListRepository->getSentRequests($userId);
            
            $this->logActivity('sent_requests_viewed');
            
            return $this->success($sentRequests, 'Sent friend requests retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving sent requests: ' . $e->getMessage());
        }
    }
      public function sendFriendRequest()
    {
        try {
            $this->requireAuth();
            
            $userId = $this->getCurrentUserId();
            $input = $this->getInput();
            
            if (!isset($input['user_id']) && !isset($input['username'])) {
                return $this->error('Either user_id or username is required', 400);
            }
            
            $targetUserId = null;
            $targetUsername = null;
            
            if (isset($input['user_id'])) {
                $targetUserId = $input['user_id'];                $targetUser = $this->userRepository->find($targetUserId);
                if (!$targetUser) {
                    $this->error('User not found', 404);
                    return;
                }
                $targetUsername = $targetUser->username;            } else {
                $username = $input['username'];
                
                // Debug the input
                error_log("Debug: Searching for user: " . $username);
                
                // Support both username and username#discriminator formats
                if (strpos($username, '#') !== false) {
                    $parts = explode('#', $username, 2);
                    if (count($parts) === 2) {
                        $targetUser = $this->userRepository->findByUsernameAndDiscriminator(trim($parts[0]), trim($parts[1]));
                    } else {
                        return $this->error('Invalid username format', 400);
                    }
                } else {
                    $targetUser = $this->userRepository->findByUsername($username);
                }
                
                if (!$targetUser) {
                    return $this->error('User not found', 404);
                }
                
                $targetUserId = $targetUser->id;
                $targetUsername = $targetUser->username;
            }
              if ($targetUserId == $userId) {
                $this->error('You cannot send a friend request to yourself', 400);
                return;
            }
            
            $result = $this->friendListRepository->sendFriendRequest($userId, $targetUserId);
            
            if ($result === false) {
                $this->error('Failed to send friend request, the user may have blocked you', 400);
                return;
            }
            
            $currentUser = $this->userRepository->find($userId);
            
            $this->notifyViaSocket($targetUserId, 'friend-request-received', [
                'friendship_id' => $result->id,
                'sender_id' => $userId,
                'sender_username' => $currentUser->username,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $this->logActivity('friend_request_sent', [
                'target_user_id' => $targetUserId,
                'target_username' => $targetUsername
            ]);
              $this->success([
                'friendship_id' => $result->id,
                'target_user' => [
                    'id' => $targetUserId,
                    'username' => $targetUsername
                ]
            ], 'Friend request sent successfully');
        } catch (Exception $e) {
            $this->serverError('An error occurred while sending friend request: ' . $e->getMessage());
        }
    }
    
    public function acceptFriendRequest($friendshipId)
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $friendship = $this->friendListRepository->findFriendship($friendshipId);
            
            if (!$friendship) {
                return $this->notFound('Friend request not found');
            }
            
            if ($friendship->recipient_id != $userId) {
                return $this->forbidden('You cannot accept this friend request');
            }
            
            $result = $this->friendListRepository->acceptFriendRequest($userId, $friendshipId);
            
            if (!$result) {
                return $this->serverError('Failed to accept friend request');
            }
            
            $currentUser = $this->userRepository->find($userId);
            $senderUser = $this->userRepository->find($friendship->sender_id);
            
            $this->notifyViaSocket($friendship->sender_id, 'friend-request-accepted', [
                'friendship_id' => $friendshipId,
                'recipient_id' => $userId,
                'recipient_username' => $currentUser->username,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $this->logActivity('friend_request_accepted', [
                'friendship_id' => $friendshipId,
                'sender_id' => $friendship->sender_id,
                'sender_username' => $senderUser->username
            ]);
            
            return $this->success([
                'friendship_id' => $friendshipId,
                'friend' => [
                    'id' => $friendship->sender_id,
                    'username' => $senderUser->username
                ]
            ], 'Friend request accepted');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while accepting friend request: ' . $e->getMessage());
        }
    }
    
    public function declineFriendRequest($friendshipId)
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $friendship = $this->friendListRepository->findFriendship($friendshipId);
            
            if (!$friendship) {
                return $this->notFound('Friend request not found');
            }
            
            if ($friendship->recipient_id != $userId) {
                return $this->forbidden('You cannot decline this friend request');
            }
            
            $result = $this->friendListRepository->declineFriendRequest($userId, $friendshipId);
            
            if (!$result) {
                return $this->serverError('Failed to decline friend request');
            }
            
            $this->notifyViaSocket($friendship->sender_id, 'friend-request-declined', [
                'friendship_id' => $friendshipId,
                'recipient_id' => $userId,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $this->logActivity('friend_request_declined', [
                'friendship_id' => $friendshipId,
                'sender_id' => $friendship->sender_id
            ]);
            
            return $this->success(null, 'Friend request declined');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while declining friend request: ' . $e->getMessage());
        }
    }
    
    public function removeFriend()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['user_id'])) {
                return $this->error('User ID is required', 400);
            }
            
            $friendId = $input['user_id'];
            
            $friendship = $this->friendListRepository->findFriendshipBetweenUsers($userId, $friendId);
            
            if (!$friendship) {
                return $this->notFound('Friendship not found');
            }
            
            $result = $this->friendListRepository->removeFriend($userId, $friendId);
            
            if (!$result) {
                return $this->serverError('Failed to remove friend');
            }
            
            $this->notifyViaSocket($friendId, 'friend-removed', [
                'user_id' => $userId,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            $this->logActivity('friend_removed', [
                'friend_id' => $friendId
            ]);
            
            return $this->success(null, 'Friend removed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while removing friend: ' . $e->getMessage());
        }
    }
    
    public function blockUser()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['user_id'])) {
                return $this->error('User ID is required', 400);
            }
            
            $targetUserId = $input['user_id'];
            
            if ($targetUserId == $userId) {
                return $this->error('You cannot block yourself', 400);
            }
            
            $result = $this->friendListRepository->blockUser($userId, $targetUserId);
            
            if (!$result) {
                return $this->serverError('Failed to block user');
            }
            
            $this->logActivity('user_blocked', [
                'blocked_user_id' => $targetUserId
            ]);
            
            return $this->success(null, 'User blocked successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while blocking user: ' . $e->getMessage());
        }
    }
    
    public function unblockUser()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['user_id'])) {
                return $this->error('User ID is required', 400);
            }
            
            $targetUserId = $input['user_id'];
            $result = $this->friendListRepository->unblockUser($userId, $targetUserId);
            
            if (!$result) {
                return $this->serverError('Failed to unblock user');
            }
            
            $this->logActivity('user_unblocked', [
                'unblocked_user_id' => $targetUserId
            ]);
            
            return $this->success(null, 'User unblocked successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while unblocking user: ' . $e->getMessage());
        }
    }
    
    public function getBlockedUsers()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $blockedUsers = $this->friendListRepository->getBlockedUsers($userId);
            
            $this->logActivity('blocked_users_viewed');
            
            return $this->success($blockedUsers, 'Blocked users retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving blocked users: ' . $e->getMessage());
        }
    }
    
    public function findUsers()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['query']) || empty($input['query'])) {
                return $this->error('Search query is required', 400);
            }
            
            $query = $input['query'];
            $users = $this->userRepository->searchByUsername($query, $userId);
            
            $this->logActivity('users_searched', [
                'query' => $query,
                'result_count' => count($users)
            ]);
            
            return $this->success([
                'query' => $query,
                'users' => $users
            ], 'Users found successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while searching users: ' . $e->getMessage());
        }
    }

    public function getPendingRequestsCount()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $pendingRequests = $this->friendListRepository->getPendingRequests($userId);
            $count = count($pendingRequests);
            
            return $this->success([
                'count' => $count
            ], 'Pending friend requests count retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving pending requests count: ' . $e->getMessage());
        }
    }
}