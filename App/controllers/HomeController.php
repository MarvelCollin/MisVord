<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';

class HomeController extends BaseController
{
    private $serverRepository;
    private $userServerMembershipRepository;
    private $userRepository;
    
    public function __construct() {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->userRepository = new UserRepository();
    }

    public function index()
    {
        $this->requireAuth();

        $currentUserId = $this->getCurrentUserId();
        $this->logActivity('home_page_accessed');        try {
            $userServers = $this->serverRepository->getForUser($currentUserId);
            $this->logActivity('servers_loaded', ['count' => count($userServers)]);

            $memberships = $this->userServerMembershipRepository->getServersForUser($currentUserId);
            $this->logActivity('memberships_loaded', ['count' => count($memberships)]);            require_once __DIR__ . '/FriendController.php';
            $friendController = new FriendController();
            $friendData = $friendController->getUserFriends();            $GLOBALS['userServers'] = $userServers;
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
                'error' => $e->getMessage()            ]);
            
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
