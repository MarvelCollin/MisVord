<?php

require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';
require_once __DIR__ . '/../controllers/ChannelController.php';
require_once __DIR__ . '/../controllers/MessageController.php';
require_once __DIR__ . '/../controllers/ChatController.php';
require_once __DIR__ . '/../controllers/GoogleAuthController.php';
require_once __DIR__ . '/../controllers/FriendController.php';
require_once __DIR__ . '/../controllers/NitroController.php';
require_once __DIR__ . '/../controllers/HealthController.php';
require_once __DIR__ . '/../controllers/HomeController.php';
require_once __DIR__ . '/../controllers/ExploreController.php';
require_once __DIR__ . '/../controllers/SettingsController.php';
require_once __DIR__ . '/../controllers/MediaController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/BotController.php';
require_once __DIR__ . '/../controllers/DebugController.php';
require_once __DIR__ . '/env.php';



class Route {
    private static $routes = [];

    public static function add($pattern, $handler, $method = 'GET') {
        self::$routes[$method . ':' . $pattern] = $handler;
    }

    public static function get($pattern, $handler) {
        self::add($pattern, $handler, 'GET');
    }

    public static function post($pattern, $handler) {
        self::add($pattern, $handler, 'POST');
    }

    public static function put($pattern, $handler) {
        self::add($pattern, $handler, 'PUT');
    }
    
    public static function delete($pattern, $handler) {
        self::add($pattern, $handler, 'DELETE');
    }

    public static function getRoutes() {
        return self::$routes;
    }
}

Route::get('/', 'pages/landing-page.php');
Route::get('/home', 'pages/home.php');
Route::get('/app', function() {
    header('Location: /home');
    exit;
});
Route::get('/home/friends', 'pages/home.php');
Route::get('/home/channels/dm/([0-9]+)', 'pages/home.php');

Route::get('/home/content', function() {
    require_once __DIR__ . '/../controllers/HomeController.php';
    $controller = new HomeController();
    $controller->getHomeContent();
});
Route::post('/home/content', function() {
    require_once __DIR__ . '/../controllers/HomeController.php';
    $controller = new HomeController();
    $controller->getHomeContent();
});

Route::get('/login', function() {
    $controller = new AuthenticationController();
    $controller->showLogin();
});
Route::get('/register', function() {
    $controller = new AuthenticationController();
    $controller->showRegister();
});
Route::get('/explore', function() {
    header('Location: /explore-servers');
    exit;
});
Route::get('/explore-servers', 'pages/explore-servers.php');
Route::get('/settings', 'pages/settings.php');
Route::get('/settings/user', function() {
    $controller = new UserController();
    $controller->settings();
});
Route::get('/settings-server', 'pages/settings-server.php');
Route::get('/call', 'pages/call.php');
Route::get('/dev', 'pages/dev.php');
Route::get('/forgot-password', function() {
    $controller = new AuthenticationController();
    $controller->showForgotPassword();
});
Route::get('/security-verify', function() {
    if (!headers_sent()) {
        header('Location: /forgot-password');
    }
    exit;
});
Route::get('/reset-password', function() {
    $controller = new AuthenticationController();
    $controller->showResetPassword();
});
Route::get('/set-security-question', function() {
    $controller = new AuthenticationController();
    $controller->showSecurityQuestion();
});
Route::get('/nitro', function() {
    $controller = new NitroController();
    $controller->index();
});
Route::get('/test-ajax-server', function() {
    require_once __DIR__ . '/../public/test-ajax-server.php';
});
Route::get('/404', 'pages/404.php');

Route::post('/login', function() {
    $controller = new AuthenticationController();
    $controller->login();
});

Route::get('/google', function() {
    $controller = new GoogleAuthController();
    $controller->callback();
});

Route::get('/auth/google', function() {
    $controller = new GoogleAuthController();
    $controller->redirectToGoogle();
});

Route::post('/register', function() {
    $controller = new AuthenticationController();
    $controller->register();
});

Route::post('/forgot-password', function() {
    $controller = new AuthenticationController();
    $controller->forgotPassword();
});

Route::post('/verify-security-question', function() {
    $controller = new AuthenticationController();
    $controller->verifySecurityQuestion();
});

Route::post('/reset-password', function() {
    $controller = new AuthenticationController();
    $controller->resetPassword();
});

Route::post('/set-security-question', function() {
    $controller = new AuthenticationController();
    $controller->setSecurityQuestion();
});

Route::get('/logout', function() {
    $controller = new AuthenticationController();
    $controller->logout();
});

Route::get('/api/videosdk/token', function() {
    $controller = new AuthenticationController();
    $controller->generateVideoSDKToken();
});

Route::get('/server/([0-9]+)', function($id) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->show($id);
});

Route::get('/servers/([0-9]+)', function($id) {
    $channel = $_GET['channel'] ?? null;
    $redirectUrl = "/server/{$id}";
    if ($channel) {
        $redirectUrl .= "?channel={$channel}";
    }
    header("Location: {$redirectUrl}", true, 301);
    exit;
});

