<?php

class BaseController {

    public function __construct() {
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

    protected function view($viewPath, $data = []) {

        extract($data);

        $fullPath = __DIR__ . '/../views/' . $viewPath . '.php';

        if (function_exists('logger')) {
            logger()->debug("Rendering view", [
                'view_path' => $viewPath,
                'full_path' => $fullPath,
                'data_keys' => array_keys($data),
                'exists' => file_exists($fullPath)
            ]);
        }

        if (file_exists($fullPath)) {
            include $fullPath;
        } else {
            if (function_exists('logger')) {
                logger()->error("View not found", [
                    'view_path' => $viewPath,
                    'full_path' => $fullPath
                ]);
            }
            
            http_response_code(404);
            include __DIR__ . '/../views/pages/404.php';
        }
    }

    protected function redirect($url) {
        header("Location: $url");
        exit;
    }

    protected function redirectToLogin() {
        $this->redirect('/login');
    }

    protected function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    protected function successResponse($data = [], $message = 'Success') {
        return $this->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
    }

    protected function errorResponse($message = 'Error', $statusCode = 400) {
        return $this->json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }

    protected function validationError($errors) {
        return $this->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors
        ], 422);
    }

    protected function unauthorized($message = 'Unauthorized') {
        return $this->errorResponse($message, 401);
    }

    protected function forbidden($message = 'Forbidden') {
        return $this->errorResponse($message, 403);
    }

    protected function notFound($message = 'Not found') {
        return $this->errorResponse($message, 404);
    }

    protected function serverError($message = 'Internal server error') {
        return $this->errorResponse($message, 500);
    }

    protected function partialContent($data = [], $message = 'Partial Content') {
        return $this->json([
            'success' => false,
            'message' => $message,
            'data' => $data
        ], 206);
    }

    protected function redirectResponse($url, $message = 'Redirecting') {
        return $this->json([
            'success' => true,
            'message' => $message,
            'redirect' => $url
        ]);
    }

    protected function validateRequired($data, $fields) {
        $errors = [];

        foreach ($fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $errors[$field] = ucfirst($field) . ' is required';
            }
        }

        return $errors;
    }

    protected function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    protected function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([$this, 'sanitizeInput'], $input);
        }

        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    protected function isAuthenticated() {
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }

    protected function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }

        require_once __DIR__ . '/../database/models/User.php';
        return User::find($_SESSION['user_id']);
    }

    protected function isAjaxRequest() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }

    protected function isApiRoute() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($uri, '/api/') === 0 || strpos($uri, '/api/') !== false;
    }

    protected function jsonResponse($data, $statusCode = 200) {
        if (function_exists('logger')) {
            logger()->debug("JSON response", [
                'status_code' => $statusCode,
                'data_keys' => is_array($data) ? array_keys($data) : 'non-array',
                'response_size' => strlen(json_encode($data))
            ]);
        }
        
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    protected function jsonError($message, $statusCode = 400, $context = []) {
        if (function_exists('logger')) {
            logger()->error("JSON error response", array_merge([
                'message' => $message,
                'status_code' => $statusCode
            ], $context));
        }
        
        $this->jsonResponse([
            'success' => false,
            'error' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ], $statusCode);
    }

    protected function jsonSuccess($data = [], $message = null) {
        $response = ['success' => true];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if (!empty($data)) {
            $response = array_merge($response, $data);
        }
        
        $this->jsonResponse($response);
    }

    protected function handleException(Exception $e, $context = []) {
        if (function_exists('logger')) {
            logger()->exception($e, $context);
        }
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            $this->jsonError('An error occurred: ' . $e->getMessage(), 500);
        } else {
            // For web requests, show error page
            $this->view('pages/error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    protected function formatTime($time) {
        if (empty($time)) {
            return 'Just now';
        }

        $sentAt = new DateTime($time);
        $now = new DateTime();

        $diff = $now->diff($sentAt);

        if ($diff->days == 0) {
            return 'Today at ' . $sentAt->format('g:i A');
        } elseif ($diff->days == 1) {
            return 'Yesterday at ' . $sentAt->format('g:i A');
        } elseif ($diff->days < 7) {
            return $sentAt->format('l') . ' at ' . $sentAt->format('g:i A');
        } else {
            return $sentAt->format('M j, Y') . ' at ' . $sentAt->format('g:i A');
        }
    }

    protected function uploadImage($file, $directory = 'uploads') {
        $fileType = exif_imagetype($file['tmp_name']);
        if (!$fileType || !in_array($fileType, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP])) {
            return false;
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = basename($directory) . '_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;

        $uploadDir = __DIR__ . '/../public/assets/uploads/' . $directory . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filepath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            return '/public/assets/uploads/' . $directory . '/' . $filename;
        }

        return false;
    }
}