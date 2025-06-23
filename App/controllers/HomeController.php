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
        // Redirect to the friends page when /app is accessed
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

        // Set the active tab for the friends page if we're on /app/friends
        if (strpos($_SERVER['REQUEST_URI'] ?? '', '/app/friends') === 0) {
            $GLOBALS['contentType'] = 'home';
            
            // Check if a specific tab is requested in the query string
            $tab = $_GET['tab'] ?? 'online';
            $GLOBALS['activeTab'] = in_array($tab, ['online', 'all', 'pending', 'blocked', 'add-friend']) 
                ? $tab : 'online';
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
}
