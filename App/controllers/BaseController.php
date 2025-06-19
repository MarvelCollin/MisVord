<?php

class BaseController
{

    protected $app;
    protected $ajaxConfig;    public function __construct()
    {
        $this->app = $GLOBALS['app'] ?? null;

        if (file_exists(__DIR__ . '/../config/db.php')) {
            require_once __DIR__ . '/../config/db.php';
        }

        if (file_exists(__DIR__ . '/../database/query.php')) {
            require_once __DIR__ . '/../database/query.php';
        }

        if (file_exists(__DIR__ . '/../utils/AppLogger.php')) {
            require_once __DIR__ . '/../utils/AppLogger.php';
        }

        if (file_exists(__DIR__ . '/../config/ajax.php')) {
            $this->ajaxConfig = require_once __DIR__ . '/../config/ajax.php';
        } else {
            $this->ajaxConfig = ['enabled' => true];
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            header('Content-Type: application/json');
            
            if ($this->ajaxConfig['cors']['enabled'] ?? false) {
                $this->applyCorsHeaders();
            }
        }

        if (function_exists('logger')) {
            logger()->debug("Controller instantiated", [
                'controller' => get_class($this),
                'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
                'is_ajax' => $this->isAjaxRequest() ? 'yes' : 'no'
            ]);
        }
    }

    protected function applyCorsHeaders() {
        $cors = $this->ajaxConfig['cors'] ?? [];
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = $cors['allowed_origins'] ?? ['*'];
        
        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        $allowedMethods = implode(', ', $cors['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
        header("Access-Control-Allow-Methods: $allowedMethods");
        
        $allowedHeaders = implode(', ', $cors['allowed_headers'] ?? ['Content-Type', 'X-Requested-With']);
        header("Access-Control-Allow-Headers: $allowedHeaders");
        
        if ($cors['supports_credentials'] ?? true) {
            header("Access-Control-Allow-Credentials: true");
        }
        
        $maxAge = $cors['max_age'] ?? 86400;
        header("Access-Control-Max-Age: $maxAge");
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
    }    protected function db()
    {
        if ($this->app && method_exists($this->app, 'getDatabase')) {
            return $this->app->getDatabase();
        }
        
        require_once __DIR__ . '/../config/db.php';
        return Database::getInstance();
    }    protected function query()
    {
        if ($this->app && method_exists($this->app, 'getQuery')) {
            return $this->app->getQuery();
        }
        
        require_once __DIR__ . '/../database/query.php';
        return new Query();
    }

    protected function config($key = null)
    {
        return $this->app ? $this->app->getConfig($key) : null;
    }

    protected function getCurrentUserId()
    {
        return $_SESSION['user_id'] ?? null;
    }

    protected function isAuthenticated()
    {
        return isset($_SESSION['user_id']);
    }

    protected function requireAuth()
    {
        if (!$this->isAuthenticated()) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
            } else {
                header('Location: /login');
                exit;
            }
        }
    }

    protected function jsonResponse($data, $statusCode = 200, $headers = [])
    {
        http_response_code($statusCode);

        foreach ($headers as $name => $value) {
            header("{$name}: {$value}");
        }

        if (!headers_sent()) {
            header('Content-Type: application/json');
        }

        $response = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'timestamp' => date('Y-m-d H:i:s'),
            'data' => $data
        ];

