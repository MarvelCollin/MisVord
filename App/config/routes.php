<?php

require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';
require_once __DIR__ . '/../controllers/ChannelController.php';
require_once __DIR__ . '/../controllers/MessageController.php';
require_once __DIR__ . '/../controllers/ChatController.php';
require_once __DIR__ . '/../controllers/GoogleAuthController.php';
require_once __DIR__ . '/../controllers/RoleController.php';
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
    $controller = new HomeController();
    $controller->redirectToApp();
});
Route::get('/app/friends', 'pages/home.php');
Route::get('/app/channels/dm/([0-9]+)', function($dmId) {
    $_SESSION['active_dm'] = $dmId;
    require_once __DIR__ . '/../views/pages/home.php';
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
Route::get('/404', 'pages/404.php');

Route::post('/login', function() {
    $controller = new AuthenticationController();
    $controller->login();
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

Route::get('/api/servers/([0-9]+)/channels', function($serverId) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->getServerChannels($serverId);
});

Route::post('/api/servers/create', function() {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    return $controller->create();
});

Route::post('/servers/create', function() {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    return $controller->create();
});

Route::post('/api/channels', function() {
    $controller = new ChannelController();
    $controller->create();
});

Route::post('/api/channels/category', function() {
    $controller = new ChannelController();
    $controller->createCategory();
});

Route::get('/api/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $controller->show($channelId);
});

Route::get('/api/channel-content', function() {
    $controller = new ChannelController();
    $controller->getChannelContent();
});

Route::get('/api/channels/([0-9]+)/participants', function($channelId) {
    $controller = new ChannelController();
    $controller->getChannelParticipants($channelId);
});

Route::get('/api/servers/([0-9]+)', function($serverId) {
    $controller = new ServerController();
    $controller->getServerDetails($serverId);
});

Route::get('/api/user/servers', function() {
    $controller = new ServerController();
    $controller->getUserServersData();
});

Route::post('/api/servers/([0-9]+)/invite', function($serverId) {
    $controller = new ServerController();
    $controller->generateInviteLink($serverId);
});

Route::post('/api/channels/position', function() {
    $controller = new ChannelController();
    $controller->updateChannelPosition();
});

Route::post('/api/categories/position', function() {
    $controller = new ChannelController();
    $controller->updateCategoryPosition();
});

Route::post('/api/positions/batch', function() {
    $controller = new ChannelController();
    $controller->batchUpdatePositions();
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

Route::get('/api/servers/([0-9]+)/roles', function($serverId) {
    $controller = new RoleController();
    $controller->getServerRoles($serverId);
});

Route::post('/api/servers/([0-9]+)/roles', function($serverId) {
    $controller = new RoleController();
    $controller->createRole($serverId);
});

Route::post('/api/roles/([0-9]+)', function($roleId) {
    $controller = new RoleController();
    $controller->updateRole($roleId);
});

Route::delete('/api/roles/([0-9]+)', function($roleId) {
    $controller = new RoleController();
    $controller->deleteRole($roleId);
});

Route::post('/api/roles/([0-9]+)/assign', function($roleId) {
    $controller = new RoleController();
    $controller->assignRoleToUser($roleId);
});

Route::post('/api/roles/([0-9]+)/remove', function($roleId) {
    $controller = new RoleController();
    $controller->removeRoleFromUser($roleId);
});

Route::post('/api/roles/([0-9]+)/permissions', function($roleId) {
    $controller = new RoleController();
    $controller->updateRolePermissions($roleId);
});

Route::get('/api/roles/([0-9]+)/permissions', function($roleId) {
    $controller = new RoleController();
    $controller->getRolePermissions($roleId);
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

Route::post('/api/users/block', function() {
    $controller = new FriendController();
    $controller->blockUser();
});

Route::post('/api/users/unblock', function() {
    $controller = new FriendController();
    $controller->unblockUser();
});

Route::get('/api/users/blocked', function() {
    $controller = new UserController();
    $controller->getBlockedUsers();
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

Route::get('/api/users/([0-9]+)/profile', function($userId) {
    $controller = new UserController();
    $controller->getUserProfile($userId);
});

Route::get('/api/chat/(channel|dm)/([0-9]+)/messages', function($type, $id) {
    $controller = new ChatController();
    $controller->getMessages($type, $id);
});

Route::post('/api/chat/send', function() {
    $controller = new ChatController();
    $controller->sendMessage();
});

Route::post('/api/chat/create', function() {
    $controller = new ChatController();
    $controller->create();
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

Route::get('/api/chat/dm/([0-9]+)/messages', function($roomId) {
    $controller = new ChatController();
    $controller->getDirectMessageRoomMessages($roomId);
});

Route::get('/api/chat/render/(channel|dm|direct)/([0-9]+)', function($chatType, $chatId) {
    $controller = new ChatController();
    $controller->renderChatSection($chatType, $chatId);
});

Route::put('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->updateMessage($messageId);
});

Route::delete('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->deleteMessage($messageId);
});

Route::get('/api/messages/([0-9]+)', function($messageId) {
    $controller = new ChatController();
    $controller->getMessage($messageId);
});

Route::get('/api/messages/([0-9]+)/reactions', function($messageId) {
    require_once __DIR__ . '/../controllers/MessageController.php';
    $controller = new MessageController();
    $controller->getReactions($messageId);
});

Route::post('/api/messages/([0-9]+)/reactions', function($messageId) {
    require_once __DIR__ . '/../controllers/MessageController.php';
    $controller = new MessageController();
    $controller->addReaction($messageId);
});

Route::delete('/api/messages/([0-9]+)/reactions', function($messageId) {
    require_once __DIR__ . '/../controllers/MessageController.php';
    $controller = new MessageController();
    $controller->removeReaction($messageId);
});

Route::get('/api/channels/([0-9]+)/search', function($channelId) {
    $controller = new ChatController();
    $controller->searchMessages($channelId);
});

Route::post('/api/messages/([0-9]+)/pin', function($messageId) {
    $controller = new MessageController();
    $controller->pinMessage($messageId);
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

Route::get('/api/captcha/generate', function() {
    $controller = new AuthenticationController();
    $controller->generateCaptcha();
});

Route::get('/api/debug-simple', function() {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Simple debug route working', 'uri' => $_SERVER['REQUEST_URI']]);
});

Route::get('/api/debug-pattern/([0-9]+)', function($id) {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Pattern debug route working', 'id' => $id, 'uri' => $_SERVER['REQUEST_URI']]);
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

Route::post('/api/servers/([0-9]+)/settings', function($serverId) {
    $controller = new ServerController();
    $controller->updateServerSettings($serverId);
});

Route::get('/api/servers/([0-9]+)/members', function($serverId) {
    $controller = new ServerController();
    $controller->getServerMembers($serverId);   
});

Route::get('/api/explore/servers/search', function() {
    $query = $_GET['q'] ?? '';
    $controller = new ExploreController();
    $result = $controller->searchServers($query);
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
});

Route::get('/api/users/([0-9]+)', function($userId) {
    $controller = new UserController();
    $controller->getUserData($userId);
});

Route::get('/api/debug/user-profile/([0-9]+)', function($userId) {
    header('Content-Type: application/json');
    
    try {
        require_once __DIR__ . '/../controllers/UserController.php';
        $controller = new UserController();
        
        $profile = $controller->getUserProfile($userId);
        
        
        
        if ($profile !== null) {
            echo json_encode([
                'success' => true,
                'debug_info' => 'UserController::getUserProfile returned a value instead of sending a response directly',
                'profile_data' => $profile
            ], JSON_PRETTY_PRINT);
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], JSON_PRETTY_PRINT);
    }
    
    exit;
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

Route::get('/api/user/security-question', function() {
    $controller = new UserController();
    $controller->getCurrentUserSecurityQuestion();
});

Route::get('/api/debug/user-security', function() {
    header('Content-Type: application/json');
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $debugInfo = [
        'session_status' => session_status(),
        'session_id' => session_id(),
        'session_data' => $_SESSION ?? [],
        'user_id_from_session' => $_SESSION['user_id'] ?? 'NOT_SET',
        'authenticated' => isset($_SESSION['user_id']),
    ];
    
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Not authenticated', 
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    try {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        require_once __DIR__ . '/../database/models/User.php';
        require_once __DIR__ . '/../database/query.php';
        
        $userRepository = new UserRepository();
        $userId = $_SESSION['user_id'];
        
        $debugInfo['trying_to_find_user_id'] = $userId;
        
        $user = $userRepository->find($userId);
        
        $debugInfo['user_found'] = $user ? true : false;
        
        if (!$user) {
            $query = new Query();
            $directResult = $query->table('users')->where('id', $userId)->first();
            
            $debugInfo['direct_query_result'] = $directResult ? 'FOUND' : 'NOT_FOUND';
            $debugInfo['direct_query_data'] = $directResult;
            
            echo json_encode([
                'success' => false,
                'error' => 'User not found in repository',
                'debug' => $debugInfo
            ], JSON_PRETTY_PRINT);
            exit;
        }
        
        $userAttributes = $user->toArray();
        
        echo json_encode([
            'success' => true,
            'user_data' => [
                'id' => $user->id ?? 'NULL',
                'username' => $user->username ?? 'NULL',
                'email' => $user->email ?? 'NULL',
                'security_question' => $user->security_question ?? 'NULL',
                'security_answer_set' => !empty($user->security_answer),
                'created_at' => $user->created_at ?? 'NULL'
            ],
            'raw_attributes' => $userAttributes,
            'security_question_status' => [
                'exists' => isset($user->security_question),
                'not_empty' => !empty($user->security_question),
                'value' => $user->security_question ?? 'NULL',
                'length' => isset($user->security_question) ? strlen($user->security_question) : 0
            ],
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Exception: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'debug' => $debugInfo
        ], JSON_PRETTY_PRINT);
    }
    exit;
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
    $controller = new AdminController();
    return $controller->searchUsers();
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
    $controller = new NitroController();
    $controller->getStats();
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

Route::get('/api/admin/debug/chart-data', function() {
    $controller = new AdminController();
    return $controller->debugChartData();
});

Route::get('/components/common/voice-indicator', function() {
    require_once __DIR__ . '/../views/components/common/voice-indicator.php';
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

Route::post('/api/bots/add-to-server', function() {
    $controller = new BotController();
    $controller->addToServer();
});

Route::post('/api/bots/remove-from-server', function() {
    $controller = new BotController();
    $controller->removeFromServer();
});

Route::delete('/api/bots/([0-9]+)', function($botId) {
    $controller = new BotController();
    $controller->delete($botId);
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
        if (file_exists($filePath)) {
            $mimeType = mime_content_type($filePath);
            header("Content-Type: {$mimeType}");
            header("Content-Length: " . filesize($filePath));
            readfile($filePath);
            exit;
        }
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

return array_merge(Route::getRoutes(), [
    '404' => 'pages/404.php'
]);

