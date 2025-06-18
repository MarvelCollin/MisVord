<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/../database/query.php';

class HomeController extends BaseController
{
    public function __construct() {
        parent::__construct();
    }

    public function index()
    {
        $this->requireAuth();

        $currentUserId = $this->getCurrentUserId();
        $this->logActivity('home_page_accessed');

        try {
            // Get user servers
            $userServers = Server::getFormattedServersForUser($currentUserId);
            $this->logActivity('servers_loaded', ['count' => count($userServers)]);

            // Get user server memberships
            $query = new Query();
            $memberships = $query->table('user_server_memberships')
                ->where('user_id', $currentUserId)
                ->get();
            $this->logActivity('memberships_loaded', ['count' => count($memberships)]);

            // Get friend data
            require_once __DIR__ . '/FriendController.php';
            $friendController = new FriendController();
            $friendData = $friendController->getUserFriends();

            // Set global variables for view
            $GLOBALS['userServers'] = $userServers;
            $GLOBALS['currentUser'] = $friendData['currentUser'];
            $GLOBALS['friends'] = $friendData['friends'];
            $GLOBALS['onlineFriends'] = $friendData['onlineFriends'];

            return [
                'userServers' => $userServers,
                'memberships' => $memberships,
                'currentUserId' => $currentUserId,
                'friendData' => $friendData
            ];
        } catch (Exception $e) {
            $this->logActivity('home_load_error', [
                'error' => $e->getMessage()
            ]);
            
            // Return minimal data on error
            $GLOBALS['userServers'] = [];
            $GLOBALS['currentUser'] = null;
            $GLOBALS['friends'] = [];
            $GLOBALS['onlineFriends'] = [];

            return [
                'userServers' => [],
                'memberships' => [],
                'currentUserId' => $currentUserId,
                'friendData' => [
                    'currentUser' => null,
                    'friends' => [],
                    'onlineFriends' => []
                ]
            ];
        }
    }
}
