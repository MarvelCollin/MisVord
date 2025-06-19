<?php

require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';
require_once __DIR__ . '/../controllers/ChannelController.php';
require_once __DIR__ . '/../controllers/MessageController.php';
require_once __DIR__ . '/../controllers/GoogleAuthController.php';
require_once __DIR__ . '/../controllers/ServerSettingsController.php';
require_once __DIR__ . '/../controllers/NotificationSettingsController.php';
require_once __DIR__ . '/../controllers/UserProfileController.php';
require_once __DIR__ . '/../controllers/GroupServerController.php';
require_once __DIR__ . '/../controllers/RoleController.php';
require_once __DIR__ . '/../controllers/EmojiController.php';
require_once __DIR__ . '/../controllers/FriendController.php';
require_once __DIR__ . '/../controllers/UserPresenceController.php';
require_once __DIR__ . '/../controllers/NitroController.php';
require_once __DIR__ . '/../controllers/SocketController.php';
require_once __DIR__ . '/../controllers/HealthController.php';
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
Route::get('/app', 'pages/home.php');
Route::get('/login', 'pages/authentication-page.php');
Route::get('/register', 'pages/authentication-page.php');
Route::get('/explore-servers', 'pages/explore-servers.php');
Route::get('/settings', 'pages/settings.php');
Route::get('/call', 'pages/call.php');
Route::get('/dev', 'pages/dev.php');
Route::get('/forgot-password', 'pages/authentication-page.php');
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

Route::get('/logout', function() {
    $controller = new AuthenticationController();
    $controller->logout();
});

Route::post('/api/socket/emit', function() {
    $controller = new SocketController();
    $controller->handleSocketRequest();
});

Route::get('/server/([0-9]+)', function($id) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->show($id);
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

Route::get('/api/channels/([0-9]+)/messages', function($channelId) {
    $controller = new MessageController();
    $controller->getMessages($channelId);
});

Route::get('/api/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $controller->show($channelId);
});

Route::get('/api/channels/([0-9]+)/participants', function($channelId) {
    $controller = new ChannelController();
    $controller->getChannelParticipants($channelId);
});

Route::get('/api/servers/([0-9]+)', function($serverId) {
    $controller = new ServerController();
    $controller->getServerDetails($serverId);
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

// GroupServer routes
Route::get('/api/group-servers', function() {
    $controller = new GroupServerController();
    $controller->index();
});

Route::post('/api/group-servers', function() {
    $controller = new GroupServerController();
    $controller->create();
});

Route::post('/api/group-servers/([0-9]+)', function($id) {
    $controller = new GroupServerController();
    $controller->update($id);
});

Route::delete('/api/group-servers/([0-9]+)', function($id) {
    $controller = new GroupServerController();
    $controller->delete($id);
});

Route::get('/api/group-servers/([0-9]+)/servers', function($id) {
    $controller = new GroupServerController();
    $controller->getServers($id);
});

// Role routes
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

// Emoji routes
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
    $controller = new EmojiController();
    $controller->addEmojiReaction($messageId);
});

Route::delete('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new EmojiController();
    $controller->removeEmojiReaction($messageId);
});

Route::get('/api/messages/([0-9]+)/reactions', function($messageId) {
    $controller = new EmojiController();
    $controller->getMessageReactions($messageId);
});

Route::get('/api/users/me/emojis/top', function() {
    $controller = new EmojiController();
    $controller->getUserTopEmojis();
});

Route::get('/api/users/([0-9]+)/emojis/top', function($userId) {
    $controller = new EmojiController();
    $controller->getUserTopEmojis($userId);
});

// Friend routes
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

Route::post('/api/friends/([0-9]+)/accept', function($friendshipId) {
    $controller = new FriendController();
    $controller->acceptFriendRequest($friendshipId);
});

Route::post('/api/friends/([0-9]+)/decline', function($friendshipId) {
    $controller = new FriendController();
    $controller->declineFriendRequest($friendshipId);
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
    $controller = new FriendController();
    $controller->getBlockedUsers();
});

Route::post('/api/users/find', function() {
    $controller = new FriendController();
    $controller->findUsers();
});

// User Presence routes
Route::post('/api/presence/status', function() {
    $controller = new UserPresenceController();
    $controller->updateStatus();
});

Route::get('/api/presence/me', function() {
    $controller = new UserPresenceController();
    $controller->getStatus();
});

Route::get('/api/presence/users/([0-9]+)', function($userId) {
    $controller = new UserPresenceController();
    $controller->getStatus($userId);
});

Route::get('/api/presence/online', function() {
    $controller = new UserPresenceController();
    $controller->getOnlineUsers();
});

Route::post('/api/presence/activity', function() {
    $controller = new UserPresenceController();
    $controller->setActivity();
});

Route::delete('/api/presence/activity', function() {
    $controller = new UserPresenceController();
    $controller->clearActivity();
});

Route::post('/api/presence/offline', function() {
    $controller = new UserPresenceController();
    $controller->goOffline();
});

return array_merge(Route::getRoutes(), [
    '404' => 'pages/404.php'
]);
