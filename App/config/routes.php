<?php

require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';
require_once __DIR__ . '/../controllers/ChannelController.php';
require_once __DIR__ . '/../controllers/MessageController.php';
require_once __DIR__ . '/../controllers/ChatController.php';
require_once __DIR__ . '/../controllers/GoogleAuthController.php';
require_once __DIR__ . '/../controllers/RoleController.php';
require_once __DIR__ . '/../controllers/EmojiController.php';
require_once __DIR__ . '/../controllers/FriendController.php';
require_once __DIR__ . '/../controllers/NitroController.php';
require_once __DIR__ . '/../controllers/HealthController.php';
require_once __DIR__ . '/../controllers/HomeController.php';
require_once __DIR__ . '/../controllers/ExploreController.php';
require_once __DIR__ . '/../controllers/SettingsController.php';
require_once __DIR__ . '/../controllers/MediaController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
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
Route::get('/login', 'pages/authentication-page.php');
Route::get('/register', 'pages/authentication-page.php');
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
Route::get('/forgot-password', 'pages/authentication-page.php');
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
Route::get('/set-security-question', 'pages/authentication-page.php');
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

Route::get('/api/servers/([0-9]+)/emojis', function($serverId) {
    $controller = new EmojiController();
    $controller->getServerEmojis($serverId);
});

Route::get('/api/servers/([0-9]+)/emojis/top', function($serverId) {
    $controller = new EmojiController();
    $controller->getTopServerEmojis($serverId);
});

Route::post('/api/servers/([0-9]+)/emojis', function($serverId) {
    $controller = new EmojiController();
    $controller->createEmoji($serverId);
});

Route::post('/api/emojis/([0-9]+)', function($emojiId) {
    $controller = new EmojiController();
    $controller->updateEmoji($emojiId);
});

Route::delete('/api/emojis/([0-9]+)', function($emojiId) {
    $controller = new EmojiController();
    $controller->deleteEmoji($emojiId);
});

Route::post('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new MessageController();
    $controller->addReaction($messageId);
});

Route::delete('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new MessageController();
    $controller->removeReaction($messageId);
});

Route::get('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new MessageController();
    $controller->getReactions($messageId);
});

Route::get('/api/users/me/emojis/top', function() {
    $controller = new EmojiController();
    $controller->getUserTopEmojis();
});

Route::get('/api/users/([0-9]+)/emojis/top', function($userId) {
    $controller = new EmojiController();
    $controller->getUserTopEmojis($userId);
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
    $controller->getSystemStats();
});

Route::get('/api/admin/users', function() {
    $controller = new AdminController();
    $controller->getUsers();
});

Route::get('/api/admin/users/search', function() {
    $controller = new AdminController();
    $controller->searchUsers();
});

Route::get('/api/admin/users/([0-9]+)', function($id) {
    $controller = new AdminController();
    $controller->getUser($id);
});

Route::put('/api/admin/users/([0-9]+)', function($id) {
    $controller = new AdminController();
    $controller->updateUser($id);
});

Route::post('/api/admin/users/([0-9]+)/toggle-ban', function($id) {
    $controller = new AdminController();
    $controller->toggleUserBan($id);
});

Route::delete('/api/admin/users/([0-9]+)', function($id) {
    $controller = new AdminController();
    $controller->deleteUser($id);
});

Route::get('/api/admin/servers', function() {
    $controller = new AdminController();
    $controller->getServers();
});

Route::get('/api/admin/servers/search', function() {
    $controller = new AdminController();
    $controller->searchServers();
});

Route::get('/api/admin/servers/stats', function() {
    $controller = new AdminController();
    $controller->getServerStats();
});

Route::get('/api/admin/servers/list', function() {
    $controller = new AdminController();
    $controller->getServers();
});

Route::delete('/api/admin/servers/([0-9]+)', function($id) {
    $controller = new AdminController();
    $controller->deleteServer($id);
});

Route::get('/api/admin/logs', function() {
    $controller = new AdminController();
    $controller->getLogs();
});

Route::get('/api/admin/users/stats', function() {
    $controller = new AdminController();
    $controller->getUserStats();
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

Route::get('/api/admin/stats/users/growth', function() {
    $controller = new AdminController();
    $controller->getUserGrowthStats();
});

Route::get('/api/admin/stats/messages/activity', function() {
    $controller = new AdminController();
    $controller->getMessageActivityStats();
});

Route::get('/api/admin/stats/servers/growth', function() {
    $controller = new AdminController();
    $controller->getServerGrowthStats();
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

return array_merge(Route::getRoutes(), [
    '404' => 'pages/404.php'
]);