Route::get('/join/([a-zA-Z0-9]+)', function($code) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->showInvite($code);
});

Route::post('/api/servers/explore', function() {
    $controller = new ExploreController();
    

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        return;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true);
        

        $page = isset($input['page']) ? max(1, intval($input['page'])) : 1;
        $perPage = isset($input['per_page']) ? min(6, max(3, intval($input['per_page']))) : 6;
        $sort = isset($input['sort']) ? $input['sort'] : 'alphabetical';
        $category = isset($input['category']) ? trim($input['category']) : '';
        $search = isset($input['search']) ? trim($input['search']) : '';
        
        $result = $controller->getPaginatedServers($page, $perPage, $sort, $category, $search);
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'servers' => $result['servers'],
            'has_more' => $result['has_more'],
            'total' => $result['total'],
            'page' => $page,
            'per_page' => $perPage
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false, 
            'message' => 'Server error: ' . $e->getMessage()
        ]);
    }
});
Route::get('/api/servers/join/([a-zA-Z0-9]+)', function($code) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->join($code);
});

Route::post('/api/servers/join/([a-zA-Z0-9]+)', function($code) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->join($code);
});

Route::post('/api/servers/join', function() {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->joinServerById();
});

Route::get('/api/servers/([0-9]+)/channels', function($serverId) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->getServerChannels($serverId);
});

Route::get('/api/debug/servers/([0-9]+)/channels', function($serverId) {
    header('Content-Type: application/json');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    try {
        require_once __DIR__ . '/../controllers/ServerController.php';
        require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
        require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
        require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
        
        $channelRepo = new ChannelRepository();
        $categoryRepo = new CategoryRepository();
        $membershipRepo = new UserServerMembershipRepository();
        
        $debug = [
            'server_id' => $serverId,
            'session_data' => [
                'user_id' => $_SESSION['user_id'] ?? 'NOT_SET',
                'username' => $_SESSION['username'] ?? 'NOT_SET',
                'session_id' => session_id()
            ],
            'repositories_test' => [
                'channel_repo_exists' => class_exists('ChannelRepository'),
                'category_repo_exists' => class_exists('CategoryRepository'),
                'membership_repo_exists' => class_exists('UserServerMembershipRepository')
            ]
        ];
        
        if (isset($_SESSION['user_id'])) {
            $isMember = $membershipRepo->isMember($_SESSION['user_id'], $serverId);
            $debug['membership_check'] = [
                'is_member' => $isMember,
                'user_id' => $_SESSION['user_id'],
                'server_id' => $serverId
            ];
            
            if ($isMember) {
                $channels = $channelRepo->getByServerId($serverId);
                $categories = $categoryRepo->getForServer($serverId);
                
                $debug['data_results'] = [
                    'channels_count' => count($channels),
                    'categories_count' => count($categories),
                    'channels_sample' => array_slice($channels, 0, 2),
                    'categories_sample' => array_slice($categories, 0, 2)
                ];
            }
        }
        
        echo json_encode($debug, JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    exit;
});

Route::post('/api/servers/create', function() {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    return $controller->create();
});

Route::post('/servers/create', function() {
    header('Location: /api/servers/create', true, 301);
    exit;
});

Route::post('/api/channels', function() {
    $controller = new ChannelController();
    $controller->create();
});

Route::post('/api/channels/category', function() {
    $controller = new ChannelController();
    $controller->createCategory();
});

Route::post('/api/categories', function() {
    $controller = new ChannelController();
    $controller->createCategory();
});

Route::post('/api/categories/create', function() {
    $controller = new ChannelController();
    $controller->createCategory();
});

Route::get('/api/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $controller->show($channelId);
});

Route::get('/api/socket/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $controller->getChannelWithServerForSocket($channelId);
});

Route::get('/api/socket/channels/([0-9]+)/users-by-role', function($channelId) {
    $controller = new ChannelController();
    $controller->getUsersByRole($channelId);
});

Route::get('/api/channels/([0-9]+)/switch', function($channelId) {
    $controller = new ChannelController();
    $_GET['channel_id'] = $channelId;
    $controller->switchToChannel();
});

Route::post('/api/channels/([0-9]+)/switch', function($channelId) {
    $controller = new ChannelController();
    $_POST['channel_id'] = $channelId;
    $controller->switchToChannel();
});

Route::put('/api/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $_POST['channel_id'] = $channelId;
    foreach ($input as $key => $value) {
        $_POST[$key] = $value;
    }
    $controller->update();
});

Route::put('/api/channels/([0-9]+)/position', function($channelId) {
    $controller = new ChannelController();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $_POST['channel_id'] = $channelId;
    if (isset($input['position'])) {
        $_POST['position'] = $input['position'];
    }
    $controller->updatePosition();
});

Route::delete('/api/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $_POST['channel_id'] = $channelId;
    $controller->delete();
});

Route::get('/api/channels/([0-9]+)/participants', function($channelId) {
    $controller = new ChannelController();
    $controller->getChannelParticipants($channelId);
});

