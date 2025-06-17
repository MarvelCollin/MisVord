<?php
if (!defined('APP_ROOT')) {
    define('APP_ROOT', __DIR__);
}

// Load environment and logger first
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/utils/AppLogger.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Log the incoming request
$startTime = microtime(true);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '';
logger()->info("Request started", [
    'method' => $method,
    'uri' => $uri,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
]);

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
    logger()->debug("API route detected", ['path' => $path, 'method' => $method]);
    
    // For API routes, we still want to log errors but not display them
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    
    try {
        if ($path === '/api/servers/create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            logger()->info("API: Creating server");
            require_once __DIR__ . '/controllers/api/ServerController.php';
            $controller = new ServerController();
            $controller->create();
            
            $duration = microtime(true) - $startTime;
            logger()->apiRequest($method, $path, 200, $duration);
            exit;
        }
        
        // Channels API routes
        if ($path === '/api/channels' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            logger()->info("API: Creating channel");
            require_once __DIR__ . '/controllers/ChannelController.php';
            $controller = new ChannelController();
            $controller->create();
            
            $duration = microtime(true) - $startTime;
            logger()->apiRequest($method, $path, 200, $duration);
            exit;
        }
        
        // Category routes
        if ($path === '/api/categories' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            logger()->info("API: Creating category");
            require_once __DIR__ . '/controllers/ChannelController.php';
            $controller = new ChannelController();
            $controller->createCategory();
            
            $duration = microtime(true) - $startTime;
            logger()->apiRequest($method, $path, 200, $duration);
            exit;
        }

        // Position management routes
        if ($path === '/api/positions/batch' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            logger()->info("API: Batch updating positions");
            require_once __DIR__ . '/controllers/ChannelController.php';
            $controller = new ChannelController();
            $controller->batchUpdatePositions();
            
            $duration = microtime(true) - $startTime;
            logger()->apiRequest($method, $path, 200, $duration);
            exit;
        }
        
        // Channel position route
        if ($path === '/api/channels/position' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            logger()->info("API: Updating channel position");
            require_once __DIR__ . '/controllers/ChannelController.php';
            $controller = new ChannelController();
            $controller->updateChannelPosition();
            
            $duration = microtime(true) - $startTime;
            logger()->apiRequest($method, $path, 200, $duration);
            exit;
        }
        
        // Category position route
        if ($path === '/api/categories/position' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            logger()->info("API: Updating category position");
            require_once __DIR__ . '/controllers/ChannelController.php';
            $controller = new ChannelController();
            $controller->updateCategoryPosition();
            
            $duration = microtime(true) - $startTime;
            logger()->apiRequest($method, $path, 200, $duration);
            exit;
        }
        
        // Debug logs endpoint (only in development)
        if ($path === '/api/debug/logs' && (EnvLoader::get('APP_ENV') !== 'production')) {
            logger()->info("API: Accessing debug logs");
            require_once __DIR__ . '/public/api/debug_logs.php';
            exit;
        }
        
        // If no API route matched, log 404
        logger()->warning("API route not found", ['path' => $path, 'method' => $method]);
        $duration = microtime(true) - $startTime;
        logger()->apiRequest($method, $path, 404, $duration);
        
    } catch (Exception $e) {
        logger()->exception($e, ['api_path' => $path]);
        $duration = microtime(true) - $startTime;
        logger()->apiRequest($method, $path, 500, $duration);
          header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'error' => 'Internal server error',
            'message' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}

// Delegate to public router for other requests
require_once __DIR__ . '/public/router.php';