<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/BaseController.php';

class FriendController extends BaseController
{

    private $userRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
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
}