Route::get('/api/channels/([0-9]+)/members', function($channelId) {
    $controller = new ChannelController();
    $controller->getMembers($channelId);
});

Route::get('/api/chat/dm/([0-9]+)/participants', function($roomId) {
    $controller = new ChatController();
    $controller->getDMParticipants($roomId);
});

Route::get('/api/servers/([0-9]+)', function($serverId) {
    $controller = new ServerController();
    $controller->getServerDetails($serverId);
});

Route::get('/api/servers/([0-9]+)/details', function($serverId) {
    $controller = new ServerController();
    $controller->getServerBundle($serverId);
});

Route::get('/api/servers/([0-9]+)/search', function($serverId) {
    $controller = new ChatController();
    $controller->searchServerMessages($serverId);
});

Route::get('/api/user/servers', function() {
    $controller = new ServerController();
    $controller->getUserServersData();
});

Route::post('/api/servers/([0-9]+)/invite', function($serverId) {
    $controller = new ServerController();
    $controller->generateInviteLink($serverId);
});

Route::get('/api/servers/([0-9]+)/invite', function($serverId) {
    $controller = new ServerController();
    $controller->getExistingInvite($serverId);
});

Route::get('/api/servers/([0-9]+)/membership', function($serverId) {
    $controller = new ServerController();
    $controller->getUserServerMembership($serverId);
});

Route::get('/api/servers/([0-9]+)/debug-membership', function($serverId) {
    $controller = new ServerController();
    $controller->debugMembership($serverId);
});

Route::get('/debug/messages', function() {
    $controller = new MessageController();
    $controller->debugMessageStorage();
});

Route::get('/health', function() {
    $controller = new HealthController();
    $controller->check();
});

Route::get('/health/socket', function() {
    $controller = new HealthController();
    $controller->socketStatus();
});

Route::get('/debug/logs', function() {
    if (EnvLoader::get('APP_ENV') === 'production') {
        http_response_code(404);
        echo "Not found";
        return;
    }
    
    require_once __DIR__ . '/../public/debug-logs.html';
    exit;
});

Route::get('/api/friends', function() {
    $controller = new FriendController();
    $controller->getFriends();
});

Route::get('/api/friends/online', function() {
    $controller = new FriendController();
    $controller->getOnlineFriends();
});

Route::get('/api/friends/pending', function() {
    $controller = new FriendController();
    $controller->getPendingRequests();
});

Route::get('/api/friends/sent', function() {
    $controller = new FriendController();
    $controller->getSentRequests();
});

Route::get('/api/friends/pending/count', function() {
    $controller = new FriendController();
    $controller->getPendingRequestsCount();
});

Route::post('/api/friends', function() {
    $controller = new FriendController();
    $controller->sendFriendRequest();
});

Route::post('/api/friends/accept', function() {
    $controller = new FriendController();
    $controller->acceptFriendRequest($_GET['id'] ?? null);
});

Route::post('/api/friends/decline', function() {
    $controller = new FriendController();
    $controller->declineFriendRequest($_GET['id'] ?? null);
});

Route::delete('/api/friends', function() {
    $controller = new FriendController();
    $controller->removeFriend();
});



Route::get('/api/users/([0-9]+)/mutual', function($userId) {
    $controller = new UserController();
    $controller->getMutualRelations($userId);
});

Route::get('/api/users/search', function() {
    $controller = new UserController();
    $controller->findUsers();
});

Route::post('/api/users/find', function() {
    $controller = new FriendController();
    $controller->findUsers();
});

Route::get('/api/users/all', function() {
    $controller = new UserController();
    $controller->getAllUsers();
});

Route::post('/api/users/bulk-nitro-status', function() {
    $controller = new UserController();
    $controller->getBulkNitroStatus();
});

Route::get('/api/users/([0-9]+)/profile', function($userId) {
    $controller = new UserController();
    $controller->getUserProfile($userId);
});

Route::get('/api/user/([0-9]+)/avatar', function($userId) {
    $controller = new UserController();
    $controller->getUserAvatar($userId);
});

Route::post('/api/users/profile', function() {
    $controller = new UserController();
    $controller->updateUserProfile();
});

Route::get('/api/users/owned-servers', function() {
    $controller = new UserController();
    $controller->getUserOwnedServers();
});

Route::get('/api/chat/(channel|dm)/([0-9]+)/messages', function($type, $id) {
    $controller = new ChatController();
    $controller->getMessages($type, $id);
});

Route::post('/api/chat/send', function() {
    $controller = new ChatController();
    $controller->sendMessage();
});

Route::post('/api/chat/channel/([0-9]+)/messages', function($channelId) {
    $controller = new ChatController();
    $controller->sendMessageToTarget('channel', $channelId);
});

Route::post('/api/chat/dm/([0-9]+)/messages', function($roomId) {
    $controller = new ChatController();
    $controller->sendMessageToTarget('dm', $roomId);
});

Route::post('/api/chat/(channel|dm)/([0-9]+)/messages', function($type, $id) {
    $controller = new ChatController();
    $controller->sendMessageToTarget($type, $id);
});

