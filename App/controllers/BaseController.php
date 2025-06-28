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

        if ($this->isApiRoute() || ($this->isAjaxRequest() && !isset($_GET['render_html']))) {
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
        
        $allowedHeaders = implode(', ', $cors['allowed_headers'] ?? ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With']);
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
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
            return false;
        }
        
        if ($this->isSessionExpired()) {
            $this->clearAuthSession();
            return false;
        }
        
        $_SESSION['last_activity'] = time();
        return true;
    }
    
    protected function isSessionExpired()
    {
        $max_lifetime = $this->getSessionLifetime();
        
        if (!isset($_SESSION['last_activity'])) {
            return false; 
        }
        
        $inactive = time() - $_SESSION['last_activity'];
        return ($inactive > $max_lifetime);
    }
    
    protected function getSessionLifetime()
    {
        $configLifetime = ini_get('session.cookie_lifetime');
        
        if (!$configLifetime) {
            return 86400;
        }
        
        return (int)$configLifetime;
    }
    
    protected function clearAuthSession()
    {
        $_SESSION = array();
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
            setcookie('PHPSESSID', '', time() - 42000, '/');
        }
        
        session_destroy();
    }
        
    protected function requireAuth()
    {
        if (!$this->isAuthenticated()) {
            $redirectUrl = urlencode($_SERVER['REQUEST_URI']);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                $this->jsonResponse([
                    'error' => 'Unauthorized', 
                    'redirect' => "/login?redirect=$redirectUrl"
                ], 401);
                exit;
            } else {
                if (!headers_sent()) {
                header("Location: /login?redirect=$redirectUrl");
                }
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
    }   
    
    protected function success($data = [], $message = 'Success', $code = 200)
    {
        http_response_code($code);
        header('Content-Type: application/json');
        
        if (is_array($data) && isset($data['success'])) {
            echo json_encode($data);
        } else {
            $response = [
                'success' => true,
                'message' => $message,
                'data' => $data,
                'code' => $code,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            echo json_encode($response);
        }
        exit;
    }

    protected function successResponse($data = null, $message = 'Success')
    {
        return $this->success($data, $message);
    }    
    protected function error($message, $code = 400)
    {
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            http_response_code($code);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'timestamp' => date('Y-m-d H:i:s'),
                'error' => [
                    'code' => $code,
                    'message' => $message
                ]
            ]);
            exit;
        }
        
        return [
            'success' => false,
            'code' => $code,
            'message' => $message
        ];
    }

    protected function validationError($errors, $message = 'Validation failed')
    {
        http_response_code(400);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'code' => 400,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode($response);
        exit;
    }

    protected function serverError($message = 'Internal server error', $code = 500)
    {
        http_response_code($code);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'code' => $code,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode($response);
        exit;
    }

    protected function notFound($message = 'Resource not found')
    {
        http_response_code(404);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'code' => 404,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode($response);
        exit;
    }

    protected function forbidden($message = 'Access forbidden')
    {
        http_response_code(403);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'code' => 403,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode($response);
        exit;
    }

    protected function unauthorized($message = 'Unauthorized access')
    {
        http_response_code(401);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'code' => 401,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode($response);
        exit;
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
                $errors[$field] = "Field '{$field}' is required";
            }
        }

        if (!empty($errors)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                $this->validationError($errors, 'Validation failed');
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
        $requestPath = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($requestPath, '/api/') === 0;
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

        if (!is_array($input)) {
            $input = [];
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

    protected function uploadImage($file, $folder = null)
    {
        if (!$file || !isset($file['tmp_name']) || empty($file['tmp_name'])) {
            throw new Exception('No file uploaded');
        }

        $baseDir = dirname(__DIR__) . "/public/storage/";
        if (!is_dir($baseDir)) {
            if (!mkdir($baseDir, 0755, true)) {
                throw new Exception('Failed to create storage directory');
            }
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (empty($extension)) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            $mimeToExt = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp'
            ];
            
            $extension = $mimeToExt[$mimeType] ?? 'jpg';
        }

        $filename = uniqid() . '_' . ($folder ? $folder : 'file') . '.' . $extension;
        $targetFile = $baseDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
            throw new Exception('Failed to upload file');
        }

        return '/public/storage/' . $filename;
    }
    

}