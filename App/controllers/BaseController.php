<?php

class BaseController
{
    protected $app;
    protected $ajaxConfig;

    public function __construct()
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
            require_once __DIR__ . '/../config/session.php';
            if (!headers_sent()) {
                session_start();
            }
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
    }    protected function requireAuth()
    {
        if (function_exists('logger')) {
            logger()->debug("requireAuth called", [
                'session_status' => session_status(),
                'user_id' => $_SESSION['user_id'] ?? 'not_set',
                'is_authenticated' => $this->isAuthenticated(),
                'session_data' => $_SESSION
            ]);
        }
        
        if (!$this->isAuthenticated()) {
            if (function_exists('logger')) {
                logger()->warning("User not authenticated, redirecting to login", [
                    'session_data' => $_SESSION,
                    'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
                ]);
            }
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
            } else {
                header('Location: /login');
                exit;
            }
        } else {
            if (function_exists('logger')) {
                logger()->debug("User authenticated successfully", [
                    'user_id' => $_SESSION['user_id']
                ]);
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

        $response = [];
        
        if (isset($data['success'])) {
            $response['success'] = $data['success'];
            unset($data['success']);
        } else {
            $response['success'] = $statusCode >= 200 && $statusCode < 300;
        }
        
        if (isset($data['message'])) {
            $response['message'] = $data['message'];
            unset($data['message']);
        }
        
        $response['timestamp'] = date('Y-m-d H:i:s');
        
        if ($statusCode >= 400) {
            if (is_string($data)) {
                $response['error'] = [
                    'code' => $statusCode,
                    'message' => $data
                ];
            } else if (isset($data['error'])) {
                $response['error'] = is_array($data['error']) ? 
                    $data['error'] : 
                    ['code' => $statusCode, 'message' => $data['error']];
            } else {
                $response['error'] = [
                    'code' => $statusCode,
                    'message' => 'An error occurred'
                ];
            }
        } else {
            if (isset($data['data'])) {
                $response['data'] = $data['data'];
            } else if (!isset($data['success']) && !isset($data['message']) && !isset($data['timestamp'])) {
                $response['data'] = $data;
            } else {
                foreach ($data as $key => $value) {
                    if (!isset($response[$key])) {
                        $response[$key] = $value;
                    }
                }
            }
        }

        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }    protected function success($data = null, $message = 'Success')
    {
        $response = [
            'success' => true,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s'),
            'data' => $data
        ];
        
        $this->jsonResponse($response);
    }

    protected function successResponse($data = null, $message = 'Success')
    {
        return $this->success($data, $message);
    }    protected function error($message, $statusCode = 400, $data = null)
    {
        $response = ['error' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->jsonResponse($response, $statusCode);
            return false;
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
        $redirect = '/home';

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
    }    protected function validate($data, $rules)
    {
        $errors = [];

        foreach ($rules as $field => $rule) {
            if ($rule === 'required' && (!isset($data[$field]) || empty($data[$field]))) {
                $errors[] = "Field '{$field}' is required";
            }
        }

        if (!empty($errors)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                $this->error('Validation failed', 400, ['validation_errors' => $errors]);
            } else {
                $_SESSION['errors'] = ['validation' => $errors];
                $_SESSION['old_input'] = $data;
                
                $referer = $_SERVER['HTTP_REFERER'] ?? $_SERVER['REQUEST_URI'] ?? '/login';
                
                if (!headers_sent()) {
                    header('Location: ' . $referer);
                }
                exit;
            }
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

        $isDocker = getenv('IS_DOCKER') === 'true';
        
        if ($isDocker) {
            $baseUploadDir = dirname(__DIR__) . "/storage/uploads/";
            $targetDir = $baseUploadDir . $folder . '/';
            
            if (!is_dir($baseUploadDir)) {
                if (!mkdir($baseUploadDir, 0755, true)) {
                    throw new Exception('Failed to create upload base directory');
                }
            }
            
            if (!is_dir($targetDir)) {
                if (!mkdir($targetDir, 0755, true)) {
                    throw new Exception('Failed to create upload target directory');
                }
            }

            $filename = uniqid() . '_' . basename($file['name']);
            $targetFile = $targetDir . $filename;
            
            if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
                throw new Exception('Failed to move uploaded file');
            }

            $publicUrl = "/storage/uploads/{$folder}/{$filename}";
            
            $symlinkedDir = dirname(__DIR__) . "/public/storage/uploads/{$folder}";
            
            if (!is_dir(dirname($symlinkedDir))) {
                if (!mkdir(dirname($symlinkedDir), 0755, true)) {
                    error_log("Warning: Unable to create symlink directory structure");
                }
            }
            
            return $publicUrl;
        } else {
            $targetDir = dirname(__DIR__) . "/public/assets/{$folder}/";
            if (!is_dir($targetDir)) {
                if (!mkdir($targetDir, 0755, true)) {
                    throw new Exception('Failed to create directory');
                }
            }

            $filename = uniqid() . '_' . basename($file['name']);
            $targetFile = $targetDir . $filename;

            if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
                throw new Exception('Failed to upload file');
            }

            return "/assets/{$folder}/{$filename}";
        }
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
                logger()->error("Socket broadcast failed", [                    'error' => $e->getMessage(),
                    'event' => $event
                ]);
            }
            return false;
        }
    }
}