        if ($statusCode >= 400) {
            $response['error'] = [
                'code' => $statusCode,
                'message' => is_string($data) ? $data : ($data['error'] ?? 'An error occurred')
            ];
            unset($response['data']);
        }

        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }

    protected function success($data = null, $message = 'Success')
    {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->jsonResponse($response);
    }

    protected function successResponse($data = null, $message = 'Success')
    {
        return $this->success($data, $message);
    }

    protected function error($message, $statusCode = 400, $data = null)
    {
        $response = ['error' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->jsonResponse($response, $statusCode);
    }

    protected function validationError($errors, $message = 'Validation failed')
    {
        $this->error($message, 422, ['validation_errors' => $errors]);
    }

    protected function serverError($message = 'Internal server error')
    {
        $this->error($message, 500);
    }

    protected function notFound($message = 'Resource not found')
    {
        $this->error($message, 404);
    }

    protected function unauthorized($message = 'Unauthorized')
    {
        $this->error($message, 401);
    }

    protected function forbidden($message = 'Forbidden')
    {
        $this->error($message, 403);
    }

    protected function redirectResponse($url, $message = 'Redirecting')
    {
        return $this->success(['redirect' => $url], $message);
    }

    protected function getRedirectUrl()
    {
        $redirect = '/app';

        if (isset($_SESSION['pending_invite'])) {
            $redirect = '/join/' . $_SESSION['pending_invite'];
            unset($_SESSION['pending_invite']);
        } elseif (isset($_SESSION['login_redirect'])) {
            $redirect = $_SESSION['login_redirect'];
            unset($_SESSION['login_redirect']);
        }

        return $redirect;
    }

    protected function redirectToLogin($redirect = null)
    {
        if ($redirect) {
            $_SESSION['login_redirect'] = $redirect;
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->unauthorized('Authentication required');
        }

        header('Location: /login' . ($redirect ? '?redirect=' . urlencode($redirect) : ''));
        exit;
    }

    protected function redirect($url)
    {
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->redirectResponse($url);
        }

        header('Location: ' . $url);
        exit;
    }

    protected function validate($data, $rules)
    {
        $errors = [];

        foreach ($rules as $field => $rule) {
            if ($rule === 'required' && (!isset($data[$field]) || empty($data[$field]))) {
                $errors[] = "Field '{$field}' is required";
            }
        }

        if (!empty($errors)) {
            $this->error('Validation failed', 400, ['validation_errors' => $errors]);
        }

        return true;
    }

    protected function isApiRoute()
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($uri, '/api/') === 0;
    }

    protected function isAjaxRequest()
    {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }

    protected function getInput()
    {
        $input = [];

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $jsonInput = file_get_contents('php://input');
            $decoded = json_decode($jsonInput, true);
            if ($decoded !== null) {
                $input = $decoded;
            }
        }

        $input = array_merge($input, $_POST);

        return $input;
    }

    protected function sanitize($data)
    {
        if (is_array($data)) {
            return array_map([$this, 'sanitize'], $data);
        }

        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }

    protected function logActivity($action, $data = [])
    {
        if (!$this->isAuthenticated()) {
            return;
        }

        $userId = $this->getCurrentUserId();
        $currentTime = new DateTime();
        $timestamp = $currentTime->format('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

        $activityData = [
            'user_id' => $userId,
            'action' => $action,
            'timestamp' => $timestamp,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'data' => json_encode($data)
        ];        try {
            $query = $this->query();
            
            if (!$query->tableExists('activity_logs')) {
                if (function_exists('logger')) {
                    logger()->warning("Activity logs table does not exist, skipping activity logging");
                }
                return;
            }
            
            $result = $query->table('activity_logs')->insert($activityData);
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Failed to log activity", [
                    'error' => $e->getMessage(),
                    'activity' => $activityData
                ]);
            }
        }
    }

    protected function uploadImage($file, $folder = 'uploads')
    {
        if (!$file || !isset($file['tmp_name']) || empty($file['tmp_name'])) {
            throw new Exception('No file uploaded');
        }

        $targetDir = dirname(__DIR__) . "/public/assets/{$folder}/";
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $filename = uniqid() . '_' . basename($file['name']);
        $targetFile = $targetDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
            throw new Exception('Failed to upload file');
        }

        return "/assets/{$folder}/{$filename}";
    }
    
    protected function notifyViaSocket($userId, $event, $data)
    {
        if (!($this->ajaxConfig['socket']['enabled'] ?? true)) {
            return false;
        }
        
        try {
            require_once __DIR__ . '/../utils/WebSocketClient.php';
            
            $socketConfig = $this->ajaxConfig['socket'] ?? [
                'host' => 'localhost',
                'port' => 1002,
                'path' => '/socket.io'
            ];
            
            $client = new WebSocketClient(
                $socketConfig['host'],
                $socketConfig['port'],
                $socketConfig['path']
            );
            
            return $client->emit('notify-user', [
                'userId' => $userId,
                'event' => $event,
                'data' => $data
            ]);
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Socket notification failed", [
                    'error' => $e->getMessage(),
                    'userId' => $userId,
                    'event' => $event
                ]);
            }
            return false;
        }
    }
    
    protected function broadcastViaSocket($event, $data, $room = null)
    {
        if (!($this->ajaxConfig['socket']['enabled'] ?? true)) {
            return false;
        }
        
        try {
            require_once __DIR__ . '/../utils/WebSocketClient.php';
            
            $socketConfig = $this->ajaxConfig['socket'] ?? [
                'host' => 'localhost',
                'port' => 1002,
                'path' => '/socket.io'
            ];
            
            $client = new WebSocketClient(
                $socketConfig['host'],
                $socketConfig['port'],
                $socketConfig['path']
            );
            
            $payload = [
                'event' => $event,
                'data' => $data
            ];
            
            if ($room) {
                $payload['room'] = $room;
                return $client->emit('broadcast-to-room', $payload);
            }
            
            return $client->emit('broadcast', $payload);
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Socket broadcast failed", [
                    'error' => $e->getMessage(),
                    'event' => $event
                ]);
            }
            return false;
        }
    }

    protected function notifyUserOnline($userId)
    {
        require_once __DIR__ . '/SocketController.php';
        $socketController = new SocketController();
        
        $currentTime = new DateTime();
        $timestamp = $currentTime->format('Y-m-d H:i:s');
        
        $socketController->emitCustomEvent('update-presence', [
            'userId' => $userId,
            'status' => 'online',
            'timestamp' => $timestamp
        ]);
    }
    
    protected function notifyUserOffline($userId)
    {
        require_once __DIR__ . '/SocketController.php';
        $socketController = new SocketController();
        
        $currentTime = new DateTime();
        $timestamp = $currentTime->format('Y-m-d H:i:s');
        
        $socketController->emitCustomEvent('update-presence', [
            'userId' => $userId,
            'status' => 'offline',
            'timestamp' => $timestamp
        ]);
    }
}