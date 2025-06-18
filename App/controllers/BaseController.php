<?php

class BaseController {

    protected $app;
    
    public function __construct() {
        // Get application instance
        $this->app = $GLOBALS['app'] ?? null;
        
        // Load logger if available
        if (file_exists(__DIR__ . '/../utils/AppLogger.php')) {
            require_once __DIR__ . '/../utils/AppLogger.php';
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            header('Content-Type: application/json');
        }

        // Log controller instantiation
        if (function_exists('logger')) {
            logger()->debug("Controller instantiated", [
                'controller' => get_class($this),
                'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'GET'
            ]);
        }
    }
    
    /**
     * Get database connection
     */
    protected function db() {
        return $this->app ? $this->app->getDatabase() : $GLOBALS['db'];
    }
    
    /**
     * Get query builder
     */
    protected function query() {
        return $this->app ? $this->app->getQuery() : $GLOBALS['query'];
    }
    
    /**
     * Get configuration value
     */
    protected function config($key = null) {
        return $this->app ? $this->app->getConfig($key) : null;
    }
    
    /**
     * Get current user ID from session
     */
    protected function getCurrentUserId() {
        return $_SESSION['user_id'] ?? null;
    }
    
    /**
     * Check if user is authenticated
     */
    protected function isAuthenticated() {
        return isset($_SESSION['user_id']);
    }
    
    /**
     * Require authentication
     */
    protected function requireAuth() {
        if (!$this->isAuthenticated()) {
            if ($this->isApiRoute()) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
            } else {
                header('Location: /login');
                exit;
            }
        }
    }
    
    /**
     * Enhanced JSON response with consistent format
     */
    protected function jsonResponse($data, $statusCode = 200, $headers = []) {
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
        
        // Add error information for error responses
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
    
    /**
     * Success response helper
     */
    protected function success($data = null, $message = 'Success') {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->jsonResponse($response);
    }
    
    /**
     * Success response helper (alias for success())
     */
    protected function successResponse($data = null, $message = 'Success') {
        return $this->success($data, $message);
    }
    
    /**
     * Error response helper
     */
    protected function error($message, $statusCode = 400, $data = null) {
        $response = ['error' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->jsonResponse($response, $statusCode);
    }
    
    /**
     * Validation error response
     */
    protected function validationError($errors, $message = 'Validation failed') {
        $this->error($message, 422, ['validation_errors' => $errors]);
    }
    
    /**
     * Server error response
     */
    protected function serverError($message = 'Internal server error') {
        $this->error($message, 500);
    }
    
    /**
     * Not found response
     */
    protected function notFound($message = 'Resource not found') {
        $this->error($message, 404);
    }
    
    /**
     * Unauthorized response
     */
    protected function unauthorized($message = 'Unauthorized') {
        $this->error($message, 401);
    }
    
    /**
     * Forbidden response
     */
    protected function forbidden($message = 'Forbidden') {
        $this->error($message, 403);
    }
    
    /**
     * Redirect response for AJAX/API requests
     */
    protected function redirectResponse($url, $message = 'Redirecting') {
        return $this->success(['redirect' => $url], $message);
    }
    
    /**
     * Get redirect URL after authentication
     */
    protected function getRedirectUrl() {
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
    
    /**
     * Redirect to login page
     */
    protected function redirectToLogin($redirect = null) {
        if ($redirect) {
            $_SESSION['login_redirect'] = $redirect;
        }
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->unauthorized('Authentication required');
        }
        
        header('Location: /login' . ($redirect ? '?redirect=' . urlencode($redirect) : ''));
        exit;
    }
    
    /**
     * Generic redirect helper
     */
    protected function redirect($url) {
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->redirectResponse($url);
        }
        
        header('Location: ' . $url);
        exit;
    }

    /**
     * Validate required fields in request data
     */
    protected function validate($data, $rules) {
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
    
    /**
     * Check if current request is an API route
     */
    protected function isApiRoute() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($uri, '/api/') === 0;
    }
    
    /**
     * Check if current request is an AJAX request
     */
    protected function isAjaxRequest() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
    
    /**
     * Get request input data (works with JSON and form data)
     */
    protected function getInput() {
        $input = [];
        
        // Handle JSON input
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $jsonInput = file_get_contents('php://input');
            $decoded = json_decode($jsonInput, true);
            if ($decoded !== null) {
                $input = $decoded;
            }
        }
        
        // Merge with POST data
        $input = array_merge($input, $_POST);
        
        return $input;
    }
    
    /**
     * Sanitize input data
     */
    protected function sanitize($data) {
        if (is_array($data)) {
            return array_map([$this, 'sanitize'], $data);
        }
        
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Log activity
     */
    protected function logActivity($action, $data = []) {
        if (function_exists('logger')) {
            logger()->info("Controller action: {$action}", array_merge([
                'controller' => get_class($this),
                'user_id' => $this->getCurrentUserId(),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
            ], $data));
        }
    }

    /**
     * Handle file upload
     */
    protected function uploadImage($file, $folder = 'uploads') {
        // Basic file upload implementation
        // This is a stub - you should implement proper file validation and upload logic
        
        if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Invalid file upload');
        }
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPG, PNG, and GIF are allowed.');
        }
        
        // Create upload directory if it doesn't exist
        $uploadDir = __DIR__ . '/../public/uploads/' . $folder;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '.' . $extension;
        $filepath = $uploadDir . '/' . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Return relative URL
            return '/uploads/' . $folder . '/' . $filename;
        } else {
            throw new Exception('Failed to upload file');
        }
    }
}