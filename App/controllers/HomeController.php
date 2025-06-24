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

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->userRepository = new UserRepository();
    }
    
    public function redirectToApp()
    {
        $this->requireAuth();
        
        header('Location: /app/friends');
        exit;
    }
    
    public function index()
    {
        if (function_exists('logger')) {
            logger()->debug("HomeController index called", [
                'session_status' => session_status(),
                'user_id' => $_SESSION['user_id'] ?? 'not_set',
                'is_authenticated' => $this->isAuthenticated(),
                'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
            ]);
        }
        
        $this->requireAuth();

        
        if (strpos($_SERVER['REQUEST_URI'] ?? '', '/app/friends') === 0) {
            $GLOBALS['contentType'] = 'home';
            
            
            $tab = $_GET['tab'] ?? 'online';
            $GLOBALS['activeTab'] = in_array($tab, ['online', 'all', 'pending', 'blocked', 'add-friend']) 
                ? $tab : 'online';
                
            
            $this->loadFriendsData($this->getCurrentUserId());
        }

        $currentUserId = $this->getCurrentUserId();
        $this->logActivity('home_page_accessed');
        try {
            $userServers = $this->serverRepository->getForUser($currentUserId);
            $this->logActivity('servers_loaded', ['count' => count($userServers)]);

            $GLOBALS['userServers'] = $userServers;
            $GLOBALS['currentUser'] = [
                'id' => $currentUserId,
                'username' => $_SESSION['username'] ?? 'Unknown',
                'discriminator' => $_SESSION['discriminator'] ?? '0000',
                'avatar_url' => $_SESSION['avatar_url'] ?? null
            ];
            $GLOBALS['friends'] = [];
            $GLOBALS['onlineFriends'] = [];

            if (function_exists('logger')) {
                logger()->info("Home page data prepared successfully", [
                    'user_id' => $currentUserId,
                    'servers_count' => count($userServers)
                ]);
            }

            return [
                'userServers' => $userServers,
                'memberships' => [],
                'currentUserId' => $currentUserId,
                'friendData' => [
                    'currentUser' => $GLOBALS['currentUser'],
                    'friends' => [],
                    'onlineFriends' => []
                ]
            ];
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Home load error", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

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

    private function loadFriendsData($userId) {
        try {
            
            require_once __DIR__ . '/FriendController.php';
            $friendController = new FriendController();
            $friendData = $friendController->getUserFriends();
            
            
            $GLOBALS['currentUser'] = $friendData['currentUser'] ?? [];
            $GLOBALS['friends'] = $friendData['friends'] ?? [];
            $GLOBALS['onlineFriends'] = $friendData['onlineFriends'] ?? [];
            
            return $friendData;
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Error loading friends data", [
                    'error' => $e->getMessage(),
                    'user_id' => $userId
                ]);
            }
            
            
            $GLOBALS['friends'] = [];
            $GLOBALS['onlineFriends'] = [];
            
            return [
                'currentUser' => [],
                'friends' => [],
                'onlineFriends' => []
            ];
        }
    }
}
