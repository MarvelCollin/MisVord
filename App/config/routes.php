<?php

/**
 * Routes Configuration
 * 
 * This file defines application routes separate from the routing logic.
 */

// Include Controllers
require_once __DIR__ . '/../controllers/AuthenticationController.php';
require_once __DIR__ . '/../controllers/ServerController.php';
require_once __DIR__ . '/../controllers/ChannelController.php';
require_once __DIR__ . '/../controllers/MessageController.php'; // Add this line to include MessageController

// Define application routes
return [
    // Landing page route
    '/' => 'pages/landing-page.php',
    
    '/auth' => 'pages/authentication-page.php',
    '/login' => 'pages/authentication-page.php',
    '/register' => 'pages/authentication-page.php',
    '/forgot-password' => 'pages/authentication-page.php',
    
    // Application routes
    '/app' => 'pages/server-page.php', 
    '/server' => 'pages/server-page.php',
    '/server/{id}' => function($params) {
        error_log("Server route matched with ID: " . $params['id']);
        $controller = new ServerController();
        $controller->show($params['id']);
    },
    // New route for server/id/channel/id pattern
    '/server/{serverId}/channel/{channelId}' => function($params) {
        $controller = new ServerController();
        $controller->showChannel($params['serverId'], $params['channelId']);
    },
    '/voice' => 'server/voice-channel.php',
    
    // Server API routes
    'POST:/api/servers' => function() {
        $controller = new ServerController();
        $controller->create();
    },
    'GET:/join/{invite}' => function($params) {
        $controller = new ServerController();
        $controller->join($params['invite']);
    },
    'POST:/api/servers/{id}/leave' => function($params) {
        $controller = new ServerController();
        $controller->leave($params['id']);
    },
    
    // Authentication action routes
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
    
    // Channel API routes
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
    
    // Message API routes
    // Original route maintained for backward compatibility
    'GET:/api/channels/{id}/messages' => function($params) {
        $controller = new MessageController();
        $controller->getMessages($params['id']);
    },
    // New route that uses server/channel pattern
    'GET:/api/servers/{serverId}/channels/{channelId}/messages' => function($params) {
        $controller = new MessageController();
        $controller->getMessages($params['channelId']);
    },
    // Original route maintained for backward compatibility
    'POST:/api/channels/{id}/messages' => function($params) {
        $controller = new MessageController();
        $controller->createMessage($params['id']);
    },
    // New route that uses server/channel pattern
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
    
    // Category API routes
    'POST:/api/categories' => function() {
        $controller = new ChannelController();
        $controller->createCategory();
    },
    
    // Add a debug endpoint
    'GET:/api/debug' => function() {
        include __DIR__ . '/../debug_api.php';
    },
    
    // 404 page - shown when no route matches
    '404' => 'pages/404.php'
];
