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

// Basic pages
Route::get('/', 'pages/landing-page.php');
Route::get('/home', 'pages/home.php');
Route::get('/app', 'pages/home.php'); // Add route for /app -> redirect to home page
Route::get('/login', 'pages/authentication-page.php');
Route::get('/register', 'pages/authentication-page.php');
Route::get('/explore-servers', 'pages/explore-servers.php');
Route::get('/settings', 'pages/settings.php');
Route::get('/call', 'pages/call.php');
Route::get('/forgot-password', 'pages/authentication-page.php');
Route::get('/404', 'pages/404.php');

// Authentication POST routes
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

// Logout route
Route::get('/logout', function() {
    $controller = new AuthenticationController();
    $controller->logout();
});

// Server routes
Route::get('/server/([0-9]+)', function($id) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->show($id);
});

Route::get('/invite/([a-zA-Z0-9]+)', function($code) {
    require_once __DIR__ . '/../controllers/ServerController.php';
    $controller = new ServerController();
    $controller->join($code);
});

// API routes
Route::get('/api/servers/([0-9]+)/channels', function($serverId) {
    require_once __DIR__ . '/../controllers/ChannelController.php';
    $controller = new ChannelController();
    $channelData = $controller->getServerChannels($serverId);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'channels' => $channelData['channels'],
        'categories' => $channelData['categories']
    ]);
});

// Server creation API route
Route::post('/api/servers/create', function() {
    $controller = new ServerController();
    $controller->create();
});

Route::post('/api/channels', function() {
    $controller = new ChannelController();
    $controller->create();
});

Route::post('/api/categories', function() {
    $controller = new ChannelController();
    $controller->createCategory();
});

// Health check endpoint
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