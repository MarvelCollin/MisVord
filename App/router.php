<?php
// Main router - delegate to public router

// Get the request path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME'];
$scriptDir = dirname($scriptName);

if ($scriptDir !== '/' && !empty($scriptDir)) {
    if (strpos($path, $scriptDir) === 0) {
        $path = substr($path, strlen($scriptDir));
    }
}

$path = '/' . trim($path, '/');
if ($path === '//') {
    $path = '/';
}

// API Routes - handle them before delegating to public router
if (strpos($path, '/api/') === 0) {
    // Disable error reporting for API routes
    error_reporting(0);
    ini_set('display_errors', 0);
    
    if ($path === '/api/servers/create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/controllers/api/ServerController.php';
        $controller = new ServerController();
        $controller->create();
        exit;
    }
    
    // Channels API routes
    if ($path === '/api/channels' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/controllers/ChannelController.php';
        $controller = new ChannelController();
        $controller->create();
        exit;
    }
    
    // Category routes
    if ($path === '/api/categories' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/controllers/ChannelController.php';
        $controller = new ChannelController();
        $controller->createCategory();
        exit;
    }

    // Position management routes
    if ($path === '/api/positions/batch' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/controllers/ChannelController.php';
        $controller = new ChannelController();
        $controller->batchUpdatePositions();
        exit;
    }
    
    // Channel position route
    if ($path === '/api/channels/position' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/controllers/ChannelController.php';
        $controller = new ChannelController();
        $controller->updateChannelPosition();
        exit;
    }
    
    // Category position route
    if ($path === '/api/categories/position' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/controllers/ChannelController.php';
        $controller = new ChannelController();
        $controller->updateCategoryPosition();
        exit;
    }
}

// Delegate to public router for other requests
require_once __DIR__ . '/public/router.php';