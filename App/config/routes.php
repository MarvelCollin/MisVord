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

return [

    '/' => 'pages/landing-page.php',

    '/auth' => 'pages/authentication-page.php',
    '/login' => 'pages/authentication-page.php',
    '/register' => 'pages/authentication-page.php',
    '/forgot-password' => 'pages/authentication-page.php',

    '/app' => 'pages/home.php', 
    '/home' => 'pages/home.php',
    '/server' => 'pages/server-page.php',
    '/call' => 'pages/call.php',
    '/create-server' => 'pages/create-server.php',
    '/explore-servers' => 'pages/explore-servers.php',
    
    '/server/{id}' => function($params) {
        error_log("Server route matched with ID: " . $params['id']);
        $controller = new ServerController();
        $controller->show($params['id']);
    },

    '/server/{serverId}/channel/{channelId}' => function($params) {
        $controller = new ServerController();
        $controller->showChannel($params['serverId'], $params['channelId']);
    },    '/voice' => 'server/voice-channel.php',

    'POST:/api/servers' => function() {
        $controller = new ServerController();
        $controller->create();
    },
    
    'POST:/api/servers/create' => function() {
        $controller = new ServerController();
        $controller->create();
    },
    
    'GET:/api/servers/list' => function() {
        $controller = new ServerController();
        $controller->listServers();
    },
    
    'GET:/join/{invite}' => function($params) {
        $controller = new ServerController();
        $controller->join($params['invite']);
    },
    'POST:/api/servers/{id}/leave' => function($params) {
        $controller = new ServerController();
        $controller->leave($params['id']);
    },

    // Server Settings Routes
    'PUT:/api/servers/{id}/settings' => function($params) {
        $controller = new ServerSettingsController();
        $controller->updateServerSettings();
    },
    'POST:/api/servers/{id}/invite' => function($params) {
        $controller = new ServerSettingsController();
        $controller->generateInviteLink();
    },
    
    // Notification Settings Routes
    'GET:/api/servers/{id}/notifications' => function($params) {
        $controller = new NotificationSettingsController();
        $controller->getServerNotificationSettings($params['id']);
    },
    'PUT:/api/servers/{id}/notifications' => function($params) {
        $controller = new NotificationSettingsController();
        $controller->updateServerNotificationSettings();
    },
    
    // User Profile Routes
    'GET:/api/servers/{id}/profile' => function($params) {
        $controller = new UserProfileController();
        $controller->getPerServerProfile($params['id']);
    },
    'PUT:/api/servers/{id}/profile' => function($params) {
        $controller = new UserProfileController();
        $controller->updatePerServerProfile();
    },

    'POST:/register' => function() {
        $controller = new AuthenticationController();
        $controller->register();
    },
    'POST:/login' => function() {
        $controller = new AuthenticationController();
        $controller->login();
    },
    'POST:/forgot-password' => function() {
        $controller = new AuthenticationController();
        $controller->forgotPassword();
    },
    'GET:/logout' => function() {
        $controller = new AuthenticationController();
        $controller->logout();
    },

    'GET:/auth/google' => function() {
        $controller = new GoogleAuthController();
        $controller->redirect();
    },
    'GET:/google/' => function() {
        $controller = new GoogleAuthController();
        $controller->callback();
    },

    'GET:/debug-oauth' => function() {
        include __DIR__ . '/../debug_google_oauth.php';
    },

    'GET:/api/channels/{id}' => function($params) {
        $controller = new ChannelController();
        $controller->show($params['id']);
    },
    'POST:/api/channels' => function() {
        $controller = new ChannelController();
        $controller->create();
    },
    'PUT:/api/channels/{id}' => function($params) {
        $controller = new ChannelController();
        $controller->update($params['id']);
    },
    'DELETE:/api/channels/{id}' => function($params) {
        $controller = new ChannelController();
        $controller->delete($params['id']);
    },

    'GET:/api/channels/{id}/messages' => function($params) {
        $controller = new MessageController();
        $controller->getMessages($params['id']);
    },

    'GET:/api/servers/{serverId}/channels/{channelId}/messages' => function($params) {
        $controller = new MessageController();
        $controller->getMessages($params['channelId']);
    },

    'POST:/api/channels/{id}/messages' => function($params) {
        $controller = new MessageController();
        $controller->createMessage($params['id']);
    },

    'POST:/api/servers/{serverId}/channels/{channelId}/messages' => function($params) {
        $controller = new MessageController();
        $controller->createMessage($params['channelId']);
    },
    'PUT:/api/messages/{id}' => function($params) {
        $controller = new MessageController();
        $controller->updateMessage($params['id']);
    },
    'DELETE:/api/messages/{id}' => function($params) {
        $controller = new MessageController();
        $controller->deleteMessage($params['id']);
    },

    'POST:/api/categories' => function() {
        $controller = new ChannelController();
        $controller->createCategory();
    },

    'GET:/api/debug' => function() {
        include __DIR__ . '/../debug_api.php';
    },

    'GET:/health' => function() {

        if (headers_sent($file, $line)) {
            error_log("Headers already sent in $file:$line - health check may not work properly");
        }

        $oldErrorReporting = error_reporting(0);

        try {

            $pdo = EnvLoader::getPDOConnection();
            $pdo->query("SELECT 1");

            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'healthy',
                'database' => 'connected',
                'timestamp' => date('c')
            ]);
        } catch (Exception $e) {

            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => date('c')
            ]);
        }

        error_reporting($oldErrorReporting);
        exit;
    },

    '404' => 'pages/404.php'
];