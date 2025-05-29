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

// Simple Route class to handle route definitions
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

// Define routes using the Route class
Route::get('/', 'pages/landing.php');
Route::get('/home', 'pages/home.php');
Route::get('/login', 'pages/login.php');
Route::get('/register', 'pages/register.php');
Route::get('/explore-servers', 'pages/explore.php');
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

// API endpoints
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

// Add channel creation endpoint
Route::post('/api/channels', function() {
    $controller = new ChannelController();
    $controller->create();
});

// Add category creation endpoint
Route::post('/api/categories', function() {
    $controller = new ChannelController();
    $controller->createCategory();
});

// Add more routes as needed...

// For backward compatibility, return routes in the old format
return array_merge(Route::getRoutes(), [
    '404' => 'pages/404.php'
]);