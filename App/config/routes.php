<?php

require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';
require_once __DIR__ . '/../controllers/ChannelController.php';
require_once __DIR__ . '/../controllers/MessageController.php';
require_once __DIR__ . '/../controllers/GoogleAuthController.php';
require_once __DIR__ . '/../controllers/ServerSettingsController.php';
require_once __DIR__ . '/../controllers/NotificationSettingsController.php';
require_once __DIR__ . '/../controllers/UserProfileController.php';
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
Route::get('/forgot-password', 'pages/authentication-page.php');
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
    require_once __DIR__ . '/../controllers/api/ServerController.php';
    $controller = new ServerController();
    return $controller->create();
});

// Add fallback route for incorrect endpoint
Route::post('/servers/create', function() {
    require_once __DIR__ . '/../controllers/api/ServerController.php';
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

// Get channel details
Route::get('/api/channels/([0-9]+)', function($channelId) {
    $controller = new ChannelController();
    $controller->show($channelId);
});

// Add new route for channel participants
Route::get('/api/channels/([0-9]+)/participants', function($channelId) {
    $controller = new ChannelController();
    $controller->getChannelParticipants($channelId);
});

// Add missing route for getting server details
Route::get('/api/servers/([0-9]+)', function($serverId) {
    $controller = new ServerController();
    $controller->getServerDetails($serverId);
});

// Add missing route for server invite link generation
Route::post('/api/servers/([0-9]+)/invite', function($serverId) {
    $controller = new ServerController();
    $controller->generateInviteLink($serverId);
});

// Routes for drag and drop functionality
Route::post('/api/channels/position', function() {
    $controller = new ChannelController();
    $controller->updateChannelPosition();
});

Route::post('/api/categories/position', function() {
    $controller = new ChannelController();
    $controller->updateCategoryPosition();
});

// Add position management routes
Route::post('/api/positions/batch', function() {
    $controller = new ChannelController();
    $controller->batchUpdatePositions();
});

// Add debug endpoints
Route::get('/debug/invite', function() {
    // Simple debug page for invite link generation
    include_once __DIR__ . '/../debug-invite.php';
    exit;
});

Route::get('/debug/messages', function() {
    $controller = new MessageController();
    $controller->debugMessageStorage();
});

// Add new database debug route
Route::get('/debug/database', function() {
    include_once __DIR__ . '/../debug-db.php';
    exit;
});

Route::get('/health', function() {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'OK',
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => 'misvord-app'
    ]);
});

return array_merge(Route::getRoutes(), [
    '404' => 'pages/404.php'
]);