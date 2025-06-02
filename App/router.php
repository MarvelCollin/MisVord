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
    
    // Add test endpoint for debugging invite link generation
    if ($path === '/api/debug/invite' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        header('Content-Type: text/plain');
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        
        require_once __DIR__ . '/controllers/ServerController.php';
        require_once __DIR__ . '/database/models/Server.php';
        require_once __DIR__ . '/database/models/UserServerMembership.php';
        
        echo "Debug invite link generation\n\n";
        
        // Set up test session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['user_id'] = 1;
        
        try {
            $serverId = 1;
            $controller = new ServerController();
            
            // Try multiple approaches using our debug method
            $controller->debugInviteLink($serverId);
        } catch (Exception $e) {
            echo "ERROR: " . $e->getMessage() . "\n";
            echo "Stack trace: " . $e->getTraceAsString() . "\n";
        }
        exit;
    }
    
    // Add debug endpoint for testing message storage
    if ($path === '/api/debug/message-storage' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        header('Content-Type: application/json');
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        
        require_once __DIR__ . '/controllers/MessageController.php';
        require_once __DIR__ . '/database/models/Message.php';
        
        // Set up test session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['user_id'] = $_GET['user_id'] ?? 1;
        
        try {
            $controller = new MessageController();
            $controller->debugMessageStorage();
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
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