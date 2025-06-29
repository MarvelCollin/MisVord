<?php

require_once __DIR__ . '/../controllers/FriendController.php';
require_once __DIR__ . '/../controllers/ChatController.php';
require_once __DIR__ . '/../controllers/HomeController.php';

function handleAjaxRoutes() {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];
    
    if (strpos($uri, '/ajax/') !== 0) {
        return false;
    }
    
    header('Content-Type: application/json');
    
    try {
        $route = substr($uri, 6);
        
        switch ($route) {
            case 'friends/all':
                handleGetAllFriends();
                break;
                
            case 'friends/online':
                handleGetOnlineFriends();
                break;
                
            case 'friends/pending':
                handleGetPendingRequests();
                break;
                
            case 'friends/pending-count':
                handleGetPendingCount();
                break;
                
            case 'friends/send':
                if ($method === 'POST') {
                    handleSendFriendRequest();
                } else {
                    http_response_code(405);
                    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                }
                break;
                
            case 'friends/accept':
                if ($method === 'POST') {
                    handleAcceptFriendRequest();
                } else {
                    http_response_code(405);
                    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                }
                break;
                
            case 'friends/decline':
                if ($method === 'POST') {
                    handleDeclineFriendRequest();
                } else {
                    http_response_code(405);
                    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                }
                break;
                
            case 'friends/cancel':
                if ($method === 'POST') {
                    handleCancelFriendRequest();
                } else {
                    http_response_code(405);
                    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                }
                break;
                
            case 'chat/create-dm':
                if ($method === 'POST') {
                    handleCreateDirectMessage();
                } else {
                    http_response_code(405);
                    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                }
                break;
                
            case 'home/content':
                handleGetHomeContent();
                break;
                
            case 'home/layout':
                handleGetHomeLayout();
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'AJAX route not found']);
                break;
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("AJAX Route Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Internal server error',
            'error' => $e->getMessage()
        ]);
        return true;
    }
}

function handleGetAllFriends() {
    $controller = new FriendController();
    
    try {
        $friendData = $controller->getUserFriends();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'friends' => $friendData['friends'] ?? [],
                'current_user' => $friendData['currentUser'] ?? null
            ],
            'message' => 'Friends retrieved successfully'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to get friends: ' . $e->getMessage()
        ]);
    }
}

function handleGetOnlineFriends() {
    $controller = new FriendController();
    
    try {
        $onlineFriends = $controller->getOnlineFriends();
        
        if (is_array($onlineFriends)) {
            echo json_encode([
                'success' => true,
                'data' => ['friends' => $onlineFriends],
                'message' => 'Online friends retrieved successfully'
            ]);
        } else {
            $response = $onlineFriends;
            echo json_encode($response);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to get online friends: ' . $e->getMessage()
        ]);
    }
}

function handleGetPendingRequests() {
    $controller = new FriendController();
    
    try {
        $pendingData = $controller->getPendingRequests();
        
        if (is_array($pendingData)) {
            echo json_encode([
                'success' => true,
                'data' => $pendingData,
                'message' => 'Pending requests retrieved successfully'
            ]);
        } else {
            echo json_encode($pendingData);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to get pending requests: ' . $e->getMessage()
        ]);
    }
}

function handleGetPendingCount() {
    $controller = new FriendController();
    
    try {
        $count = $controller->getPendingRequestsCount();
        
        if (is_array($count) && isset($count['success'])) {
            echo json_encode($count);
        } else {
            echo json_encode([
                'success' => true,
                'data' => ['count' => (int)$count],
                'message' => 'Pending count retrieved successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to get pending count: ' . $e->getMessage()
        ]);
    }
}

function handleSendFriendRequest() {
    $controller = new FriendController();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    
    if (empty($username)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username is required'
        ]);
        return;
    }
    
    try {
        $_POST['username'] = $username;
        
        ob_start();
        $result = $controller->sendFriendRequest();
        $output = ob_get_clean();
        
        if (is_array($result)) {
            echo json_encode($result);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Friend request sent successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to send friend request: ' . $e->getMessage()
        ]);
    }
}

