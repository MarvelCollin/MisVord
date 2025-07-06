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

        header('Location: /home/friends');
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

        if (strpos($_SERVER['REQUEST_URI'] ?? '', '/home/friends') === 0) {
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

    public function getHomeContent() {
        $this->requireAuth();

        try {
            $currentUserId = $this->getCurrentUserId();

            $userServers = $this->serverRepository->getForUser($currentUserId);
            $GLOBALS['userServers'] = $userServers;

            $currentUri = $_SERVER['REQUEST_URI'] ?? '';
            $pageType = $this->getPageType($currentUri);
            $GLOBALS['contentType'] = 'home';

            switch ($pageType) {
                case 'friends':
                    $this->loadFriendsData($currentUserId);
                    $GLOBALS['activeTab'] = $_GET['tab'] ?? 'online';
                    break;
                case 'dm':
                    $this->loadDirectMessageData($currentUserId);
                    break;
                default:
                    $this->loadFriendsData($currentUserId);
                    $GLOBALS['activeTab'] = 'online';
                    break;
            }

            ob_start();
            include __DIR__ . '/../views/components/app-sections/home-main-content.php';
            $html = ob_get_clean();

            if ($this->isAjaxRequest()) {
                echo $html;
                exit;
            }

            return $html;
        } catch (Exception $e) {
            if ($this->isAjaxRequest()) {
                return $this->serverError('Failed to load home content');
            }
            throw $e;
        }
    }

    private function getPageType($uri) {
        if (strpos($uri, '/home/friends') === 0) {
            return 'friends';
        }
        if (strpos($uri, '/home/channels/dm/') === 0) {
            return 'dm';
        }
        return 'friends';
    }

    private function loadDirectMessageData($userId) {
        if (isset($_SESSION['active_dm']) && !empty($_SESSION['active_dm'])) {
            $activeDmId = $_SESSION['active_dm'];
            $GLOBALS['contentType'] = 'dm';
            $GLOBALS['chatType'] = 'direct';
            $GLOBALS['targetId'] = $activeDmId;

            require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
            $chatRoomRepository = new ChatRoomRepository();

            $chatRoom = $chatRoomRepository->find($activeDmId);
            if ($chatRoom) {
                $participants = $chatRoomRepository->getParticipants($activeDmId);
                $friend = null;

                foreach ($participants as $participant) {
                    if ($participant['user_id'] != $userId) {
                        $friend = [
                            'id' => $participant['user_id'],
                            'username' => $participant['username'],
                            'display_name' => $participant['display_name'] ?? $participant['username'],
                            'avatar_url' => $participant['avatar_url']
                        ];
                        break;
                    }
                }

                $chatData = [
                    'friend_username' => $friend['display_name'] ?? $friend['username'] ?? 'Unknown User',
                    'friend_id' => $friend['id'] ?? null,
                    'friend_avatar_url' => $friend['avatar_url'] ?? null
                ];

                $GLOBALS['chatData'] = $chatData;

                require_once __DIR__ . '/../database/repositories/ChatRoomMessageRepository.php';
                $chatRoomMessageRepository = new ChatRoomMessageRepository();
                $rawMessages = $chatRoomMessageRepository->getMessagesByRoomId($activeDmId, 20, 0);

                require_once __DIR__ . '/ChatController.php';
                $chatController = new ChatController();
                $formattedMessages = [];
                foreach ($rawMessages as $rawMessage) {
                    $reflection = new ReflectionClass($chatController);
                    $formatMethod = $reflection->getMethod('formatMessage');
                    $formatMethod->setAccessible(true);
                    $formattedMessages[] = $formatMethod->invoke($chatController, $rawMessage);
                }

                $GLOBALS['messages'] = $formattedMessages;
            }
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