Route::get('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new MessageController();
    $controller->getReactions($messageId);
});

Route::post('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new MessageController();
    $controller->addReaction($messageId);
});

Route::delete('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new MessageController();
    $controller->removeReaction($messageId);
});

Route::get('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->getMessage($messageId);
});

Route::post('/api/messages/([0-9]+)/pin', function($messageId) {
    $controller = new MessageController();
    $controller->pinMessage($messageId);
});

Route::put('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->updateMessage($messageId);
});

Route::delete('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->deleteMessage($messageId);
});

Route::post('/api/messages/render-bubble', function() {
    $controller = new MessageController();
    $controller->renderBubbleMessage();
});

Route::get('/api/chat/render/(channel|dm|direct)/([0-9]+)', function($chatType, $chatId) {
    $controller = new ChatController();
    $controller->renderChatSection($chatType, $chatId);
});

Route::get('/api/auth/check', function() {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'authenticated' => isset($_SESSION['user_id']) && !empty($_SESSION['user_id']),
        'user_id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? null,
        'session_info' => [
            'id' => session_id(),
            'status' => session_status()
        ]
    ]);
    exit;
});





Route::post('/api/servers/([0-9]+)/settings', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerSettings($serverId);
});

Route::post('/api/servers/([0-9]+)/update', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerField($serverId);
});

Route::post('/api/servers/([0-9]+)/update/name', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerName($serverId);
});

Route::post('/api/servers/([0-9]+)/update/description', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerDescription($serverId);
});

Route::post('/api/servers/([0-9]+)/update/public', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerPublic($serverId);
});

Route::post('/api/servers/([0-9]+)/update/category', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerCategory($serverId);
});

Route::post('/api/servers/([0-9]+)/update/icon', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerIcon($serverId);
});

Route::post('/api/servers/([0-9]+)/update/banner', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerBanner($serverId);
});

Route::get('/api/servers/([0-9]+)/members', function($serverId) {
    $controller = new ServerController();
    $controller->getServerMembers($serverId);   
});

Route::post('/api/servers/([0-9]+)/members/([0-9]+)/promote', function($serverId, $userId) {
    $controller = new ServerController();
    $controller->promoteMember($serverId, $userId);
});

Route::post('/api/servers/([0-9]+)/members/([0-9]+)/demote', function($serverId, $userId) {
    $controller = new ServerController();
    $controller->demoteMember($serverId, $userId);
});

Route::post('/api/servers/([0-9]+)/members/([0-9]+)/kick', function($serverId, $userId) {
    $controller = new ServerController();
    $controller->kickMember($serverId, $userId);
});