function handleAcceptFriendRequest() {
    $controller = new FriendController();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $requestId = $input['id'] ?? '';
    
    if (empty($requestId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Request ID is required'
        ]);
        return;
    }
    
    try {
        $_GET['id'] = $requestId;
        
        ob_start();
        $result = $controller->acceptFriendRequest($requestId);
        $output = ob_get_clean();
        
        if (is_array($result)) {
            echo json_encode($result);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Friend request accepted successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to accept friend request: ' . $e->getMessage()
        ]);
    }
}

function handleDeclineFriendRequest() {
    $controller = new FriendController();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $requestId = $input['id'] ?? '';
    
    if (empty($requestId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Request ID is required'
        ]);
        return;
    }
    
    try {
        $_GET['id'] = $requestId;
        
        ob_start();
        $result = $controller->declineFriendRequest($requestId);
        $output = ob_get_clean();
        
        if (is_array($result)) {
            echo json_encode($result);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Friend request declined successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to decline friend request: ' . $e->getMessage()
        ]);
    }
}

function handleCancelFriendRequest() {
    $controller = new FriendController();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? '';
    
    if (empty($userId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'User ID is required'
        ]);
        return;
    }
    
    try {
        $_POST['user_id'] = $userId;
        
        ob_start();
        $result = $controller->removeFriend();
        $output = ob_get_clean();
        
        if (is_array($result)) {
            echo json_encode($result);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Friend request cancelled successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to cancel friend request: ' . $e->getMessage()
        ]);
    }
}

function handleCreateDirectMessage() {
    $controller = new ChatController();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $friendId = $input['friend_id'] ?? '';
    
    if (empty($friendId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Friend ID is required'
        ]);
        return;
    }
    
    try {
        $_POST['friend_id'] = $friendId;
        
        ob_start();
        $result = $controller->createDirectMessage();
        $output = ob_get_clean();
        
        if (is_array($result)) {
            echo json_encode($result);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Direct message created successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create direct message: ' . $e->getMessage()
        ]);
    }
}

function handleGetHomeContent() {
    $controller = new HomeController();
    
    try {
        ob_start();
        $content = $controller->getHomeContent();
        $output = ob_get_clean();
        
        if (is_array($content)) {
            echo json_encode($content);
        } else {
            echo json_encode([
                'success' => true,
                'data' => ['html' => $content],
                'message' => 'Home content retrieved successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to get home content: ' . $e->getMessage()
        ]);
    }
}

function handleGetHomeLayout() {
    $controller = new HomeController();
    
    try {
        ob_start();
        $layout = $controller->getHomeLayout();
        $output = ob_get_clean();
        
        if (is_array($layout)) {
            echo json_encode($layout);
        } else {
            echo json_encode([
                'success' => true,
                'data' => ['html' => $layout],
                'message' => 'Home layout retrieved successfully'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to get home layout: ' . $e->getMessage()
        ]);
    }
}

function getInput() {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return $_POST;
    }
    
    $decoded = json_decode($input, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        return $decoded;
    }
    
    return $_POST;
}

function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    if (is_string($data)) {
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
    
    return $data;
}

function validateRequired($data, $requiredFields) {
    $errors = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $errors[$field] = "Field '{$field}' is required";
        }
    }
    
    return $errors;
}

function isAuthenticated() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function requireAuth() {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }
}

function logAjaxRequest($route, $method, $data = null) {
    if (!function_exists('logger')) {
        return;
    }
    
    logger()->info("AJAX Request", [
        'route' => $route,
        'method' => $method,
        'user_id' => $_SESSION['user_id'] ?? 'guest',
        'data_size' => $data ? strlen(json_encode($data)) : 0,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

if (php_sapi_name() !== 'cli') {
    session_start();
    requireAuth();
    
    $handled = handleAjaxRoutes();
    
    if (!$handled) {
        return false;
    }
    
    exit;
}

return true;