Route::get('/api/debug/servers/list', function() {
    header('Content-Type: application/json');
    
    try {
        session_start();
        $_SESSION['user_id'] = $_SESSION['user_id'] ?? 1;
        
        require_once __DIR__ . '/../database/repositories/ServerRepository.php';
        require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
        
        $serverRepo = new ServerRepository();
        $membershipRepo = new UserServerMembershipRepository();
        
        $allServers = $serverRepo->getAll();
        $userServers = $serverRepo->getForUser($_SESSION['user_id']);
        
        echo json_encode([
            'success' => true,
            'debug_info' => [
                'user_id' => $_SESSION['user_id'],
                'total_servers' => count($allServers),
                'user_servers' => count($userServers)
            ],
            'all_servers' => array_map(function($server) {
                return [
                    'id' => $server->id ?? $server['id'],
                    'name' => $server->name ?? $server['name'],
                    'owner_id' => $server->owner_id ?? $server['owner_id']
                ];
            }, $allServers),
            'user_servers' => array_map(function($server) {
                return [
                    'id' => $server->id ?? $server['id'],
                    'name' => $server->name ?? $server['name']
                ];
            }, $userServers)
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    exit;
});





Route::get('/api/users/([0-9]+)', function($userId) {
    $controller = new UserController();
    $controller->getUserData($userId);
});




Route::post('/user/avatar/update', function() {
    $controller = new UserController();
    $controller->updateAvatar();
});

Route::post('/user/avatar/remove', function() {
    $controller = new UserController();
    $controller->removeAvatar();
});


Route::post('/user/banner/update', function() {
    $controller = new UserController();
    $controller->updateBanner();
});

Route::post('/user/banner/remove', function() {
    $controller = new UserController();
    $controller->removeBanner();
});


Route::post('/user/status', function() {
    $controller = new UserController();
    $controller->updateStatus();
});

Route::post('/api/users/fix-bot-status', function() {
    $controller = new UserController();
    $controller->fixBotStatus();
});

Route::get('/api/user/security-question', function() {
    $controller = new UserController();
    $controller->getCurrentUserSecurityQuestion();
});



Route::post('/api/user/verify-security-answer', function() {
    $controller = new UserController();
    $controller->verifyCurrentUserSecurityAnswer();
});

Route::post('/api/user/set-security-question', function() {
    $controller = new UserController();
    $controller->setSecurityQuestion();
});

Route::post('/api/user/change-password-security', function() {
    $controller = new UserController();
    $controller->changePasswordWithSecurityAnswer();
});

Route::delete('/api/user/account', function() {
    $controller = new UserController();
    $controller->deleteAccount();
});

Route::get('/api/servers/invite/([a-zA-Z0-9]+)', function($code) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->checkInviteValidity($code);
});

Route::get('/admin', function() {
    $controller = new AdminController();
    $controller->index();
});

Route::get('/api/admin/stats', function() {
    $controller = new AdminController();
    return $controller->getSystemStats();
});

Route::get('/api/admin/users', function() {
    $controller = new AdminController();
    return $controller->getUsers();
});

Route::get('/api/admin/users/search', function() {
    (new AdminController())->searchUsers();
});

Route::get('/api/admin/users/([0-9]+)', function($id) {
    $controller = new AdminController();
    return $controller->getUser($id);
});

Route::put('/api/admin/users/([0-9]+)', function($id) {
    $controller = new AdminController();
    return $controller->updateUser($id);
});

Route::post('/api/admin/users/([0-9]+)/toggle-ban', function($id) {
    $controller = new AdminController();
    return $controller->toggleUserBan($id);
});

Route::delete('/api/admin/users/([0-9]+)', function($id) {
    $controller = new AdminController();
    return $controller->deleteUser($id);
});

Route::get('/api/admin/servers', function() {
    $controller = new AdminController();
    return $controller->getServers();
});

Route::get('/api/admin/servers/search', function() {
    $controller = new AdminController();
    return $controller->searchServers();
});

Route::get('/api/admin/servers/stats', function() {
    $controller = new AdminController();
    return $controller->getServerStats();
});

Route::get('/api/admin/servers/list', function() {
    $controller = new AdminController();
    return $controller->getServers();
});

Route::get('/api/admin/servers/([0-9]+)', function($id) {
    $controller = new AdminController();
    return $controller->getServerDetails($id);
});

Route::delete('/api/admin/servers/([0-9]+)', function($id) {
    $controller = new AdminController();
    return $controller->deleteServer($id);
});

Route::get('/api/admin/logs', function() {
    $controller = new AdminController();
    return $controller->getLogs();
});

Route::get('/api/admin/users/stats', function() {
    $controller = new AdminController();
    return $controller->getUserStats();
});

Route::get('/api/admin/nitro/list', function() {
    $controller = new NitroController();
    $controller->listCodes();
});

Route::get('/api/admin/nitro/stats', function() {
    (new AdminController())->getNitroStats();
});

Route::post('/api/admin/nitro/generate', function() {
    $controller = new NitroController();
    $controller->generate();
});

Route::delete('/api/admin/nitro/delete/([0-9]+)', function($id) {
    $controller = new NitroController();
    $controller->delete($id);
});

Route::post('/api/admin/nitro/redeem', function() {
    $controller = new NitroController();
    $controller->redeem();
});

Route::post('/api/nitro/redeem', function() {
    $controller = new NitroController();
    $controller->redeem();
});

Route::post('/api/nitro/claim-instant', function() {
    $controller = new NitroController();
    $controller->claimInstant();
});

Route::get('/api/nitro/status', function() {
    $controller = new NitroController();
    $controller->getUserNitroStatus();
});

Route::get('/api/nitro/test', function() {
    $controller = new NitroController();
    $controller->test();
});

Route::get('/api/nitro/debug', function() {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Nitro API endpoint is working',
        'session' => [
            'authenticated' => isset($_SESSION['user_id']),
            'user_id' => $_SESSION['user_id'] ?? null,
            'session_id' => session_id()
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
});

Route::get('/api/debug/reactions', function() {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../database/models/MessageReaction.php';
        
        $connectionTest = MessageReaction::testConnection();
        $schemaInfo = MessageReaction::getTableSchema();
        
        echo json_encode([
            'success' => true,
            'test_results' => [
                'connection' => $connectionTest,
                'schema' => $schemaInfo
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    
    exit;
});

Route::post('/api/nitro/create-test-codes', function() {
    $controller = new NitroController();
    $controller->createTestCodes();
});

Route::get('/api/admin/stats/users/growth', function() {
    $controller = new AdminController();
    return $controller->getUserGrowthStats();
});

Route::get('/api/admin/stats/messages/activity', function() {
    $controller = new AdminController();
    return $controller->getMessageActivityStats();
});

Route::get('/api/admin/stats/servers/growth', function() {
    $controller = new AdminController();
    return $controller->getServerGrowthStats();
});



Route::get('/api/health/ping', function() {
    $controller = new HealthController();
    $controller->ping();
});

Route::get('/api/health/info', function() {
    $controller = new HealthController();
    $controller->getNetworkInfo();
});

Route::get('/api/health/network-info', function() {
    $controller = new HealthController();
    $controller->getNetworkInfo();
});

Route::delete('/api/servers', function() {
    $controller = new ServerController();
    $controller->delete();
});

Route::get('/api/bots', function() {
    $controller = new BotController();
    $controller->list();
});

Route::post('/api/bots/create', function() {
    $controller = new BotController();
    $controller->create();
});

Route::get('/api/bots/check/([^/]+)', function($username) {
    $controller = new BotController();
    $controller->check($username);
});

Route::get('/api/bots/public-check/([^/]+)', function($username) {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        $userRepository = new UserRepository();
        
        $user = $userRepository->findByUsername($username);
        
        if (!$user) {
            echo json_encode([
                'success' => true,
                'exists' => false,
                'is_bot' => false,
                'message' => 'Bot does not exist'
            ]);
            return;
        }
        
        $isBot = $user->status === 'bot';
        
        if (!$isBot) {
            echo json_encode([
                'success' => true,
                'exists' => true,
                'is_bot' => false,
                'message' => 'User exists but is not a bot'
            ]);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'exists' => true,
            'is_bot' => true,
            'bot' => [
                'id' => $user->id,
                'username' => $user->username,
                'discriminator' => $user->discriminator,
                'status' => $user->status,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'An error occurred while checking bot: ' . $e->getMessage()
        ]);
    }
});

Route::post('/api/bots/add-to-server', function() {
    $controller = new BotController();
    $controller->addToServer();
});

Route::get('/api/debug/bot-detection', function() {
    $controller = new DebugController();
    $controller->botDebug();
});

Route::get('/api/debug/bot-system-status', function() {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        $userRepository = new UserRepository();
        
        $titiBot = $userRepository->findByUsername('titibot');
        
        $response = [
            'success' => true,
            'timestamp' => date('Y-m-d H:i:s'),
            'titibot_check' => [
                'exists' => !!$titiBot,
                'is_bot' => $titiBot ? ($titiBot->status === 'bot') : false,
                'bot_data' => $titiBot ? [
                    'id' => $titiBot->id,
                    'username' => $titiBot->username,
                    'status' => $titiBot->status,
                    'email' => $titiBot->email,
                    'created_at' => $titiBot->created_at
                ] : null
            ],
            'database_status' => 'connected',
            'socket_endpoints' => [
                'bot_init' => '/api/debug/test-bot-init',
                'message_intercept' => '/api/debug/test-message-intercept'
            ]
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
});

Route::post('/api/debug/create-titibot', function() {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        $userRepository = new UserRepository();
        
        $existingBot = $userRepository->findByUsername('titibot');
        if ($existingBot) {
            echo json_encode([
                'success' => true,
                'message' => 'TitiBot already exists',
                'bot_id' => $existingBot->id,
                'status' => $existingBot->status
            ]);
            return;
        }
        
        $botData = [
            'username' => 'titibot',
            'email' => 'titibot@system.local',
            'password' => password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT),
            'discriminator' => '0000',
            'display_name' => 'TitiBot',
            'bio' => 'Official music and fun bot',
            'status' => 'bot',
            'avatar_url' => '/public/assets/common/default-profile-picture.png'
        ];
        
        $bot = $userRepository->createBot($botData);
        
        if ($bot) {
            echo json_encode([
                'success' => true,
                'message' => 'TitiBot created successfully',
                'bot_data' => [
                    'id' => $bot->id,
                    'username' => $bot->username,
                    'status' => $bot->status,
                    'created_at' => $bot->created_at
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to create TitiBot'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
});

Route::post('/api/bots/remove-from-server', function() {
    $controller = new BotController();
    $controller->removeFromServer();
});

Route::delete('/api/bots/([0-9]+)', function($botId) {
    $controller = new BotController();
    $controller->delete($botId);
});

Route::post('/api/bots/send-channel-message', function() {
    $controller = new BotController();
    $controller->sendChannelMessage();
});

Route::post('/api/media/upload', function() {
    $controller = new MediaController();
    $controller->uploadMedia();
});

Route::post('/api/media/upload-multiple', function() {
    $controller = new MediaController();
    $controller->uploadMultipleMedia();
});

Route::get('/api/media/gifs', function() {
    $controller = new MediaController();
    $controller->getGifs();
});

Route::get('/storage/(.+)', function($filename) {
    if (getenv('IS_DOCKER') === 'true') {
        $filePath = "/tmp/storage/{$filename}";
    } else {
        $filePath = __DIR__ . "/../public/storage/{$filename}";
    }
    
    if (file_exists($filePath)) {
        $mimeType = mime_content_type($filePath);
        header("Content-Type: {$mimeType}");
        header("Content-Length: " . filesize($filePath));
        readfile($filePath);
        exit;
    }
    
    http_response_code(404);
    echo "File not found";
    exit;
});

Route::get('/api/debug/controller-security', function() {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../controllers/UserController.php';
        $controller = new UserController();
        
        $response = $controller->getCurrentUserSecurityQuestion();
        
        echo json_encode([
            'success' => true,
            'controller_response' => $response,
            'controller_method_called' => 'getCurrentUserSecurityQuestion'
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Exception in controller: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    exit;
});

Route::get('/api/debug/direct-repo', function() {
    header('Content-Type: application/json');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
    
    try {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        
        $userRepository = new UserRepository();
        $userId = $_SESSION['user_id'];
        
        $user = $userRepository->find($userId);
        
        if (!$user) {
            echo json_encode([
                'success' => false,
                'error' => 'User not found in direct repo test',
                'user_id' => $userId
            ]);
            exit;
        }
        
        $securityQuestion = $user->security_question;
        
        echo json_encode([
            'success' => true,
            'method' => 'Direct repository test',
            'user_id' => $userId,
            'user_exists' => true,
            'security_question_raw' => $securityQuestion,
            'security_question_empty' => empty($securityQuestion),
            'security_question_null' => is_null($securityQuestion),
            'user_attributes_keys' => array_keys($user->toArray()),
            'has_security_question_key' => array_key_exists('security_question', $user->toArray())
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Exception in direct repo: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    exit;
});

Route::get('/api/debug/simple-security', function() {
    header('Content-Type: application/json');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['error' => 'Not authenticated', 'session' => $_SESSION]);
        exit;
    }
    
    try {
        require_once __DIR__ . '/../database/query.php';
        
        $query = new Query();
        $result = $query->table('users')->where('id', $userId)->first();
        
        if (!$result) {
            echo json_encode(['error' => 'User not found', 'user_id' => $userId]);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'method' => 'Simple direct query',
            'user_id' => $userId,
            'security_question' => $result['security_question'] ?? 'NULL',
            'security_question_empty' => empty($result['security_question']),
            'all_fields' => array_keys($result)
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'error' => 'Exception: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    
    exit;
});

Route::post('/api/debug/set-security', function() {
    header('Content-Type: application/json');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
    
    try {
        require_once __DIR__ . '/../database/query.php';
        
        $question = "What is your favorite color?";
        $answer = password_hash("blue", PASSWORD_DEFAULT);
        
        $query = new Query();
        $updated = $query->table('users')
            ->where('id', $userId)
            ->update([
                'security_question' => $question,
                'security_answer' => $answer,
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Security question set for testing',
            'user_id' => $userId,
            'question' => $question,
            'updated_rows' => $updated
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'error' => 'Exception: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    
    exit;
});


Route::post('/api/chat/create', function() {
    $controller = new ChatController();
    return $controller->create();
});

Route::post('/api/chat/dm/create', function() {
    $controller = new ChatController();
    $controller->createDirectMessage();
});

Route::get('/api/chat/dm/rooms', function() {
    $controller = new ChatController();
    $controller->getDirectMessageRooms();
});

Route::get('/api/chat/dm/room', function() {
    $controller = new ChatController();
    $controller->getDirectMessageRoomByFriendId();
});

Route::get('/api/chat/dm/([0-9]+)', function($roomId) {
    $controller = new ChatController();
    $controller->getDirectMessageRoom($roomId);
});





Route::get('/api/debug/socket-status', function() {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Socket debugging now handled directly by frontend',
        'new_flow' => [
            'database' => 'PHP backend handles database operations',
            'websocket' => 'Frontend handles socket emissions directly',
            'simplified' => 'No PHP-to-socket HTTP bridge'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
});



Route::get('/api/debug/database', function() {
    header('Content-Type: application/json');
    try {
        $db = require_once __DIR__ . '/db.php';
        $stmt = $db->prepare("SELECT 1 as test");
        $stmt->execute();
        $result = $stmt->fetch();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Database connection successful',
            'test_query' => $result ? 'passed' : 'failed'
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]);
    }
});



Route::get('/api/chat/channel/([0-9]+)', function($channelId) {
    $controller = new ChatController();
    $controller->renderChatSection('channel', $channelId);
});

Route::get('/api/voice/channel/([0-9]+)', function($channelId) {
    $controller = new ChatController();
    $controller->renderVoiceSection($channelId);
});

Route::post('/api/chat/dm/create', function() {
    $controller = new ChatController();
    $controller->createDirectMessage();
});

Route::get('/api/chat/dm/([0-9]+)', function($dmId) {
    $controller = new ChatController();
    $controller->renderChatSection('direct', $dmId);
});

Route::get('/api/channels/([0-9]+)/messages', function($channelId) {
    $controller = new ChatController();
    $controller->getMessages('channel', $channelId);
});

Route::post('/api/channels/([0-9]+)/messages', function($channelId) {
    $controller = new ChatController();
    $_POST['target_type'] = 'channel';
    $_POST['target_id'] = $channelId;
    $controller->sendMessage();
});

Route::get('/api/chat/channel/([0-9]+)/messages', function($channelId) {
    $controller = new ChatController();
    $controller->getMessages('channel', $channelId);
});

Route::post('/api/chat/channel/([0-9]+)/messages', function($channelId) {
    $controller = new ChatController();
    $_POST['target_type'] = 'channel';
    $_POST['target_id'] = $channelId;
    $controller->sendMessage();
});

Route::get('/api/chat/dm/([0-9]+)/messages', function($roomId) {
    $controller = new ChatController();
    $controller->getMessages('dm', $roomId);
});

Route::post('/api/chat/dm/([0-9]+)/messages', function($roomId) {
    $controller = new ChatController();
    $_POST['target_type'] = 'dm';
    $_POST['target_id'] = $roomId;
    $controller->sendMessage();
});

Route::post('/api/chat/save-message', function() {
    $controller = new ChatController();
    $controller->saveMessageFromSocket();
});

Route::post('/api/debug/socket-input', function() {
    $controller = new DebugController();
    return $controller->testSocketInput();
});

Route::get('/api/debug/socket-input', function() {
    $controller = new DebugController();
    return $controller->testSocketInput();
});

Route::post('/api/debug/test-socket-save', function() {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    echo json_encode([
        'success' => true,
        'message' => 'Debug endpoint working',
        'received_headers' => [
            'HTTP_X_SOCKET_USER_ID' => $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? 'NOT_SET',
            'HTTP_X_SOCKET_USERNAME' => $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? 'NOT_SET',
            'HTTP_X_SOCKET_SESSION_ID' => $_SERVER['HTTP_X_SOCKET_SESSION_ID'] ?? 'NOT_SET',
            'HTTP_X_SOCKET_AVATAR_URL' => $_SERVER['HTTP_X_SOCKET_AVATAR_URL'] ?? 'NOT_SET'
        ],
        'received_data' => $input,
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT_SET'
    ]);
});

Route::get('/api/debug/test-dm-session', function() {
    header('Content-Type: application/json');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    echo json_encode([
        'success' => true,
        'session_data' => [
            'active_dm' => $_SESSION['active_dm'] ?? 'NOT_SET',
            'user_id' => $_SESSION['user_id'] ?? 'NOT_SET',
            'username' => $_SESSION['username'] ?? 'NOT_SET'
        ],
        'globals_check' => [
            'chatType' => $GLOBALS['chatType'] ?? 'NOT_SET',
            'targetId' => $GLOBALS['targetId'] ?? 'NOT_SET'
        ]
    ]);
});

Route::post('/api/channels/move', function() {
    $controller = new ChannelController();
    $controller->moveChannelToCategory();
});

Route::post('/api/channels/reorder', function() {
    $controller = new ChannelController();
    $controller->reorderChannels();
});

Route::post('/api/categories/reorder', function() {
    $controller = new ChannelController();
    $controller->reorderCategories();
});

Route::post('/api/positions/batch', function() {
    $controller = new ChannelController();
    $controller->batchUpdatePositions();
});

Route::post('/api/servers/([0-9]+)/sync-positions', function($serverId) {
    $controller = new ChannelController();
    $_POST['server_id'] = $serverId;
    $controller->syncServerPositions();
});



Route::post('/api/chat/save-bot-message', function() {
    $controller = new ChatController();
    $controller->saveBotMessageFromSocket();
});

Route::post('/api/debug/socket-input', function() {
    $controller = new DebugController();
    return $controller->testSocketInput();
});

Route::post('/api/servers/leave', function() {
    $controller = new ServerController();
    $controller->leaveServer();
});

Route::get('/api/servers/([0-9]+)/eligible-new-owners', function($serverId) {
    $controller = new ServerController();
    $controller->getEligibleNewOwners($serverId);
});

Route::post('/api/servers/([0-9]+)/transfer-ownership', function($serverId) {
    $controller = new ServerController();
    $controller->transferOwnership($serverId);
});

Route::delete('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->deleteMessage($messageId);
});

Route::delete('/api/chat/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->deleteMessage($messageId);
});

Route::put('/api/chat/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->updateMessage($messageId);
});

Route::post('/api/debug/test-bot', function() {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        $userRepository = new UserRepository();
        
        $bot = $userRepository->findByUsername('titibot');
        if (!$bot) {
            echo json_encode([
                'success' => false,
                'error' => 'TitiBot not found in database'
            ]);
            return;
        }
        
        $testMessage = [
            'id' => 'test-' . time(),
            'user_id' => 1,
            'username' => 'tester',
            'content' => '/titibot ping',
            'channel_id' => 14,
            'target_type' => 'channel',
            'target_id' => 14,
            'voice_context' => [
                'voice_channel_id' => 14,
                'user_in_voice' => true
            ]
        ];
        
        echo json_encode([
            'success' => true,
            'bot_info' => [
                'id' => $bot->id,
                'username' => $bot->username,
                'status' => $bot->status
            ],
            'test_message' => $testMessage,
            'message' => 'Bot test data prepared'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
});

Route::post('/api/bot/create', function() {
    $controller = new BotController();
    $controller->create();
});

Route::post('/api/bot/create-titibot', function() {
    $controller = new BotController();
    $controller->createTitibot();
});

Route::get('/api/bot/check/{username}', function($username) {
    $controller = new BotController();
    $controller->check($username);
});

Route::get('/api/bot/user/{username}', function($username) {
    $controller = new BotController();
    $controller->getBotByUsername($username);
});


return array_merge(Route::getRoutes(), [
    '404' => 'pages/404.php'
]);

